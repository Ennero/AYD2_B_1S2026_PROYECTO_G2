import { DataSource, DataSourceOptions } from 'typeorm';
import { Client } from '../typeorm/entities/client.entity';
import { User } from '../typeorm/entities/user.entity';
import { PasswordRecoveryToken } from '../typeorm/entities/password-recovery-token.entity';
import { ClientCard } from '../typeorm/entities/client-card.entity';
import { Branch } from '../typeorm/entities/branch.entity';
import { Route } from '../typeorm/entities/route.entity';
import { VehicleType } from '../typeorm/entities/vehicle-type.entity';
import { CargoType } from '../typeorm/entities/cargo-type.entity';
import { Contract } from '../typeorm/entities/contract.entity';
import { ContractRoute } from '../typeorm/entities/contract-route.entity';
import { ContractRate } from '../typeorm/entities/contract-rate.entity';
import { TransportUnit } from '../typeorm/entities/transport-unit.entity';
import { Order } from '../typeorm/entities/order.entity';
import { OrderRouteLog } from '../typeorm/entities/order-route-log.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { Payment } from '../typeorm/entities/payment.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'logitrans_db',
  entities: [
    Client,
    User,
    PasswordRecoveryToken,
    ClientCard,
    Branch,
    Route,
    VehicleType,
    CargoType,
    Contract,
    ContractRoute,
    ContractRate,
    TransportUnit,
    Order,
    OrderRouteLog,
    Invoice,
    Payment,
  ],
  migrations: [__dirname + '/../typeorm/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
