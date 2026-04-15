import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';

@Injectable()
export class GetClientsUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(search?: string) {
    const queryBuilder = this.dataSource.getRepository(Client).createQueryBuilder('client');

    if (search) {
      queryBuilder.where(
        'client.legalName ILIKE :search OR client.nit ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const clients = await queryBuilder.getMany();

    return clients.map((client) => ({
      clientId: Number(client.clientId),
      clientCode: client.clientCode,
      legalName: client.legalName,
      nit: client.nit,
      countryCode: client.countryCode,
      currencyCode: client.currencyCode,
    }));
  }
}
