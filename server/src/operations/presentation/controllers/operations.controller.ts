import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
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
import { GetCargoTypesUseCase } from '../../application/use-cases/get-cargo-types.use-case';
import { GetClientsUseCase } from '../../application/use-cases/get-clients.use-case';
import { GetRoutesUseCase } from '../../application/use-cases/get-routes.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRole } from '../../../domain/enums/user-role.enum';

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
    private readonly getRoutesUseCase: GetRoutesUseCase,
    private readonly getCargoTypesUseCase: GetCargoTypesUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
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
   * GET /api/operations/routes
   * Catálogo de rutas activas para formalización de contratos.
   */
  @Get('routes')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async listRoutes() {
    const data = await this.getRoutesUseCase.execute();
    return { message: 'Rutas obtenidas', data };
  }

  /**
   * GET /api/operations/cargo-types
   * Catálogo de tipos de carga para contratos.
   */
  @Get('cargo-types')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async listCargoTypes() {
    const data = await this.getCargoTypesUseCase.execute();
    return { message: 'Tipos de carga obtenidos', data };
  }

  /**
   * GET /api/operations/users?search=...&role=...
   * Listar usuarios del sistema para gestión operativa.
   */
  @Get('users')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    const data = await this.getUsersUseCase.execute(search, role);
    return { message: 'Usuarios obtenidos', data };
  }

  /**
   * PATCH /api/operations/users/:id
   * Editar datos básicos de un usuario del sistema.
   */
  @Patch('users/:id')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.updateUserUseCase.execute(userId, {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      isActive: dto.isActive,
    });

    return { message: 'Usuario actualizado correctamente', data };
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
      nit: dto.nit,
      taxAddress: dto.taxAddress,
      primaryContactName: dto.primaryContactName,
      primaryContactEmail: dto.primaryContactEmail,
      portalPassword: dto.portalPassword,
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
    @Param('id', ParseIntPipe) orderId: number,
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
