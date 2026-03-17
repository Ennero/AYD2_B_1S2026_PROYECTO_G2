import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CertifierService } from '../../application/services/certifier.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import {
  ValidateNitDto,
  CertifyInvoiceDto,
  RejectInvoiceDto,
  CertifierSummaryQueryDto,
} from '../dto/certifier.dto';

/**
 * Controller del Certificador FEL.
 * Protegido por autenticación.
 */
@Controller('api/certifier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_FINANCIERO, USER_ROLE.ADMIN)
export class CertifierController {
  constructor(private readonly certifierService: CertifierService) {}

  @Get('dashboard/summary')
  async getDashboardSummary(@Query() query: CertifierSummaryQueryDto) {
    const data = await this.certifierService.getDashboardSummary(query);
    return { message: 'Resumen FEL obtenido correctamente', data };
  }

  @Get('invoices')
  async getInvoices() {
    const data = await this.certifierService.getPendingInvoices();
    return { message: 'Facturas obtenidas correctamente', data };
  }

  @Post('invoices/:id/validate-nit')
  async validateNit(@Param('id') invoiceId: string, @Body() dto: ValidateNitDto) {
    const data = await this.certifierService.validateNit(invoiceId, dto.clientNit);
    return { message: 'NIT validado correctamente', data };
  }

  @Patch('invoices/:id/certify')
  async certifyInvoice(@Param('id') invoiceId: string, @Body() dto: CertifyInvoiceDto) {
    const data = await this.certifierService.certifyInvoice(invoiceId, dto.felUuid, dto.clientNit);
    return { message: 'Factura certificada correctamente', data };
  }

  @Patch('invoices/:id/reject')
  async rejectInvoice(@Param('id') invoiceId: string, @Body() dto: RejectInvoiceDto) {
    const data = await this.certifierService.rejectInvoice(invoiceId, dto.reason);
    return { message: 'Factura rechazada correctamente', data };
  }
}
