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
import { GerenciaFinanceReadService } from '../../application/services/gerencia-finance-read.service';
import { FinanceService } from '../../application/services/finance.service';
import {
  FinanceInvoicesQueryDto,
  FinancePaymentsQueryDto,
  FinanceSummaryQueryDto,
  SubmitForCertificationDto,
  UpdateRateDto,
} from '../dto/finance.dto';

/**
 * Finance controller exclusively for the GERENCIA role.
 *
 * READ endpoints (GET) → GerenciaFinanceReadService → read replica (db-replica)
 * WRITE endpoints (PATCH) → FinanceService → primary (db-primary)
 *
 * NOTE: Streaming replication is asynchronous (~10-200 ms lag).
 * GET responses may not reflect a PATCH committed milliseconds before.
 * This is acceptable for a management dashboard.
 */
@Controller('api/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.GERENCIA)
export class GerenciaFinanceController {
  constructor(
    private readonly readService: GerenciaFinanceReadService,
    private readonly financeService: FinanceService,
  ) {}

  // ─── READ — served from the read replica ─────────────────────────────────

  @Get('dashboard/summary')
  async getDashboardSummary(@Query() query: FinanceSummaryQueryDto) {
    const now = new Date();
    const year = query.year ?? now.getFullYear();
    const month = query.month ?? now.getMonth() + 1;
    const data = await this.readService.getDashboardSummary(year, month);
    return { message: 'Resumen financiero obtenido correctamente', data };
  }

  @Get('invoices')
  async getInvoices(@Query() query: FinanceInvoicesQueryDto) {
    const data = await this.readService.getInvoices(query.status);
    return { message: 'Facturas obtenidas correctamente', data };
  }

  @Get('invoices/:id')
  async getInvoiceById(@Param('id', ParseIntPipe) invoiceId: number) {
    const data = await this.readService.getInvoiceById(invoiceId);
    return { message: 'Detalle de factura obtenido correctamente', data };
  }

  @Get('payments')
  async getPayments(@Query() query: FinancePaymentsQueryDto) {
    const data = await this.readService.getPayments(query.status);
    return { message: 'Pagos obtenidos correctamente', data };
  }

  @Get('rates')
  async getRates() {
    const data = await this.readService.getRates();
    return { message: 'Tarifario obtenido correctamente', data };
  }

  // ─── WRITE — served from the primary ─────────────────────────────────────

  @Patch('invoices/:id/submit-for-certification')
  async submitForCertification(
    @Param('id', ParseIntPipe) invoiceId: number,
    @Body() dto: SubmitForCertificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.financeService.submitForCertification(
      invoiceId,
      user.sub,
      dto,
    );
    return {
      message: 'Factura borrador enviada a certificacion correctamente',
      data,
    };
  }

  @Patch('payments/:id/approve')
  async approvePayment(
    @Param('id', ParseIntPipe) paymentId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.financeService.approvePayment(paymentId, user.sub);
    return { message: 'Pago aprobado correctamente', data };
  }

  @Patch('rates/:id')
  async updateRate(
    @Param('id', ParseIntPipe) vehicleTypeId: number,
    @Body() dto: UpdateRateDto,
  ) {
    const data = await this.financeService.updateRate(
      vehicleTypeId,
      dto.ratePerKm,
    );
    return { message: 'Tarifa actualizada correctamente', data };
  }
}
