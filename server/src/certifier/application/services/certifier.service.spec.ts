import { Test, TestingModule } from '@nestjs/testing';
import { CertifierService } from './certifier.service';

describe('CertifierService', () => {
  let service: CertifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CertifierService],
    }).compile();

    service = module.get<CertifierService>(CertifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
