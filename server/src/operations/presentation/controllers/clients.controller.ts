import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { CreateClientUseCase } from '../../application/use-cases/create-client.use-case';
import { CreateClientDto } from '../dtos/create-client.dto';

@Controller('api/v1/clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_OPERATIVO)
export class ClientsController {
  constructor(private readonly createClientUseCase: CreateClientUseCase) {}

  @Post()
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
      paymentRisk: dto.paymentRisk,
      customsRisk: dto.customsRisk,
      cargoRisk: dto.cargoRisk,
      amlRisk: dto.amlRisk,
    });

    return { message: 'Cliente creado correctamente', data };
  }
}
