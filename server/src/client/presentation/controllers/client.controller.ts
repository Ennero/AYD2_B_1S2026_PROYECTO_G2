import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import type { JwtPayload } from '../../../auth/domain/interfaces/jwt-payload.interface';
import { ClientService } from '../../application/services/client.service';
import {
  CreateContactDto,
  CreateOrderDto,
  AcceptContractDto,
  UpdateClientProfileDto,
  UpdateContactDto,
  UpdatePasswordDto,
} from '../dto/client.dto';

@Controller('api/client')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.CLIENTE)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────

  @Get('dashboard/summary')
  async getDashboardSummary(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getDashboardSummary(user.sub);
    return { message: 'Dashboard obtenido correctamente', data };
  }

  // ── Catálogos / Órdenes ───────────────────────────────────────────────

  @Get('cargo-types')
  async getCargoTypes() {
    const data = await this.clientService.getCargoTypes();
    return { message: 'Tipos de mercancía obtenidos', data };
  }

  @Get('contracts')
  async getAllContracts(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getAllContracts(user.sub);
    return { message: 'Contratos obtenidos correctamente', data };
  }

  @Get('contracts/active')
  async getActiveContracts(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getActiveContracts(user.sub);
    return { message: 'Contratos vigentes obtenidos', data };
  }

  @Get('contracts/:contractId')
  async getContractDetail(
    @CurrentUser() user: JwtPayload,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    const data = await this.clientService.getContractDetail(user.sub, contractId);
    return { message: 'Detalle del contrato obtenido', data };
  }

  @Patch('contracts/:contractId/accept')
  async acceptContract(
    @CurrentUser() user: JwtPayload,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() dto: AcceptContractDto,
  ) {
    const data = await this.clientService.acceptContract(user.sub, contractId, dto);
    return { message: 'Contrato aceptado correctamente', data };
  }

  @Patch('contracts/:contractId/reject')
  async rejectContract(
    @CurrentUser() user: JwtPayload,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    const data = await this.clientService.rejectContract(user.sub, contractId);
    return { message: 'Contrato rechazado correctamente', data };
  }

  @Get('orders')
  async getOrders(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.clientService.getOrders(
      user.sub,
      search,
      status,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return { message: 'Órdenes obtenidas correctamente', data };
  }

  @Get('orders/:orderId/tracking')
  async getOrderTracking(
    @CurrentUser() user: JwtPayload,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const data = await this.clientService.getOrderTracking(user.sub, orderId);
    return { message: 'Tracking obtenido correctamente', data };
  }

  @Post('orders')
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    const data = await this.clientService.createOrder(user.sub, dto);
    return { message: 'Orden creada correctamente', data };
  }

  // ── Facturas ──────────────────────────────────────────────────────────

  @Get('invoices')
  async getInvoices(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.clientService.getInvoices(
      user.sub,
      search,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return { message: 'Facturas obtenidas correctamente', data };
  }

  // ── Contactos ─────────────────────────────────────────────────────────

  @Get('contacts')
  async getContacts(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getContacts(user.sub);
    return { message: 'Contactos obtenidos correctamente', data };
  }

  @Post('contacts')
  async createContact(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContactDto,
  ) {
    const data = await this.clientService.createContact(user.sub, dto);
    return { message: 'Contacto creado correctamente', data };
  }

  @Patch('contacts/:contactId')
  async updateContact(
    @CurrentUser() user: JwtPayload,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() dto: UpdateContactDto,
  ) {
    const data = await this.clientService.updateContact(user.sub, contactId, dto);
    return { message: 'Contacto actualizado correctamente', data };
  }

  @Delete('contacts/:contactId')
  async removeContact(
    @CurrentUser() user: JwtPayload,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    const data = await this.clientService.removeContact(user.sub, contactId);
    return data;
  }

  @Get('account-statement')
  async getAccountStatement(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getAccountStatement(user.sub);
    return { message: 'Estado de cuenta obtenido correctamente', data };
  }

  // ── Perfil ────────────────────────────────────────────────────────────

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const data = await this.clientService.getProfile(user.sub);
    return { message: 'Perfil obtenido correctamente', data };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateClientProfileDto,
  ) {
    const data = await this.clientService.updateProfile(user.sub, dto.phone);
    return { message: 'Perfil actualizado correctamente', data };
  }

  @Patch('profile/password')
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePasswordDto,
  ) {
    const data = await this.clientService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    return data;
  }
}
