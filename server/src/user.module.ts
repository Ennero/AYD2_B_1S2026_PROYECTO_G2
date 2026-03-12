import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './infrastructure/database/typeorm/entities/user.entity';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { TypeOrmUserRepository } from './infrastructure/database/typeorm/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [CreateUserUseCase],
})
export class UserModule {}
