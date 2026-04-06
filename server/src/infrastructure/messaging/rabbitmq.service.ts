import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('RabbitMQ connection established');
    } catch (error) {
      this.logger.warn(
        `RabbitMQ not available, events will be dropped: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Publica un evento en la cola principal de LogiTrans.
   *
   * Uso desde cualquier servicio del sistema:
   *   this.rabbitmqService.emit('orden.entregada', { orderId: 42 });
   */
  emit<T>(pattern: string, data: T): void {
    this.client.emit(pattern, data).subscribe({
      error: (err: Error) =>
        this.logger.error(
          `Failed to emit [${pattern}]: ${err.message}`,
        ),
    });
  }
}
