import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateContractUseCase } from '../../application/use-cases/create-contract.use-case';
import { CreateClientUseCase } from '../../application/use-cases/create-client.use-case';
import { CreateClientDto } from '../dtos/create-client.dto';
import { ListCargasUseCase } from '../../application/use-cases/list-cargas.use-case';
import { FormalizeCargaUseCase } from '../../application/use-cases/formalize-carga.use-case';
import { CreateContractDto } from '../dtos/create-contract.dto';
import { FormalizeCargaDto } from '../dtos/formalize-carga.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import type { JwtPayload } from '../../../auth/domain/interfaces/jwt-payload.interface';
import { GetClientsUseCase } from '../../application/use-cases/get-clients.use-case';

/**
 * OperationsController — Endpoints del Agente Operativo y Encargado de Patio.
 *
 * Requiere autenticación JWT.
 * Los roles se validan a nivel de método para permitir acceso diferenciado.
 */
@Controller('api/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_OPERATIVO, USER_ROLE.ENCARGADO_PATIO)
export class OperationsController {
  constructor(
    private readonly createContractUseCase: CreateContractUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly listCargasUseCase: ListCargasUseCase,
    private readonly formalizeCargaUseCase: FormalizeCargaUseCase,
    private readonly getClientsUseCase: GetClientsUseCase,
  ) {}

  // ─── Endpoints del Agente Operativo ────────────────────────────────────

  /**
   * GET /api/operations/clients?search=...
   * Listar clientes con búsqueda opcional.
   */
  @Get('clients')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async listClients(@Query('search') search?: string) {
    const data = await this.getClientsUseCase.execute(search);
    return { message: 'Clientes obtenidos', data };
  }

  /**
   * POST /api/operations/clients
   * Registrar un nuevo cliente.
   */
  @Post('clients')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() dto: CreateClientDto) {
    const data = await this.createClientUseCase.execute({
      legalName: dto.legalName,
      commercialName: dto.commercialName,
      nit: dto.nit,
      taxAddress: dto.taxAddress,
      primaryContactName: dto.primaryContactName,
      primaryContactEmail: dto.primaryContactEmail,
      primaryContactPhone: dto.primaryContactPhone,
      creditLimit: dto.creditLimit,
      paymentRisk: dto.paymentRisk,
      customsRisk: dto.customsRisk,
      cargoRisk: dto.cargoRisk,
      amlRisk: dto.amlRisk,
    });

    return { message: 'Cliente creado correctamente', data };
  }

  /**
   * POST /api/operations/contracts
   * Crear contrato en estado PENDIENTE y enviar propuesta por email.
   */
  @Post('contracts')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.CREATED)
  async createContract(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.createContractUseCase.execute(
      {
        clientId: dto.clientId,
        creditLimit: dto.creditLimit,
        paymentTermDays: dto.paymentTermDays,
        discountPercentage: dto.discountPercentage ?? 0,
        routeIds: dto.routeIds,
        cargoTypeIds: dto.cargoTypeIds,
      },
      user.fullName,
    );

    return { message: 'Contrato generado correctamente', data };
  }

  // ─── Endpoints del Encargado de Patio ──────────────────────────────────

  /**
   * GET /api/operations/cargas
   * Listar cargas pendientes y formalizadas para el Encargado de Patio.
   */
  @Get('cargas')
  @Roles(USER_ROLE.ENCARGADO_PATIO)
  @HttpCode(HttpStatus.OK)
  async listCargas() {
    const data = await this.listCargasUseCase.execute();
    return { message: 'Cargas obtenidas', data };
  }

  /**
   * PATCH /api/operations/cargas/:id/formalizar
   * Formalizar una carga validada por el Encargado de Patio.
   */
  @Patch('cargas/:id/formalizar')
  @Roles(USER_ROLE.ENCARGADO_PATIO)
  @HttpCode(HttpStatus.OK)
  async formalizeCarga(
    @Param('id') orderId: string,
    @Body() dto: FormalizeCargaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.formalizeCargaUseCase.execute(
      orderId,
      dto.loadedWeightTon,
      dto.stowageConfirmed,
      user.fullName,
    );

    return { message: 'Carga formalizada correctamente', data };
  }
}
