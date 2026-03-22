import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import { BiService } from '../../application/services/bi.service';

class KpisQueryDto {
  @IsEnum(['MONTHLY', 'ANNUAL'])
  @IsOptional()
  period?: string = 'MONTHLY';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number = new Date().getFullYear();

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number = new Date().getMonth() + 1;
}

class RecentOrdersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}

@Controller('api/bi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.GERENCIA)
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('kpis')
  async getKpis(@Query() query: KpisQueryDto) {
    const data = await this.biService.getKpis(
      query.period ?? 'MONTHLY',
      query.year ?? new Date().getFullYear(),
      query.month,
    );
    return { message: 'KPIs obtenidos correctamente', data };
  }

  @Get('branches/distribution')
  async getBranchesDistribution(@Query() query: KpisQueryDto) {
    const data = await this.biService.getBranchesDistribution(
      query.period ?? 'MONTHLY',
      query.year ?? new Date().getFullYear(),
      query.month,
    );
    return { message: 'Distribución por sedes obtenida correctamente', data };
  }

  @Get('orders/recent')
  async getRecentOrders(@Query() query: RecentOrdersQueryDto) {
    const data = await this.biService.getRecentOrders(query.limit ?? 10);
    return { message: 'Órdenes recientes obtenidas correctamente', data };
  }

  @Get('profitability')
  async getProfitability(@Query() query: KpisQueryDto) {
    const data = await this.biService.getProfitability(
      query.period ?? 'MONTHLY',
      query.year ?? new Date().getFullYear(),
      query.month,
    );
    return { message: 'Rentabilidad obtenida correctamente', data };
  }

  @Get('alerts')
  async getAlerts() {
    const data = await this.biService.getAlerts();
    return { message: 'Alertas obtenidas correctamente', data };
  }
}
