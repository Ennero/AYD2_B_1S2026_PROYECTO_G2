import { Module } from '@nestjs/common';
import { BiController } from './presentation/controllers/bi.controller';
import { BiService } from './application/services/bi.service';

@Module({
  controllers: [BiController],
  providers: [BiService],
})
export class BiModule {}
