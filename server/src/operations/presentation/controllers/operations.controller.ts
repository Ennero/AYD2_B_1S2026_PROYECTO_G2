import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CreateRouteUseCase } from '../../application/use-cases/create-route.use-case';
import { CreateCargoTypeUseCase } from '../../application/use-cases/create-cargo-type.use-case';
import { CreateRouteDto } from '../dtos/create-route.dto';
import { CreateCargoTypeDto } from '../dtos/create-cargo-type.dto';
import { UpdateCargoTypeDto } from '../dtos/update-cargo-type.dto';
import { UpdateRouteDto } from '../dtos/update-route.dto';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UpdateCargoTypeUseCase } from '../../application/use-cases/update-cargo-type.use-case';
import { DeleteCargoTypeUseCase } from '../../application/use-cases/delete-cargo-type.use-case';
import { UpdateRouteUseCase } from '../../application/use-cases/update-route.use-case';
import { DeleteRouteUseCase } from '../../application/use-cases/delete-route.use-case';
import { GetVehicleTypesUseCase } from '../../application/use-cases/get-vehicle-types.use-case';

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
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly updateRouteUseCase: UpdateRouteUseCase,
    private readonly deleteRouteUseCase: DeleteRouteUseCase,
    private readonly createCargoTypeUseCase: CreateCargoTypeUseCase,
    private readonly updateCargoTypeUseCase: UpdateCargoTypeUseCase,
    private readonly deleteCargoTypeUseCase: DeleteCargoTypeUseCase,
    private readonly getVehicleTypesUseCase: GetVehicleTypesUseCase,
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
   * GET /api/operations/vehicle-types
   * Tipos de vehículo con tarifa global de referencia (en USD) para parametrizar
   * las tarifas por contrato.
   */
  @Get('vehicle-types')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async listVehicleTypes() {
    const data = await this.getVehicleTypesUseCase.execute();
    return { message: 'Tipos de vehículo obtenidos', data };
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
   * POST /api/operations/routes
   * Añadir una nueva ruta al catálogo.
   */
  @Post('routes')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.CREATED)
  async createRoute(@Body() dto: CreateRouteDto) {
    const data = await this.createRouteUseCase.execute(dto);
    return { message: 'Ruta añadida al catálogo exitosamente', data };
  }

  /**
   * PUT /api/operations/routes/:id
   * Editar una ruta del catálogo.
   */
  @Put('routes/:id')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async updateRoute(
    @Param('id', ParseIntPipe) routeId: number,
    @Body() dto: UpdateRouteDto,
  ) {
    const data = await this.updateRouteUseCase.execute(routeId, {
      routeCode: dto.routeCode,
      origin: dto.origin,
      destination: dto.destination,
      distanceKm: dto.distanceKm,
      estimatedHours: dto.estimatedHours,
      isInternational: dto.isInternational,
    });

    return { message: 'Ruta actualizada exitosamente', data };
  }

  /**
   * DELETE /api/operations/routes/:id
   * Desactivar una ruta del catálogo (borrado lógico).
   */
  @Delete('routes/:id')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async deleteRoute(@Param('id', ParseIntPipe) routeId: number) {
    const data = await this.deleteRouteUseCase.execute(routeId);
    return { message: 'Ruta desactivada exitosamente', data };
  }

  /**
   * POST /api/operations/cargo-types
   * Añadir un nuevo tipo de carga al catálogo.
   */
  @Post('cargo-types')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.CREATED)
  async createCargoType(@Body() dto: CreateCargoTypeDto) {
    const data = await this.createCargoTypeUseCase.execute(
      dto.cargoName,
      dto.requiresRefrigeration,
    );
    return { message: 'Tipo de carga añadido al catálogo exitosamente', data };
  }

  /**
   * PUT /api/operations/cargo-types/:id
   * Editar un tipo de carga del catálogo.
   */
  @Put('cargo-types/:id')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async updateCargoType(
    @Param('id', ParseIntPipe) cargoTypeId: number,
    @Body() dto: UpdateCargoTypeDto,
  ) {
    const data = await this.updateCargoTypeUseCase.execute(cargoTypeId, {
      cargoName: dto.cargoName,
      requiresRefrigeration: dto.requiresRefrigeration,
    });
    return { message: 'Tipo de carga actualizado exitosamente', data };
  }

  /**
   * DELETE /api/operations/cargo-types/:id
   * Eliminar un tipo de carga del catálogo cuando no tiene uso.
   */
  @Delete('cargo-types/:id')
  @Roles(USER_ROLE.AGENTE_OPERATIVO)
  @HttpCode(HttpStatus.OK)
  async deleteCargoType(@Param('id', ParseIntPipe) cargoTypeId: number) {
    const data = await this.deleteCargoTypeUseCase.execute(cargoTypeId);
    return { message: 'Tipo de carga eliminado exitosamente', data };
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
      countryCode: dto.countryCode,
      currencyCode: dto.currencyCode,
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
        rates: dto.rates,
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
