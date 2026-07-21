import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource, DataSourceOptions } from 'typeorm';
import { Client } from '../typeorm/entities/client.entity';
import { ClientContact } from '../typeorm/entities/client-contact.entity';
import { User } from '../typeorm/entities/user.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { PasswordRecoveryToken } from '../typeorm/entities/password-recovery-token.entity';
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
import { getDatabaseRuntimeConfig } from './database-env';

const databaseConfig = getDatabaseRuntimeConfig();

export const databaseEntities = [
  Client,
  ClientContact,
  User,
  UserSession,
  PasswordRecoveryToken,
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
];

const sslEnabled = ['1', 'true', 'yes', 'on'].includes(
  (process.env.DB_SSL ?? '').toLowerCase(),
);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: databaseConfig.host,
  port: databaseConfig.port,
  username: databaseConfig.username,
  password: databaseConfig.password,
  database: databaseConfig.database,
  entities: databaseEntities,
  migrations: [__dirname + '/../typeorm/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: databaseConfig.logging,
  ...(sslEnabled
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
  extra: {
    family: 4, // Force IPv4 — ECS Fargate VPC has no IPv6 routing
    max: sslEnabled ? 5 : 10, // Free-tier poolers have tight connection limits
    min: sslEnabled ? 0 : 2,
    idleTimeoutMillis: 30000, // Release idle connections after 30s
    connectionTimeoutMillis: 10000, // Managed DBs can be slower on cold start
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
