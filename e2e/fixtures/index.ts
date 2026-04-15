import { faker } from '@faker-js/faker';

/** Known seeded credentials (from database-seeder.ts) — update if seed changes */
export const SEEDED_USERS = {
  agenteOperativo: { email: '2895884051401+v@ingenieria.usac.edu.gt', password: 'LogiVentas'   },
  piloto:          { email: '2895884051401+t@ingenieria.usac.edu.gt', password: 'LogiPiloto'    },
  agenteLogistico: { email: '2895884051401+l@ingenieria.usac.edu.gt', password: 'LogiLogistica' },
  encargadoPatio:  { email: '2895884051401+p@ingenieria.usac.edu.gt', password: 'LogiPatio'     },
  certificadorFEL: { email: '2895884051401+s@ingenieria.usac.edu.gt', password: 'LogiSAT'       },
  finance:         { email: '2895884051401+f@ingenieria.usac.edu.gt', password: 'LogiFinanzas'  },
  cliente:         { email: '2895884051401+c@ingenieria.usac.edu.gt', password: 'Logi2026'      },
  gerencia:        { email: '2895884051401@ingenieria.usac.edu.gt',   password: 'LogiGerencia'  },
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
