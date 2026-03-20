import { Module } from '@nestjs/common';
import { FinanceController } from './presentation/controllers/finance.controller';
import { FinanceService } from './application/services/finance.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
