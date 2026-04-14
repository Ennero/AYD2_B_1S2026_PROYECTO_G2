import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('api/health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  /**
   * Health check endpoint for load balancers
   * Returns 200 if API + database are operational
   */
  @Get()
  async check() {
    try {
      // Verify database connection
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: message,
      };
    }
  }
}
