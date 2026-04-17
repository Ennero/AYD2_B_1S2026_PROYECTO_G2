import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseEntities } from './config/data-source';
import { getDatabaseRuntimeConfig, getReplicaDatabaseConfig } from './config/database-env';

/**
 * DI token for the read-replica DataSource.
 * Inject with @Inject(REPLICA_DATA_SOURCE) in GERENCIA-specific repositories.
 *
 * When DB_REPLICA_ENABLED=false (local dev) this DataSource points to the
 * primary, so all GERENCIA reads still work without a replica running.
 */
export const REPLICA_DATA_SOURCE = 'REPLICA_DATA_SOURCE';

@Global()
@Module({
  providers: [
    {
      provide: REPLICA_DATA_SOURCE,
      useFactory: async (): Promise<DataSource> => {
        const replicaCfg = getReplicaDatabaseConfig();
        const primaryCfg = getDatabaseRuntimeConfig();

        // Fall back to primary when replica is disabled (local dev / CI)
        const target = replicaCfg.enabled ? replicaCfg : primaryCfg;

        const options: DataSourceOptions = {
          type: 'postgres',
          host: target.host,
          port: target.port,
          username: target.username,
          password: target.password,
          database: target.database,
          entities: databaseEntities,
          synchronize: false,
          logging: false,
          extra: { family: 4 }, // Force IPv4 — ECS Fargate VPC has no IPv6 routing
        };

        const ds = new DataSource(options);
        await ds.initialize();
        return ds;
      },
    },
    // Lifecycle provider: gracefully closes the replica DataSource on shutdown
    {
      provide: 'REPLICA_DS_LIFECYCLE',
      useFactory: (ds: DataSource): OnApplicationShutdown => ({
        async onApplicationShutdown() {
          if (ds.isInitialized) {
            await ds.destroy();
          }
        },
      }),
      inject: [REPLICA_DATA_SOURCE],
    },
  ],
  exports: [REPLICA_DATA_SOURCE],
})
export class ReplicaDatabaseModule {}
