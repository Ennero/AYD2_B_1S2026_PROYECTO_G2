import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqConsumerController } from './rabbitmq.consumer';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';

export { RABBITMQ_CLIENT };

@Global()
@Module({
  controllers: [RabbitmqConsumerController],
  providers: [
    {
      provide: RABBITMQ_CLIENT,
      useFactory: (config: ConfigService) =>
        ClientProxyFactory.create({
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
        }),
      inject: [ConfigService],
    },
    RabbitmqService,
  ],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
