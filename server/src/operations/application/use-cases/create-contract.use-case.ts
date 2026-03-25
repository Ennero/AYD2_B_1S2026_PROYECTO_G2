import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In, QueryFailedError } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';
import { Contract } from '../../../infrastructure/database/typeorm/entities/contract.entity';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { EmailService } from '../../../notifications/email/application/email.service';

export interface CreateContractInput {
  clientId: number;
  creditLimit: number;
  paymentTermDays: number;
  discountPercentage: number;
  routeIds: number[];
  cargoTypeIds: number[];
}

export interface CreateContractOutput {
  contractId: number;
  contractNumber: string;
  status: ContractStatus;
}

@Injectable()
export class CreateContractUseCase {
  private readonly logger = new Logger(CreateContractUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: CreateContractInput, agentName: string): Promise<CreateContractOutput> {
    const normalizedClientId = Number(input.clientId);
    if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
      throw new BadRequestException('El cliente seleccionado no es valido.');
    }

    const normalizedRouteIds = [...new Set((input.routeIds ?? []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (normalizedRouteIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una ruta autorizada.');
    }

    const normalizedCargoTypeIds = [...new Set((input.cargoTypeIds ?? []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];

    // ── 1. Validar que el cliente existe ─────────────────────────────────────
    const client = await this.dataSource
      .getRepository(Client)
      .createQueryBuilder('client')
      .where('client.clientId = :clientId', { clientId: normalizedClientId })
      .getOne();

    if (!client) {
      throw new NotFoundException(`Cliente ${input.clientId} no encontrado.`);
    }

    // Evitar múltiples contratos activos por cliente con un mensaje de negocio claro.
    const existingActiveOrPending = await this.dataSource.getRepository(Contract).findOne({
      where: {
        clientId: normalizedClientId,
        status: In([ContractStatus.PENDIENTE, ContractStatus.VIGENTE]),
      },
      order: { startDate: 'DESC' },
    });

    if (existingActiveOrPending) {
      throw new BadRequestException(
        `No se puede generar un nuevo contrato para este cliente porque ya tiene un contrato ${existingActiveOrPending.status} (${existingActiveOrPending.contractNumber}). ` +
          'Para continuar, primero debe aceptarse, rechazarse o cerrarse el contrato actual.',
      );
    }

    // ── 2. Cargar rutas para datos del email ──────────────────────────────────
    const routes = await this.dataSource
      .getRepository(Route)
      .findBy({ routeId: In(normalizedRouteIds) });

    if (routes.length !== normalizedRouteIds.length) {
      throw new BadRequestException('Se enviaron rutas inválidas o inexistentes.');
    }

    const validCargoTypes = normalizedCargoTypeIds.length
      ? await this.dataSource
          .getRepository(CargoType)
          .findBy({ cargoTypeId: In(normalizedCargoTypeIds) })
      : [];

    if (normalizedCargoTypeIds.length !== validCargoTypes.length) {
      throw new BadRequestException('Se enviaron tipos de carga inválidos o inexistentes.');
    }

    // ── 3. Transacción: CONTRACTS + CONTRACT_ROUTES + CONTRACT_CARGO_TYPES ────
    let savedContract: {
      contractId: number;
      contractNumber: string;
      status: ContractStatus;
      endDate: string;
    };

    try {
      savedContract = await this.dataSource.transaction(async (em) => {
        // Número de contrato secuencial (el trigger de DB también puede generarlo)
        const count = await em.count(Contract);
        const contractNumber = `CONT-${String(count + 1).padStart(5, '0')}`;

        const insertedContracts = await em.query<{
          contract_id: number;
          contract_number: string;
          status: ContractStatus;
          end_date: string;
        }>(
          `INSERT INTO contracts (
            contract_number,
            client_id,
            status,
            credit_limit,
            payment_term_days,
            discount_percentage
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING contract_id, contract_number, status, end_date`,
          [
            contractNumber,
            normalizedClientId,
            ContractStatus.PENDIENTE,
            input.creditLimit,
            input.paymentTermDays,
            input.discountPercentage ?? 0,
          ],
        );

        const inserted = insertedContracts[0];
        if (!inserted) {
          throw new BadRequestException('No fue posible crear el contrato.');
        }

        const createdContractId = Number(inserted.contract_id);

        // CONTRACT_ROUTES — una fila por ruta incluida
        for (const route of routes) {
          await em.query(
            `INSERT INTO contract_routes (contract_id, route_id, promised_delivery_hours)
            VALUES ($1, $2, $3)`,
            [createdContractId, Number(route.routeId), Number(route.estimatedHours)],
          );
        }

        // CONTRACT_CARGO_TYPES — tabla de unión directa por insert
        if (validCargoTypes.length > 0) {
          await em
            .createQueryBuilder()
            .insert()
            .into('contract_cargo_types')
            .values(
              validCargoTypes.map((cargoType) => ({
                contract_id: createdContractId,
                cargo_type_id: cargoType.cargoTypeId,
              })),
            )
            .execute();
        }

        return {
          contractId: createdContractId,
          contractNumber: inserted.contract_number,
          status: inserted.status,
          endDate: inserted.end_date,
        };
      });
    } catch (error) {
      const dbError =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string; constraint?: string })
          : undefined;

      if (dbError?.code === '23505' && dbError.constraint === 'ux_client_active_contract') {
        throw new BadRequestException(
          'No se puede generar un nuevo contrato porque el cliente ya tiene un contrato pendiente o vigente. ' +
            'Debe finalizarse ese contrato antes de crear otro.',
        );
      }

      throw error;
    }

    // ── 4. Notificación al cliente (fire-and-forget) ──────────────────────────
    const portalUrl = this.config.get<string>('PORTAL_URL', 'http://localhost:3000');
    const routeLabels = routes.map((r) => `${r.origin} → ${r.destination}`);

    this.emailService
      .sendContractProposal({
        to: client.primaryContactEmail,
        clientName: client.primaryContactName,
        contractCode: savedContract.contractNumber,
        routes: routeLabels,
        validUntil: savedContract.endDate,
        totalAmount: Number(input.creditLimit).toFixed(2),
        currency: 'GTQ',
        agentName,
        portalUrl: `${portalUrl}/contratos`,
      })
      .catch((err: Error) =>
        this.logger.error(
          `Error al enviar email de propuesta de contrato ${savedContract.contractNumber}: ${err.message}`,
        ),
      );

    return {
      contractId: savedContract.contractId,
      contractNumber: savedContract.contractNumber,
      status: savedContract.status,
    };
  }
}
