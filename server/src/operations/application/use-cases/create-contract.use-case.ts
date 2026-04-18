import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, QueryFailedError } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';
import { Contract } from '../../../infrastructure/database/typeorm/entities/contract.entity';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { EmailService } from '../../../notifications/email/application/email.service';

export interface ContractRateInput {
  vehicleTypeId: number;
  baseRatePerKm: number;
  discountPercentage?: number;
}

export interface CreateContractInput {
  clientId: number;
  creditLimit: number;
  /** Plazo de pago en días — valor libre definido por el agente */
  paymentTermDays: number;
  discountPercentage: number;
  routeIds: number[];
  cargoTypeIds: number[];
  /** Tarifas por tipo de vehículo en la moneda del contrato (opcional) */
  rates?: ContractRateInput[];
}

export interface CreateContractOutput {
  contractId: number;
  contractNumber: string;
  status: ContractStatus;
  currencyCode: string;
  exchangeRateFromUsd: number;
  taxRate: number;
}

@Injectable()
export class CreateContractUseCase {
  private readonly logger = new Logger(CreateContractUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    input: CreateContractInput,
    agentName: string,
  ): Promise<CreateContractOutput> {
    const normalizedClientId = Number(input.clientId);
    if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
      throw new BadRequestException('El cliente seleccionado no es valido.');
    }

    const normalizedRouteIds = [
      ...new Set(
        (input.routeIds ?? [])
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
    if (normalizedRouteIds.length === 0) {
      throw new BadRequestException(
        'Debe seleccionar al menos una ruta autorizada.',
      );
    }

    const normalizedCargoTypeIds = [
      ...new Set(
        (input.cargoTypeIds ?? [])
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    // ── 1. Validar que el cliente existe ─────────────────────────────────────
    const client = await this.dataSource
      .getRepository(Client)
      .createQueryBuilder('client')
      .where('client.clientId = :clientId', { clientId: normalizedClientId })
      .getOne();

    if (!client) {
      throw new NotFoundException(`Cliente ${input.clientId} no encontrado.`);
    }

    // En lugar de bloquear, cancelamos cualquier propuesta PENDIENTE anterior para que solo haya 1 a la vez.
    // El contrato VIGENTE actual (si existe) se mantiene activo hasta que el cliente acepte este nuevo.
    const existingPending = await this.dataSource.getRepository(Contract).find({
      where: {
        clientId: normalizedClientId,
        status: ContractStatus.PENDIENTE,
      },
    });

    if (existingPending.length > 0) {
      for (const pending of existingPending) {
        pending.status = ContractStatus.CANCELADO;
        await this.dataSource.getRepository(Contract).save(pending);
      }
    }

    // ── 2. Cargar rutas para datos del email ──────────────────────────────────
    const routes = await this.dataSource
      .getRepository(Route)
      .findBy({ routeId: In(normalizedRouteIds) });

    if (routes.length !== normalizedRouteIds.length) {
      throw new BadRequestException(
        'Se enviaron rutas inválidas o inexistentes.',
      );
    }

    const validCargoTypes = normalizedCargoTypeIds.length
      ? await this.dataSource
          .getRepository(CargoType)
          .findBy({ cargoTypeId: In(normalizedCargoTypeIds) })
      : [];

    if (normalizedCargoTypeIds.length !== validCargoTypes.length) {
      throw new BadRequestException(
        'Se enviaron tipos de carga inválidos o inexistentes.',
      );
    }

    // ── 3. Transacción: CONTRACTS + CONTRACT_ROUTES + CONTRACT_CARGO_TYPES ────

    const resolvedCurrencyCode = client.currencyCode;
    const resolvedTaxRate = Number(client.taxRate ?? 0.12);
    const exchangeRateRow = await this.dataSource.query<{
      rate_from_usd: string;
    }>(
      'SELECT rate_from_usd FROM exchange_rates WHERE currency_code = $1 LIMIT 1',
      [resolvedCurrencyCode],
    );
    const resolvedExchangeRate = Number(exchangeRateRow[0]?.rate_from_usd ?? 0);

    if (!Number.isFinite(resolvedExchangeRate) || resolvedExchangeRate <= 0) {
      throw new BadRequestException(
        `No existe una tasa de cambio configurada para la moneda ${resolvedCurrencyCode}.`,
      );
    }

    const savedContract = await this.dataSource.transaction(async (em) => {
      // Número de contrato secuencial (el trigger de DB también puede generarlo)
      const count = await em.count(Contract);
      const contractNumber = `CONT-${String(count + 1).padStart(5, '0')}`;

      const insertedContracts = await em.query<{
        contract_id: number;
        contract_number: string;
        status: ContractStatus;
        end_date: string;
        currency_code: string;
        exchange_rate_from_usd: string;
        tax_rate: string;
      }>(
        `INSERT INTO contracts (
            contract_number,
            client_id,
            status,
            credit_limit,
            currency_code,
            exchange_rate_from_usd,
            tax_rate,
            payment_term_days,
            discount_percentage
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING contract_id, contract_number, status, end_date, currency_code, exchange_rate_from_usd, tax_rate`,
        [
          contractNumber,
          normalizedClientId,
          ContractStatus.PENDIENTE,
          input.creditLimit,
          resolvedCurrencyCode,
          resolvedExchangeRate,
          resolvedTaxRate,
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
          [
            createdContractId,
            Number(route.routeId),
            Number(route.estimatedHours),
          ],
        );
      }

      // CONTRACT_RATES — tarifa por tipo de vehículo en la moneda del contrato
      if (input.rates && input.rates.length > 0) {
        for (const rate of input.rates) {
          const discountPct = rate.discountPercentage ?? 0;
          const finalRate = Number(
            (rate.baseRatePerKm * (1 - discountPct / 100)).toFixed(2),
          );
          await em.query(
            `INSERT INTO contract_rates (contract_id, vehicle_type_id, base_rate_per_km, discount_percentage, final_rate_per_km)
               VALUES ($1, $2, $3, $4, $5)`,
            [
              createdContractId,
              rate.vehicleTypeId,
              rate.baseRatePerKm,
              discountPct,
              finalRate,
            ],
          );
        }
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
        currencyCode: inserted.currency_code,
        exchangeRateFromUsd: Number(inserted.exchange_rate_from_usd),
        taxRate: Number(inserted.tax_rate),
      };
    });

    // ── 4. Notificación al cliente (fire-and-forget) ──────────────────────────
    const routeLabels = routes.map((r) => `${r.origin} → ${r.destination}`);

    this.emailService
      .sendContractProposal({
        to: client.primaryContactEmail,
        clientName: client.primaryContactName,
        contractCode: savedContract.contractNumber,
        routes: routeLabels,
        validUntil: savedContract.endDate,
        totalAmount: Number(input.creditLimit).toFixed(2),
        currency: savedContract.currencyCode,
        agentName,
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
      currencyCode: savedContract.currencyCode,
      exchangeRateFromUsd: savedContract.exchangeRateFromUsd,
      taxRate: savedContract.taxRate,
    };
  }
}
