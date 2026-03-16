import { Test, TestingModule } from '@nestjs/testing';
import { CertifierController } from './certifier.controller';

describe('CertifierController', () => {
  let controller: CertifierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertifierController],
    }).compile();

    controller = module.get<CertifierController>(CertifierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
