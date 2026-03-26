import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { STORAGE_SERVICE_TOKEN } from './domain/storage.service.interface';
import { SupabaseStorageAdapter } from './infrastructure/supabase-storage.adapter';

/**
 * StorageModule
 *
 * Provee IStorageService vía STORAGE_SERVICE_TOKEN.
 * Importar este módulo en cualquier feature module que necesite persistir archivos.
 * El adaptador concreto (Supabase) queda encapsulado aquí — para cambiar de proveedor
 * (S3, GCS, etc.) sólo se modifica este módulo.
 *
 * Uso en otro módulo:
 *   @Module({ imports: [StorageModule] })
 *   class PilotModule {}
 *
 *   // En el use case:
 *   @Inject(STORAGE_SERVICE_TOKEN) private readonly storage: IStorageService
 */
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: STORAGE_SERVICE_TOKEN,
            useClass: SupabaseStorageAdapter,
        },
    ],
    exports: [STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
