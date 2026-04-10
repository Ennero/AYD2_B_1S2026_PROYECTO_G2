/**
 * Jest globalSetup — se ejecuta UNA SOLA VEZ antes de todos los suites de
 * integración, en un proceso separado al de los workers.
 *
 * Responsabilidades:
 *  1. Crear el schema de la BD a partir de db/logitrans_postgresql.sql si
 *     las tablas aún no existen (BD vacía en CI).
 *  2. Sembrar datos iniciales (DB_AUTO_SEED=true por defecto en tests).
 *
 * Esto replica lo que hace main.ts en bootstrap() pero sin levantar NestJS,
 * de modo que todos los specs arrancen con la BD lista.
 */

import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../src/infrastructure/database/config/data-source';
import { ensureCanonicalSchema } from '../../src/infrastructure/database/bootstrap/initialize-schema';
import { runInitialSeed } from '../../src/infrastructure/database/seeds/database-seeder';

export default async function globalSetup(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('[globalSetup] Conexión a BD establecida.');

    await ensureCanonicalSchema(dataSource);
    console.log('[globalSetup] Schema listo.');

    const autoSeed = (process.env.DB_AUTO_SEED ?? 'true') === 'true';
    if (autoSeed) {
      try {
        await runInitialSeed(dataSource);
        console.log('[globalSetup] Seed inicial completado.');
      } catch {
        // El seeder puede lanzar errores por constraints UNIQUE si los datos
        // ya existen. No es un error crítico — los specs manejan ambos casos.
        console.warn('[globalSetup] Seed omitido (posiblemente ya sembrado).');
      }
    }
  } finally {
    await dataSource.destroy();
  }
}
