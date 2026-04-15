import { Test, TestingModule } from '@nestjs/testing';
import { CertifierController } from './certifier.controller';
import { CertifierService } from '../../application/services/certifier.service';

describe('CertifierController', () => {
  let controller: CertifierController;

  beforeEach(async () => {
    const certifierServiceMock = {
      getDashboardSummary: jest.fn(),
      getPendingInvoices: jest.fn(),
      validateNit: jest.fn(),
      certifyInvoice: jest.fn(),
      rejectInvoice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertifierController],
      providers: [{ provide: CertifierService, useValue: certifierServiceMock }],
    }).compile();

    controller = module.get<CertifierController>(CertifierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
