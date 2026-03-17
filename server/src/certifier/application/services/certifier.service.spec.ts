import { Test, TestingModule } from '@nestjs/testing';
import { CertifierService } from './certifier.service';
import { DataSource } from 'typeorm';

describe('CertifierService', () => {
  let service: CertifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertifierService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CertifierService>(CertifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
