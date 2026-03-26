import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    IStorageService,
    UploadFileOptions,
    UploadFileResult,
} from '../domain/storage.service.interface';

/**
 * Adaptador de infraestructura — Supabase Storage.
 *
 * Implementa IStorageService usando el SDK oficial de Supabase.
 * Toda la complejidad de red queda aislada aquí; los servicios de
 * aplicación sólo dependen del puerto (IStorageService).
 *
 * Configuración requerida en .env:
 *   SUPABASE_URL        — URL del proyecto (Settings > API > Project URL)
 *   SUPABASE_SERVICE_KEY — service_role key (Settings > API > service_role) — NO usar anon key
 */
@Injectable()
export class SupabaseStorageAdapter implements IStorageService, OnModuleInit {
    private readonly logger = new Logger(SupabaseStorageAdapter.name);
    private client: SupabaseClient;

    constructor(private readonly config: ConfigService) {}

    onModuleInit() {
        const url = this.config.get<string>('SUPABASE_URL', '');
        const key = this.config.get<string>('SUPABASE_SERVICE_KEY', '');

        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
        }

        // auth.persistSession: false es CRÍTICO — Node.js no tiene localStorage
        this.client = createClient(url, key, { auth: { persistSession: false } });
        this.logger.log(`Supabase storage adapter initialised — url: ${url}`);
    }

    async upload({
        buffer,
        filename,
        bucket,
        mimeType = 'application/octet-stream',
    }: UploadFileOptions): Promise<UploadFileResult> {
        const { data, error } = await this.client.storage
            .from(bucket)
            .upload(filename, buffer, { contentType: mimeType, upsert: true });

        if (error) {
            this.logger.error(`Upload failed [${bucket}/${filename}]: ${error.message}`);
            return { success: false, error: error.message };
        }

        // getPublicUrl es construcción de URL pura — sin llamada extra a la API
        const { data: { publicUrl } } = this.client.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return { success: true, path: data.path, url: publicUrl };
    }

    async getSignedUrl(
        bucket: string,
        path: string,
        expiresInSeconds = 3600,
    ): Promise<string | null> {
        const { data, error } = await this.client.storage
            .from(bucket)
            .createSignedUrl(path, expiresInSeconds);

        if (error) {
            this.logger.error(`getSignedUrl failed [${bucket}/${path}]: ${error.message}`);
            return null;
        }

        return data.signedUrl;
    }
}
