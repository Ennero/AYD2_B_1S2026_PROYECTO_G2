import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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

/**
 * OperationsController — Endpoints del Agente Operativo.
 *
 * Requiere autenticación JWT y rol AGENTE_OPERATIVO en todos sus endpoints.
 * Patrón a seguir para nuevos módulos de agente.
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
  ) {}

  /**
   * POST /api/operations/clients
   *
   * Registra un nuevo cliente para iniciar su ciclo comercial.
   */
  @Post('clients')
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
   *
   * Crea un contrato en estado PENDIENTE y envía la propuesta por email
   * al contacto primario del cliente usando Resend (NotificationsModule).
   *
   * Body: { clientId, creditLimit, paymentTermDays, discountPercentage, routeIds[], cargoTypeIds[] }
   * Response: { contractId, contractNumber, status: "PENDIENTE" }
   */
  @Post('contracts')
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
    // DTO validation is handled globally if using ValidationPipe
    // Fallbacks just in case
    const data = await this.formalizeCargaUseCase.execute(
      orderId,
      dto.loadedWeightTon || 1,
      dto.stowageConfirmed ?? true,
      user.fullName,
    );

    return { message: 'Carga formalizada correctamente', data };
  }
}
