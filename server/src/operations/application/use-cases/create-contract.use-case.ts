import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { DataSource, In } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';
import { Contract } from '../../../infrastructure/database/typeorm/entities/contract.entity';
import { ContractRoute } from '../../../infrastructure/database/typeorm/entities/contract-route.entity';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { EmailService } from '../../../notifications/email/application/email.service';

export interface CreateContractInput {
  clientId: string;
  creditLimit: number;
  paymentTermDays: number;
  discountPercentage: number;
  routeIds: number[];
  cargoTypeIds: number[];
}

export interface CreateContractOutput {
  contractId: string;
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
    const normalizedRouteIds = [...new Set((input.routeIds ?? []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (normalizedRouteIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una ruta autorizada.');
    }

    const normalizedCargoTypeIds = [...new Set((input.cargoTypeIds ?? []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];

    // ── 1. Validar que el cliente existe ─────────────────────────────────────
    const client = await this.dataSource
      .getRepository(Client)
      .findOne({ where: { clientId: input.clientId } });

    if (!client) {
      throw new NotFoundException(`Cliente ${input.clientId} no encontrado.`);
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
    const savedContract = await this.dataSource.transaction(async (em) => {
      // Número de contrato secuencial (el trigger de DB también puede generarlo)
      const count = await em.count(Contract);
      const contractNumber = `CONT-${String(count + 1).padStart(5, '0')}`;
      const contractId = randomUUID();

      const contract = em.create(Contract, {
        contractId,
        contractNumber,
        clientId: input.clientId,
        status: ContractStatus.PENDIENTE,
        creditLimit: input.creditLimit,
        paymentTermDays: input.paymentTermDays,
        discountPercentage: input.discountPercentage ?? 0,
      });
      const saved = await em.save(contract);

      // CONTRACT_ROUTES — una fila por ruta incluida
      for (const route of routes) {
        const cr = em.create(ContractRoute, {
          contractId: saved.contractId,
          routeId: route.routeId,
          promisedDeliveryHours: route.estimatedHours,
        });
        await em.save(cr);
      }

      // CONTRACT_CARGO_TYPES — tabla de unión directa por insert
      if (validCargoTypes.length > 0) {
        await em
          .createQueryBuilder()
          .insert()
          .into('contract_cargo_types')
          .values(
            validCargoTypes.map((cargoType) => ({
              contract_id: saved.contractId,
              cargo_type_id: cargoType.cargoTypeId,
            })),
          )
          .execute();
      }

      return saved;
    });

    // ── 4. Notificación al cliente (fire-and-forget) ──────────────────────────
    const portalUrl = this.config.get<string>('PORTAL_URL', 'http://localhost:3001');
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
