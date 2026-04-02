import { faker } from '@faker-js/faker';

/** Known seeded credentials (from initial-seed.ts) — update if seed changes */
export const SEEDED_USERS = {
  agenteOperativo: { email: 'agente.operativo@logitrans.com', password: 'password123' },
  piloto:          { email: 'piloto@logitrans.com',           password: 'password123' },
  agenteLogistico: { email: 'agente.logistico@logitrans.com', password: 'password123' },
  encargadoPatio:  { email: 'encargado.patio@logitrans.com',  password: 'password123' },
  certificadorFEL: { email: 'certificador@logitrans.com',     password: 'password123' },
  finance:         { email: 'finance@logitrans.com',           password: 'password123' },
  cliente:         { email: 'cliente@logitrans.com',           password: 'password123' },
  gerencia:        { email: 'gerencia@logitrans.com',          password: 'password123' },
};

export const API_URL = process.env.API_URL ?? 'http://localhost:3006';

/** Generate a fake client payload matching the registration form */
export function fakeClient() {
  return {
    name:    faker.company.name(),
    email:   faker.internet.email(),
    phone:   faker.phone.number(),
    address: faker.location.streetAddress(),
    nit:     faker.number.int({ min: 10000000, max: 99999999 }).toString(),
  };
}
