import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import type { JwtPayload } from '../../../auth/domain/interfaces/jwt-payload.interface';
import { FinanceService } from '../../application/services/finance.service';
import {
  FinanceInvoicesQueryDto,
  FinancePaymentsQueryDto,
  FinanceSummaryQueryDto,
  SendInvoiceDto,
  UpdateRateDto,
} from '../dto/finance.dto';

@Controller('api/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_FINANCIERO, USER_ROLE.ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard/summary')
  async getDashboardSummary(@Query() query: FinanceSummaryQueryDto) {
    const data = await this.financeService.getDashboardSummary(query);
    return { message: 'Resumen financiero obtenido correctamente', data };
  }

  @Get('invoices')
  async getInvoices(@Query() query: FinanceInvoicesQueryDto) {
    const data = await this.financeService.getInvoices(query.status);
    return { message: 'Facturas obtenidas correctamente', data };
  }

  @Get('invoices/:id')
  async getInvoiceById(@Param('id') invoiceId: string) {
    const data = await this.financeService.getInvoiceById(invoiceId);
    return { message: 'Detalle de factura obtenido correctamente', data };
  }

  @Patch('invoices/:id/submit-for-certification')
  async submitForCertification(@Param('id') invoiceId: string, @CurrentUser() user: JwtPayload) {
    const data = await this.financeService.submitForCertification(invoiceId, user.sub);
    return { message: 'Factura enviada al flujo de certificacion correctamente', data };
  }

  @Patch('invoices/:id/send')
  async sendInvoice(@Param('id') invoiceId: string, @Body() dto: SendInvoiceDto) {
    const data = await this.financeService.sendInvoice(invoiceId, dto.pdfPath);
    return { message: 'Factura enviada al cliente correctamente', data };
  }

  @Get('payments')
  async getPayments(@Query() query: FinancePaymentsQueryDto) {
    const data = await this.financeService.getPayments(query.status);
    return { message: 'Pagos obtenidos correctamente', data };
  }

  @Patch('payments/:id/approve')
  async approvePayment(@Param('id') paymentId: string, @CurrentUser() user: JwtPayload) {
    const data = await this.financeService.approvePayment(paymentId, user.sub);
    return { message: 'Pago aprobado correctamente', data };
  }

  @Get('rates')
  async getRates() {
    const data = await this.financeService.getRates();
    return { message: 'Tarifario obtenido correctamente', data };
  }

  @Patch('rates/:id')
  async updateRate(
    @Param('id', ParseIntPipe) vehicleTypeId: number,
    @Body() dto: UpdateRateDto,
  ) {
    const data = await this.financeService.updateRate(vehicleTypeId, dto.ratePerKm);
    return { message: 'Tarifa actualizada correctamente', data };
  }
}
