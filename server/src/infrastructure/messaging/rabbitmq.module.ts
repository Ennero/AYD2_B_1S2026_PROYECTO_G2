import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqConsumerController } from './rabbitmq.consumer';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';
import { WebsocketModule } from '../websocket/websocket.module';

export { RABBITMQ_CLIENT };

@Global()
@Module({
  imports: [WebsocketModule],
  controllers: [RabbitmqConsumerController],
  providers: [
    {
      provide: RABBITMQ_CLIENT,
      useFactory: (config: ConfigService) => {
        const enabled = ['1', 'true', 'yes', 'on'].includes(
          (config.get<string>('RABBITMQ_ENABLED') ?? '').toLowerCase(),
        );
        if (!enabled) {
          // Lightweight stub so Nest can boot without a broker on free-tier demos.
          return {
            connect: async () => undefined,
            close: async () => undefined,
            emit: () => ({ subscribe: () => undefined }),
            send: () => ({ subscribe: () => undefined }),
          } as any;
        }

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>(
                'RABBITMQ_URL',
                'amqp://guest:guest@localhost:5672',
              ),
            ],
            queue: 'logitrans_queue',
            queueOptions: { durable: true },
          },
        });
      },
      inject: [ConfigService],
    },
    RabbitmqService,
  ],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
