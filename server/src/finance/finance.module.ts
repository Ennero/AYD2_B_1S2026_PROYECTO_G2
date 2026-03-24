import { Module } from '@nestjs/common';
import { FinanceController } from './presentation/controllers/finance.controller';
import { GerenciaFinanceController } from './presentation/controllers/gerencia-finance.controller';
import { FinanceService } from './application/services/finance.service';
import { GerenciaFinanceReadService } from './application/services/gerencia-finance-read.service';
import { TypeOrmFinanceReadRepository } from './infrastructure/repositories/typeorm-finance-read.repository';
import { FINANCE_READ_REPOSITORY_TOKEN } from './domain/repositories/finance-read.repository.interface';

@Module({
  controllers: [FinanceController, GerenciaFinanceController],
  providers: [
    FinanceService,
    GerenciaFinanceReadService,
    {
      provide: FINANCE_READ_REPOSITORY_TOKEN,
      useClass: TypeOrmFinanceReadRepository,
    },
  ],
})
export class FinanceModule {}
