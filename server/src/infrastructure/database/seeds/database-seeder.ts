import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { Branch } from '../typeorm/entities/branch.entity';
import { CargoType } from '../typeorm/entities/cargo-type.entity';
import { ClientCard } from '../typeorm/entities/client-card.entity';
import { ClientContact } from '../typeorm/entities/client-contact.entity';
import { Client } from '../typeorm/entities/client.entity';
import { ContractRate } from '../typeorm/entities/contract-rate.entity';
import { ContractRoute } from '../typeorm/entities/contract-route.entity';
import { Contract } from '../typeorm/entities/contract.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { OrderRouteLog } from '../typeorm/entities/order-route-log.entity';
import { Order } from '../typeorm/entities/order.entity';
import { PasswordRecoveryToken } from '../typeorm/entities/password-recovery-token.entity';
import { Payment } from '../typeorm/entities/payment.entity';
import { Route } from '../typeorm/entities/route.entity';
import { TransportUnit } from '../typeorm/entities/transport-unit.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { User } from '../typeorm/entities/user.entity';
import { VehicleType } from '../typeorm/entities/vehicle-type.entity';

interface SeedSummary {
  seeded: boolean;
  counts: Record<string, number>;
}

export function getShortId(index: number): string {
  return String(index);
}

interface ClientBlueprint {
  key: string;
  legalName: string;
  nit: string;
  taxAddress: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  creditLimit: number;
  paymentRisk: RiskLevel;
  customsRisk: RiskLevel;
  cargoRisk: RiskLevel;
  amlRisk: RiskLevel;
  isBlocked?: boolean;
  blockReason?: string;
  contractStatus: ContractStatus;
  paymentTermDays: 15 | 30 | 45;
  discountPercentage: number;
  contractStartOffsetDays: number;
  contractEndOffsetDays: number;
  routeCodes: string[];
  cargoNames: string[];
  contactPeople: Array<{
    name: string;
    email: string;
    phone: string;
    title: string;
    isActive?: boolean;
  }>;
  cards: Array<{
    alias: string;
    cardholderName: string;
    brand: string;
    lastFour: string;
    expirationMonth: number;
    expirationYear: number;
  }>;
}

interface InternalUserBlueprint {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface OrderPlan {
  stage: 'REGISTRADA' | 'ASIGNADA' | 'LISTA' | 'TRANSITO' | 'ENTREGADA';
  preferredVehicleTypeCode?: 'LIGHT' | 'HEAVY' | 'TRAILER';
  requiresRefrigeration?: boolean;
}

interface SeedReferences {
  branches: Branch[];
  routes: Route[];
  vehicleTypes: VehicleType[];
  cargoTypes: CargoType[];
}

interface CreatedOrderRecord {
  order: Order;
  contract: Contract;
  blueprint: ClientBlueprint;
  route: Route | null;
  contractRoute: ContractRoute | null;
  cargoType: CargoType;
  unit: TransportUnit | null;
  finalStage: OrderPlan['stage'];
  requestedAt: Date;
  scheduledPickupAt: Date | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
}

const EXTRA_ROUTES = [
  {
    routeCode: 'SAL-GUA',
    origin: 'SAN SALVADOR',
    destination: 'CIUDAD DE GUATEMALA',
    distanceKm: 235,
    estimatedHours: 5.5,
    isInternational: true,
  },
  {
    routeCode: 'SPS-GUA',
    origin: 'SAN PEDRO SULA',
    destination: 'CIUDAD DE GUATEMALA',
    distanceKm: 410,
    estimatedHours: 9,
    isInternational: true,
  },
  {
    routeCode: 'PBAR-SPS',
    origin: 'PUERTO BARRIOS',
    destination: 'SAN PEDRO SULA',
    distanceKm: 210,
    estimatedHours: 5,
    isInternational: true,
  },
  {
    routeCode: 'XELA-SAL',
    origin: 'QUETZALTENANGO',
    destination: 'SAN SALVADOR',
    distanceKm: 320,
    estimatedHours: 7.5,
    isInternational: true,
  },
];

const EXTRA_CARGO_TYPES = [
  { cargoName: 'MEDICAMENTOS FRAGILES', requiresRefrigeration: false },
  { cargoName: 'ELECTRODOMESTICOS', requiresRefrigeration: false },
  { cargoName: 'MATERIA PRIMA INDUSTRIAL', requiresRefrigeration: false },
  { cargoName: 'BEBIDAS REFRIGERADAS', requiresRefrigeration: true },
];

const INTERNAL_USERS: InternalUserBlueprint[] = [
  {
    fullName: 'Simulador FEL SAT',
    email: '2895884051401+certificador.fel@ingenieria.usac.edu.gt',
    phone: '+50241000001',
    role: UserRole.CERTIFICADOR_FEL,
  },
  {
    fullName: 'Andrea Solares',
    email: '2895884051401+operativo.1@ingenieria.usac.edu.gt',
    phone: '+50241000002',
    role: UserRole.AGENTE_OPERATIVO,
  },
  {
    fullName: 'Luis Argueta',
    email: 'operativo.2@logitrans.gt',
    phone: '+50241000003',
    role: UserRole.AGENTE_OPERATIVO,
  },
  {
    fullName: 'Karla Menendez',
    email: '2895884051401+logistica.1@ingenieria.usac.edu.gt',
    phone: '+50241000004',
    role: UserRole.AGENTE_LOGISTICO,
  },
  {
    fullName: 'Diego Paredes',
    email: 'logistica.2@logitrans.gt',
    phone: '+50241000005',
    role: UserRole.AGENTE_LOGISTICO,
  },
  {
    fullName: 'Noe Rosales',
    email: 'logistica.3@logitrans.gt',
    phone: '+50241000006',
    role: UserRole.AGENTE_LOGISTICO,
  },
  {
    fullName: 'Mario Caal',
    email: '2895884051401+patio.1@ingenieria.usac.edu.gt',
    phone: '+50241000007',
    role: UserRole.ENCARGADO_PATIO,
  },
  {
    fullName: 'Julio Macz',
    email: 'patio.2@logitrans.gt',
    phone: '+50241000008',
    role: UserRole.ENCARGADO_PATIO,
  },
  {
    fullName: 'Silvia Monterroso',
    email: '2895884051401+finanzas.1@ingenieria.usac.edu.gt',
    phone: '+50241000009',
    role: UserRole.AGENTE_FINANCIERO,
  },
  {
    fullName: 'Pamela Castellanos',
    email: 'finanzas.2@logitrans.gt',
    phone: '+50241000010',
    role: UserRole.AGENTE_FINANCIERO,
  },
  {
    fullName: 'Jorge Ajanel',
    email: 'finanzas.3@logitrans.gt',
    phone: '+50241000011',
    role: UserRole.AGENTE_FINANCIERO,
  },
  {
    fullName: 'Ricardo Solis',
    email: '2895884051401+gerencia@ingenieria.usac.edu.gt',
    phone: '+50241000012',
    role: UserRole.GERENCIA,
  },
  {
    fullName: 'Carlos Mendez',
    email: '2895884051401+piloto.01@ingenieria.usac.edu.gt',
    phone: '+50241000101',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Edgar Choc',
    email: 'piloto.02@logitrans.gt',
    phone: '+50241000102',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Miguel Ixcoy',
    email: 'piloto.03@logitrans.gt',
    phone: '+50241000103',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Jose Tum',
    email: 'piloto.04@logitrans.gt',
    phone: '+50241000104',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Victor Quej',
    email: 'piloto.05@logitrans.gt',
    phone: '+50241000105',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Byron Cuxum',
    email: 'piloto.06@logitrans.gt',
    phone: '+50241000106',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Kevin Cholotio',
    email: 'piloto.07@logitrans.gt',
    phone: '+50241000107',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Angel Sucuc',
    email: 'piloto.08@logitrans.gt',
    phone: '+50241000108',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Marco Caniz',
    email: 'piloto.09@logitrans.gt',
    phone: '+50241000109',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Jhonny Lux',
    email: 'piloto.10@logitrans.gt',
    phone: '+50241000110',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Rene Tecun',
    email: 'piloto.11@logitrans.gt',
    phone: '+50241000111',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Samuel Colop',
    email: 'piloto.12@logitrans.gt',
    phone: '+50241000112',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Otto Chaj',
    email: 'piloto.13@logitrans.gt',
    phone: '+50241000113',
    role: UserRole.PILOTO,
  },
  {
    fullName: 'Fredy Us',
    email: 'piloto.14@logitrans.gt',
    phone: '+50241000114',
    role: UserRole.PILOTO,
  },
];

const MVP_PRIORITY_USER_EMAILS: string[] = [
  '2895884051401+certificador.fel@ingenieria.usac.edu.gt',
  '2895884051401+operativo.1@ingenieria.usac.edu.gt',
  '2895884051401+logistica.1@ingenieria.usac.edu.gt',
  '2895884051401+patio.1@ingenieria.usac.edu.gt',
  '2895884051401+finanzas.1@ingenieria.usac.edu.gt',
  '2895884051401+gerencia@ingenieria.usac.edu.gt',
  '2895884051401+piloto.01@ingenieria.usac.edu.gt',
];

const CLIENT_BLUEPRINTS: ClientBlueprint[] = [
  {
    key: 'alimentos-norte',
    legalName: 'ALIMENTOS DEL NORTE, S.A.',
    nit: '1000000000001',
    taxAddress: '12 avenida 18-45 zona 10, Ciudad de Guatemala',
    primaryContactName: 'Paola Estrada',
    primaryContactEmail: 'paola.estrada@alnorsa.com.gt',
    primaryContactPhone: '+50252010001',
    creditLimit: 325000,
    paymentRisk: RiskLevel.BAJO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 30,
    discountPercentage: 6,
    contractStartOffsetDays: -210,
    contractEndOffsetDays: 180,
    routeCodes: ['PBAR-GUA', 'GUA-XELA', 'GUA-SAL'],
    cargoNames: ['CARGA GENERAL', 'BEBIDAS REFRIGERADAS'],
    contactPeople: [
      {
        name: 'Gabriel Ramos',
        email: 'gabriel.ramos@alnorsa.com.gt',
        phone: '+50252011001',
        title: 'Coordinador de Compras',
      },
      {
        name: 'Lucia Mejia',
        email: 'lucia.mejia@alnorsa.com.gt',
        phone: '+50252011002',
        title: 'Encargada de Logistica',
      },
      {
        name: 'Diana Ovalle',
        email: 'diana.ovalle@alnorsa.com.gt',
        phone: '+50252011003',
        title: 'Tesoreria',
      },
    ],
    cards: [
      {
        alias: 'Corporativa Principal',
        cardholderName: 'ALIMENTOS DEL NORTE SA',
        brand: 'VISA BUSINESS',
        lastFour: '4201',
        expirationMonth: 10,
        expirationYear: 2028,
      },
      {
        alias: 'Tesoreria Secundaria',
        cardholderName: 'ALIMENTOS DEL NORTE SA',
        brand: 'MASTERCARD',
        lastFour: '1174',
        expirationMonth: 2,
        expirationYear: 2029,
      },
    ],
  },
  {
    key: 'farmaceutica-maya',
    legalName: 'FARMACEUTICA MAYA, S.A.',
    nit: '1000000000002',
    taxAddress: '14 calle 6-20 zona 9, Ciudad de Guatemala',
    primaryContactName: 'Hector Figueroa',
    primaryContactEmail: 'hector.figueroa@farmamaya.com.gt',
    primaryContactPhone: '+50252020001',
    creditLimit: 410000,
    paymentRisk: RiskLevel.BAJO,
    customsRisk: RiskLevel.BAJO,
    cargoRisk: RiskLevel.ALTO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 45,
    discountPercentage: 8,
    contractStartOffsetDays: -240,
    contractEndOffsetDays: 240,
    routeCodes: ['GUA-XELA', 'GUA-PBAR', 'GUA-SPS'],
    cargoNames: ['MEDICAMENTOS FRAGILES', 'CARGA REFRIGERADA'],
    contactPeople: [
      {
        name: 'Sandra Recinos',
        email: 'sandra.recinos@farmamaya.com.gt',
        phone: '+50252021001',
        title: 'Cadena de Suministro',
      },
      {
        name: 'Raul Monzon',
        email: 'raul.monzon@farmamaya.com.gt',
        phone: '+50252021002',
        title: 'Calidad y Distribucion',
      },
      {
        name: 'Laura Samayoa',
        email: 'laura.samayoa@farmamaya.com.gt',
        phone: '+50252021003',
        title: 'Cuentas por Pagar',
      },
    ],
    cards: [
      {
        alias: 'Farmacia Corporativa',
        cardholderName: 'FARMACEUTICA MAYA SA',
        brand: 'AMEX CORPORATE',
        lastFour: '6338',
        expirationMonth: 8,
        expirationYear: 2027,
      },
    ],
  },
  {
    key: 'textiles-pacifico',
    legalName: 'TEXTILES DEL PACIFICO, S.A.',
    nit: '1000000000003',
    taxAddress: 'Km 16.5 ruta al Pacifico, Villa Nueva, Guatemala',
    primaryContactName: 'Marcos Cifuentes',
    primaryContactEmail: 'marcos.cifuentes@texpac.com.gt',
    primaryContactPhone: '+50252030001',
    creditLimit: 280000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 30,
    discountPercentage: 4,
    contractStartOffsetDays: -180,
    contractEndOffsetDays: 220,
    routeCodes: ['GUA-XELA', 'XELA-GUA', 'PBAR-GUA'],
    cargoNames: ['CARGA GENERAL', 'ELECTRODOMESTICOS'],
    contactPeople: [
      {
        name: 'Monica Leiva',
        email: 'monica.leiva@texpac.com.gt',
        phone: '+50252031001',
        title: 'Planificacion',
      },
      {
        name: 'Enrique Canto',
        email: 'enrique.canto@texpac.com.gt',
        phone: '+50252031002',
        title: 'Distribucion Nacional',
      },
    ],
    cards: [
      {
        alias: 'Pago Textil',
        cardholderName: 'TEXTILES DEL PACIFICO SA',
        brand: 'VISA BUSINESS',
        lastFour: '8103',
        expirationMonth: 11,
        expirationYear: 2028,
      },
    ],
  },
  {
    key: 'agroexportadora-verapaz',
    legalName: 'AGROEXPORTADORA VERAPAZ, S.A.',
    nit: '1000000000004',
    taxAddress: 'Salida a Coban km 210, Alta Verapaz, Guatemala',
    primaryContactName: 'Carmen Orellana',
    primaryContactEmail: 'carmen.orellana@agroverapaz.com.gt',
    primaryContactPhone: '+50252040001',
    creditLimit: 360000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.ALTO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.MEDIO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 15,
    discountPercentage: 5,
    contractStartOffsetDays: -160,
    contractEndOffsetDays: 160,
    routeCodes: ['PBAR-GUA', 'PBAR-XELA', 'PBAR-SPS'],
    cargoNames: ['CARGA GENERAL', 'CARGA REFRIGERADA'],
    contactPeople: [
      {
        name: 'Noelia Armas',
        email: 'noelia.armas@agroverapaz.com.gt',
        phone: '+50252041001',
        title: 'Exportaciones',
      },
      {
        name: 'Oscar Chub',
        email: 'oscar.chub@agroverapaz.com.gt',
        phone: '+50252041002',
        title: 'Operacion Portuaria',
      },
    ],
    cards: [
      {
        alias: 'Tarjeta Agro',
        cardholderName: 'AGROEXPORTADORA VERAPAZ SA',
        brand: 'MASTERCARD',
        lastFour: '4409',
        expirationMonth: 7,
        expirationYear: 2027,
      },
    ],
  },
  {
    key: 'electro-centroamerica',
    legalName: 'ELECTRO CENTROAMERICA, S.A.',
    nit: '1000000000005',
    taxAddress: '4 avenida 9-18 zona 4, Mixco, Guatemala',
    primaryContactName: 'Pablo Cardona',
    primaryContactEmail: 'pablo.cardona@electroca.com.gt',
    primaryContactPhone: '+50252050001',
    creditLimit: 390000,
    paymentRisk: RiskLevel.BAJO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 30,
    discountPercentage: 7,
    contractStartOffsetDays: -300,
    contractEndOffsetDays: 250,
    routeCodes: ['GUA-PBAR', 'GUA-SAL', 'GUA-SPS'],
    cargoNames: ['ELECTRODOMESTICOS', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Daniela Dubon',
        email: 'daniela.dubon@electroca.com.gt',
        phone: '+50252051001',
        title: 'Abastecimiento Regional',
      },
      {
        name: 'Julio Ralda',
        email: 'julio.ralda@electroca.com.gt',
        phone: '+50252051002',
        title: 'Importaciones',
      },
      {
        name: 'Beatriz Juarez',
        email: 'beatriz.juarez@electroca.com.gt',
        phone: '+50252051003',
        title: 'Contabilidad',
      },
    ],
    cards: [
      {
        alias: 'Compras Regionales',
        cardholderName: 'ELECTRO CENTROAMERICA SA',
        brand: 'VISA BUSINESS',
        lastFour: '9008',
        expirationMonth: 3,
        expirationYear: 2028,
      },
      {
        alias: 'Backoffice',
        cardholderName: 'ELECTRO CENTROAMERICA SA',
        brand: 'MASTERCARD',
        lastFour: '1265',
        expirationMonth: 12,
        expirationYear: 2029,
      },
    ],
  },
  {
    key: 'aceros-istmo',
    legalName: 'ACEROS DEL ISTMO, S.A.',
    nit: '1000000000006',
    taxAddress: 'Ruta al Atlantico km 14.5, zona 18, Guatemala',
    primaryContactName: 'Alejandro Chacon',
    primaryContactEmail: 'alejandro.chacon@acerosistmo.com.gt',
    primaryContactPhone: '+50252060001',
    creditLimit: 470000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.ALTO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 30,
    discountPercentage: 3,
    contractStartOffsetDays: -200,
    contractEndOffsetDays: 200,
    routeCodes: ['GUA-PBAR', 'PBAR-GUA', 'XELA-PBAR'],
    cargoNames: ['MATERIA PRIMA INDUSTRIAL', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Harold Godoy',
        email: 'harold.godoy@acerosistmo.com.gt',
        phone: '+50252061001',
        title: 'Planeacion Industrial',
      },
      {
        name: 'Claudia Sam',
        email: 'claudia.sam@acerosistmo.com.gt',
        phone: '+50252061002',
        title: 'Despachos',
      },
    ],
    cards: [
      {
        alias: 'Metal Principal',
        cardholderName: 'ACEROS DEL ISTMO SA',
        brand: 'VISA BUSINESS',
        lastFour: '7404',
        expirationMonth: 6,
        expirationYear: 2027,
      },
    ],
  },
  {
    key: 'supermercados-lago',
    legalName: 'SUPERMERCADOS DEL LAGO, S.A.',
    nit: '1000000000007',
    taxAddress: 'Boulevard principal 11-22, zona 1, Quetzaltenango',
    primaryContactName: 'Viviana Cuyun',
    primaryContactEmail: 'viviana.cuyun@superlago.com.gt',
    primaryContactPhone: '+50252070001',
    creditLimit: 295000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.BAJO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 15,
    discountPercentage: 5,
    contractStartOffsetDays: -120,
    contractEndOffsetDays: 190,
    routeCodes: ['XELA-GUA', 'GUA-XELA', 'XELA-SAL'],
    cargoNames: ['BEBIDAS REFRIGERADAS', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Tania Chocooj',
        email: 'tania.chocooj@superlago.com.gt',
        phone: '+50252071001',
        title: 'Reabastecimiento',
      },
      {
        name: 'Manuel Barrios',
        email: 'manuel.barrios@superlago.com.gt',
        phone: '+50252071002',
        title: 'Tesoreria',
      },
    ],
    cards: [
      {
        alias: 'Abastecimiento 01',
        cardholderName: 'SUPERMERCADOS DEL LAGO SA',
        brand: 'MASTERCARD',
        lastFour: '3088',
        expirationMonth: 9,
        expirationYear: 2028,
      },
    ],
  },
  {
    key: 'quimicos-caribe',
    legalName: 'QUIMICOS DEL CARIBE, S.A.',
    nit: '1000000000008',
    taxAddress: 'Zona industrial 2, Puerto Barrios, Izabal',
    primaryContactName: 'Mario Vasquez',
    primaryContactEmail: 'mario.vasquez@quimicar.com.gt',
    primaryContactPhone: '+50252080001',
    creditLimit: 430000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.ALTO,
    cargoRisk: RiskLevel.CRITICO,
    amlRisk: RiskLevel.MEDIO,
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 30,
    discountPercentage: 2,
    contractStartOffsetDays: -150,
    contractEndOffsetDays: 210,
    routeCodes: ['PBAR-GUA', 'PBAR-SPS', 'GUA-PBAR'],
    cargoNames: ['MATERIA PRIMA INDUSTRIAL', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Fernanda Asturias',
        email: 'fernanda.asturias@quimicar.com.gt',
        phone: '+50252081001',
        title: 'Operaciones Portuarias',
      },
      {
        name: 'Miguel Morales',
        email: 'miguel.morales@quimicar.com.gt',
        phone: '+50252081002',
        title: 'Compras Industriales',
      },
    ],
    cards: [
      {
        alias: 'Pago Puerto',
        cardholderName: 'QUIMICOS DEL CARIBE SA',
        brand: 'VISA BUSINESS',
        lastFour: '5510',
        expirationMonth: 1,
        expirationYear: 2029,
      },
    ],
  },
  {
    key: 'bebidas-occidente',
    legalName: 'BEBIDAS DEL OCCIDENTE, S.A.',
    nit: '1000000000009',
    taxAddress: 'Parque industrial, San Juan Ostuncalco, Quetzaltenango',
    primaryContactName: 'Javier Escobar',
    primaryContactEmail: 'javier.escobar@bebidasoccidente.com.gt',
    primaryContactPhone: '+50252090001',
    creditLimit: 250000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.BAJO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.VENCIDO,
    paymentTermDays: 15,
    discountPercentage: 4,
    contractStartOffsetDays: -420,
    contractEndOffsetDays: -20,
    routeCodes: ['XELA-GUA', 'XELA-PBAR'],
    cargoNames: ['BEBIDAS REFRIGERADAS', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Gabriela Santizo',
        email: 'gabriela.santizo@bebidasoccidente.com.gt',
        phone: '+50252091001',
        title: 'Distribucion',
      },
      {
        name: 'Byron Cifuentes',
        email: 'byron.cifuentes@bebidasoccidente.com.gt',
        phone: '+50252091002',
        title: 'Cuentas por Pagar',
      },
    ],
    cards: [],
  },
  {
    key: 'retail-portuario',
    legalName: 'RETAIL PORTUARIO, S.A.',
    nit: '1000000000010',
    taxAddress: 'Zona libre 4, Puerto Barrios, Izabal',
    primaryContactName: 'Natalia Solorzano',
    primaryContactEmail: 'natalia.solorzano@retailportuario.com.gt',
    primaryContactPhone: '+50252100001',
    creditLimit: 180000,
    paymentRisk: RiskLevel.MEDIO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.BAJO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.CANCELADO,
    paymentTermDays: 30,
    discountPercentage: 1,
    contractStartOffsetDays: -300,
    contractEndOffsetDays: 60,
    routeCodes: ['PBAR-GUA', 'GUA-PBAR'],
    cargoNames: ['ELECTRODOMESTICOS', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Andrea Mejicanos',
        email: 'andrea.mejicanos@retailportuario.com.gt',
        phone: '+50252101001',
        title: 'Planeacion Comercial',
      },
    ],
    cards: [],
  },
  {
    key: 'tecnologia-aduanera',
    legalName: 'TECNOLOGIA ADUANERA, S.A.',
    nit: '1000000000011',
    taxAddress: 'Zona 13, edificio plataforma, Ciudad de Guatemala',
    primaryContactName: 'Erick Monterroso',
    primaryContactEmail: 'erick.monterroso@tecaduanas.com.gt',
    primaryContactPhone: '+50252110001',
    creditLimit: 150000,
    paymentRisk: RiskLevel.BAJO,
    customsRisk: RiskLevel.MEDIO,
    cargoRisk: RiskLevel.BAJO,
    amlRisk: RiskLevel.BAJO,
    contractStatus: ContractStatus.BORRADOR,
    paymentTermDays: 30,
    discountPercentage: 0,
    contractStartOffsetDays: -15,
    contractEndOffsetDays: 365,
    routeCodes: ['GUA-SAL', 'GUA-SPS'],
    cargoNames: ['ELECTRODOMESTICOS', 'CARGA GENERAL'],
    contactPeople: [
      {
        name: 'Sara Del Valle',
        email: 'sara.delvalle@tecaduanas.com.gt',
        phone: '+50252111001',
        title: 'Operaciones',
      },
    ],
    cards: [],
  },
  {
    key: 'importadora-oriental',
    legalName: 'IMPORTADORA ORIENTAL, S.A.',
    nit: '1000000000012',
    taxAddress: 'Zona franca 1, Morales, Izabal',
    primaryContactName: 'Roxana Matias',
    primaryContactEmail: 'roxana.matias@imporiental.com.gt',
    primaryContactPhone: '+50252120001',
    creditLimit: 340000,
    paymentRisk: RiskLevel.ALTO,
    customsRisk: RiskLevel.ALTO,
    cargoRisk: RiskLevel.MEDIO,
    amlRisk: RiskLevel.MEDIO,
    isBlocked: true,
    blockReason: 'Cliente en revision de cumplimiento documental y perfil financiero.',
    contractStatus: ContractStatus.VIGENTE,
    paymentTermDays: 45,
    discountPercentage: 2,
    contractStartOffsetDays: -90,
    contractEndOffsetDays: 275,
    routeCodes: ['PBAR-GUA', 'PBAR-SPS'],
    cargoNames: ['CARGA GENERAL', 'MATERIA PRIMA INDUSTRIAL'],
    contactPeople: [
      {
        name: 'Josefina Rojas',
        email: 'josefina.rojas@imporiental.com.gt',
        phone: '+50252121001',
        title: 'Importaciones',
      },
      {
        name: 'Edwin Ucan',
        email: 'edwin.ucan@imporiental.com.gt',
        phone: '+50252121002',
        title: 'Tesoreria',
      },
    ],
    cards: [
      {
        alias: 'Operaciones Asia',
        cardholderName: 'IMPORTADORA ORIENTAL SA',
        brand: 'VISA BUSINESS',
        lastFour: '6734',
        expirationMonth: 4,
        expirationYear: 2028,
      },
    ],
  },
];

const TRANSPORT_UNIT_BLUEPRINTS = [
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'LIGHT',
    pilotEmail: '2895884051401+piloto.01@ingenieria.usac.edu.gt',
    plateNumber: 'C-310BHQ',
    vehicleModel: 'Hyundai H100 2023',
    capacityTon: 3.2,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0001',
  },
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'LIGHT',
    pilotEmail: 'piloto.02@logitrans.gt',
    plateNumber: 'C-314BHQ',
    vehicleModel: 'Kia K2700 2022',
    capacityTon: 3.4,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0002',
  },
  {
    branchCode: 'XELA',
    vehicleTypeCode: 'LIGHT',
    pilotEmail: 'piloto.03@logitrans.gt',
    plateNumber: 'C-318BHQ',
    vehicleModel: 'Isuzu NPR Lite 2024',
    capacityTon: 3.1,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0003',
  },
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'HEAVY',
    pilotEmail: 'piloto.04@logitrans.gt',
    plateNumber: 'O-102KRP',
    vehicleModel: 'Hino 500 2021',
    capacityTon: 10.8,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0004',
  },
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'HEAVY',
    pilotEmail: 'piloto.05@logitrans.gt',
    plateNumber: 'O-107KRP',
    vehicleModel: 'Fuso Fighter 2022',
    capacityTon: 11.2,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0005',
  },
  {
    branchCode: 'PBAR',
    vehicleTypeCode: 'HEAVY',
    pilotEmail: 'piloto.06@logitrans.gt',
    plateNumber: 'O-109KRP',
    vehicleModel: 'Isuzu FTR 2020',
    capacityTon: 10.5,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0006',
  },
  {
    branchCode: 'XELA',
    vehicleTypeCode: 'HEAVY',
    pilotEmail: 'piloto.07@logitrans.gt',
    plateNumber: 'O-111KRP',
    vehicleModel: 'International MV 2021',
    capacityTon: 11.6,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0007',
  },
  {
    branchCode: 'PBAR',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.08@logitrans.gt',
    plateNumber: 'TC-400MNL',
    vehicleModel: 'Freightliner Cascadia 2020',
    capacityTon: 24.5,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0008',
  },
  {
    branchCode: 'PBAR',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.09@logitrans.gt',
    plateNumber: 'TC-405MNL',
    vehicleModel: 'Kenworth T680 2021',
    capacityTon: 25.2,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0009',
  },
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.10@logitrans.gt',
    plateNumber: 'TC-407MNL',
    vehicleModel: 'Volvo VNL 2022',
    capacityTon: 23.8,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0010',
  },
  {
    branchCode: 'GUA',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.11@logitrans.gt',
    plateNumber: 'TC-410MNL',
    vehicleModel: 'Freightliner Cascadia 2023',
    capacityTon: 24.1,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0011',
  },
  {
    branchCode: 'XELA',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.12@logitrans.gt',
    plateNumber: 'TC-415MNL',
    vehicleModel: 'Kenworth T880 2021',
    capacityTon: 24.8,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0012',
  },
  {
    branchCode: 'PBAR',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.13@logitrans.gt',
    plateNumber: 'TC-418MNL',
    vehicleModel: 'Mack Anthem 2022',
    capacityTon: 25.5,
    hasRefrigeration: true,
    pilotLicenseNumber: 'LIC-PLT-0013',
  },
  {
    branchCode: 'XELA',
    vehicleTypeCode: 'TRAILER',
    pilotEmail: 'piloto.14@logitrans.gt',
    plateNumber: 'TC-420MNL',
    vehicleModel: 'International LT 2020',
    capacityTon: 23.5,
    hasRefrigeration: false,
    pilotLicenseNumber: 'LIC-PLT-0014',
  },
];

const ORDER_PLANS: OrderPlan[] = [
  { stage: 'REGISTRADA' },
  { stage: 'ASIGNADA', preferredVehicleTypeCode: 'LIGHT' },
  { stage: 'LISTA', preferredVehicleTypeCode: 'HEAVY' },
  { stage: 'TRANSITO', preferredVehicleTypeCode: 'HEAVY' },
  { stage: 'ENTREGADA', preferredVehicleTypeCode: 'HEAVY' },
  { stage: 'ENTREGADA', preferredVehicleTypeCode: 'TRAILER', requiresRefrigeration: true },
  { stage: 'ENTREGADA', preferredVehicleTypeCode: 'TRAILER' },
];

function daysFromNow(offsetDays: number): Date {
  const value = new Date('2026-04-11T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value;
}

function hoursAfter(base: Date, hours: number): Date {
  const value = new Date(base);
  value.setTime(value.getTime() + hours * 60 * 60 * 1000);
  return value;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function mustFind<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`No se encontro referencia requerida para ${label}.`);
  }

  return value;
}

export class DatabaseSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<SeedSummary> {
    const existingClients = await this.dataSource.getRepository(Client).count();

    if (existingClients > 0) {
      return {
        seeded: false,
        counts: {
          clients: existingClients,
        },
      };
    }

    return this.dataSource.transaction(async (manager) => {
      await this.ensureCatalogData(manager);
      const references = await this.loadReferences(manager);

      const internalUsers = await this.seedInternalUsers(manager);
      const clients = await this.seedClients(manager);
      const clientUsers = await this.seedClientUsers(manager, clients);
      await this.seedClientContacts(manager, clients);
      const clientCards = await this.seedClientCards(manager, clients);
      const contracts = await this.seedContracts(manager, clients, references.cargoTypes);
      const contractRoutes = await this.seedContractRoutes(
        manager,
        clients,
        contracts,
        references.routes,
      );
      const contractRates = await this.loadContractRates(manager, contracts);
      const transportUnits = await this.seedTransportUnits(
        manager,
        internalUsers,
        references.branches,
        references.vehicleTypes,
      );
      await this.seedUserSessions(manager, [...internalUsers, ...clientUsers]);
      await this.seedPasswordRecoveryTokens(manager, [...internalUsers, ...clientUsers]);
      const createdOrders = await this.seedOrders(
        manager,
        clients,
        clientUsers,
        contracts,
        contractRoutes,
        contractRates,
        references.routes,
        references.cargoTypes,
        transportUnits,
      );
      await this.seedOrderLogs(manager, createdOrders);
      const invoices = await this.seedInvoices(manager, createdOrders, contracts);
      await this.seedPayments(manager, invoices, clientCards, internalUsers);

      return {
        seeded: true,
        counts: {
          clients: clients.length,
          users: internalUsers.length + clientUsers.length,
          sessions: await manager.getRepository(UserSession).count(),
          recoveryTokens: await manager.getRepository(PasswordRecoveryToken).count(),
          contacts: CLIENT_BLUEPRINTS.reduce(
            (total, blueprint) => total + blueprint.contactPeople.length,
            0,
          ),
          cards: clientCards.length,
          contracts: contracts.length,
          contractRoutes: contractRoutes.length,
          contractRates: contractRates.length,
          transportUnits: transportUnits.length,
          orders: createdOrders.length,
          routeLogs: await manager.getRepository(OrderRouteLog).count(),
          invoices: invoices.length,
          payments: await manager.getRepository(Payment).count(),
        },
      };
    });
  }

  private async ensureCatalogData(manager: EntityManager): Promise<void> {
    const routeRepo = manager.getRepository(Route);
    const cargoRepo = manager.getRepository(CargoType);

    const existingRouteCodes = new Set(
      (await routeRepo.find()).map((route) => route.routeCode),
    );
    const missingRoutes = EXTRA_ROUTES.filter(
      (route) => !existingRouteCodes.has(route.routeCode),
    );

    if (missingRoutes.length > 0) {
      await routeRepo.save(missingRoutes);
    }

    const existingCargoNames = new Set(
      (await cargoRepo.find()).map((cargo) => cargo.cargoName),
    );
    const missingCargoTypes = EXTRA_CARGO_TYPES.filter(
      (cargo) => !existingCargoNames.has(cargo.cargoName),
    );

    if (missingCargoTypes.length > 0) {
      await cargoRepo.save(missingCargoTypes);
    }
  }

  private async loadReferences(manager: EntityManager): Promise<SeedReferences> {
    return {
      branches: await manager.getRepository(Branch).find(),
      routes: await manager.getRepository(Route).find(),
      vehicleTypes: await manager.getRepository(VehicleType).find(),
      cargoTypes: await manager.getRepository(CargoType).find(),
    };
  }

  private async seedInternalUsers(manager: EntityManager): Promise<User[]> {
    const repository = manager.getRepository(User);
    const usersToCreate = await Promise.all(
      INTERNAL_USERS.map(async (user, index) => {
        const passwordHash = await bcrypt.hash(`seed$${user.email}`, 10);
        return repository.create({
          role: user.role,
          fullName: user.fullName,
          email: user.email,
          passwordHash,
          phone: user.phone,
          isActive: true,
        });
      }),
    );
    await repository.save(usersToCreate);

    return repository.find({
      where: { email: In(INTERNAL_USERS.map((user) => user.email)) },
    });
  }

  private async seedClients(manager: EntityManager): Promise<Client[]> {
    const repository = manager.getRepository(Client);
    await repository.save(
      CLIENT_BLUEPRINTS.map((client, index) =>
        repository.create({
          legalName: client.legalName,
          nit: client.nit,
          taxAddress: client.taxAddress,
          primaryContactName: client.primaryContactName,
          primaryContactEmail: client.primaryContactEmail,
          primaryContactPhone: client.primaryContactPhone,
          creditLimit: client.creditLimit,
          paymentRisk: client.paymentRisk,
          customsRisk: client.customsRisk,
          cargoRisk: client.cargoRisk,
          amlRisk: client.amlRisk,
          isBlocked: client.isBlocked ?? false,
          blockReason: client.blockReason,
        }),
      ),
    );

    return repository.find({
      where: { nit: In(CLIENT_BLUEPRINTS.map((client) => client.nit)) },
    });
  }

  private async seedClientUsers(
    manager: EntityManager,
    clients: Client[],
  ): Promise<User[]> {
    const repository = manager.getRepository(User);
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));

    const clientUsers = await Promise.all(
      CLIENT_BLUEPRINTS.map(async (client, index) => {
        const entity = mustFind(clientByNit.get(client.nit), client.legalName);
        const passwordHash = await bcrypt.hash(`seed$portal.${client.key}`, 10);
        return repository.create({
          clientId: entity.clientId,
          role: UserRole.CLIENTE,
          fullName: `${client.primaryContactName} Portal`,
          email: `2895884051401+portal.${client.key}@ingenieria.usac.edu.gt`,
          passwordHash,
          phone: client.primaryContactPhone,
          isActive: true,
        });
      })
    );

    await repository.save(clientUsers);

    return repository.find({
      where: { email: In(clientUsers.map((user) => user.email)) },
    });
  }

  private async seedClientContacts(
    manager: EntityManager,
    clients: Client[],
  ): Promise<void> {
    const repository = manager.getRepository(ClientContact);
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));

    let contactCounter = 0;
    const contacts = CLIENT_BLUEPRINTS.flatMap((blueprint) => {
      const client = mustFind(clientByNit.get(blueprint.nit), blueprint.legalName);
      return blueprint.contactPeople.map((contact) => {
        contactCounter++;
        return repository.create({
          clientId: client.clientId,
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          positionTitle: contact.title,
          isActive: contact.isActive ?? true,
        });
      });
    });

    await repository.save(contacts);
  }

  private async seedClientCards(
    manager: EntityManager,
    clients: Client[],
  ): Promise<ClientCard[]> {
    const repository = manager.getRepository(ClientCard);
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));

    let cardCounter = 0;
    const cards = CLIENT_BLUEPRINTS.flatMap((blueprint) => {
      const client = mustFind(clientByNit.get(blueprint.nit), blueprint.legalName);
      return blueprint.cards.map((card) => {
        cardCounter++;
        return repository.create({
          clientId: client.clientId,
          cardAlias: card.alias,
          cardholderName: card.cardholderName,
          cardBrand: card.brand,
          lastFour: card.lastFour,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          isActive: true,
        });
      });
    });

    await repository.save(cards);
    return cards;
  }

  private async seedContracts(
    manager: EntityManager,
    clients: Client[],
    cargoTypes: CargoType[],
  ): Promise<Contract[]> {
    const repository = manager.getRepository(Contract);
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));
    const cargoByName = new Map(cargoTypes.map((cargo) => [cargo.cargoName, cargo]));

    const contracts = CLIENT_BLUEPRINTS.map((blueprint) => {
      const client = mustFind(clientByNit.get(blueprint.nit), blueprint.legalName);
      return repository.create({
        clientId: client.clientId,
        status: blueprint.contractStatus,
        startDate: toDateOnly(daysFromNow(blueprint.contractStartOffsetDays)),
        endDate: toDateOnly(daysFromNow(blueprint.contractEndOffsetDays)),
        acceptedAt:
          blueprint.contractStatus === ContractStatus.VIGENTE
            ? daysFromNow(blueprint.contractStartOffsetDays + 1)
            : null,
        creditLimit: blueprint.creditLimit,
        paymentTermDays: blueprint.paymentTermDays,
        discountPercentage: blueprint.discountPercentage,
        notes: `Contrato marco para ${blueprint.legalName}.`,
        cargoTypes: blueprint.cargoNames.map((cargoName) =>
          mustFind(cargoByName.get(cargoName), cargoName),
        ),
      });
    });

    await repository.save(contracts);
    return repository.find({
      where: { clientId: In(clients.map((client) => client.clientId)) },
      relations: ['cargoTypes'],
    });
  }

  private async seedContractRoutes(
    manager: EntityManager,
    clients: Client[],
    contracts: Contract[],
    routes: Route[],
  ): Promise<ContractRoute[]> {
    const repository = manager.getRepository(ContractRoute);
    const routeByCode = new Map(routes.map((route) => [route.routeCode, route]));
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));
    const contractByClientId = new Map(contracts.map((contract) => [contract.clientId, contract]));

    let routeCounter = 0;
    const records = CLIENT_BLUEPRINTS.flatMap((blueprint) => {
      const client = mustFind(clientByNit.get(blueprint.nit), blueprint.legalName);
      const contract = mustFind(
        contractByClientId.get(client.clientId),
        blueprint.legalName,
      );

      return blueprint.routeCodes.map((routeCode, index) => {
        routeCounter++;
        const route = mustFind(routeByCode.get(routeCode), routeCode);
        const estimatedHours = Number(route.estimatedHours);

        return repository.create({
          contractId: contract.contractId,
          routeId: route.routeId,
          promisedDeliveryHours: roundCurrency(estimatedHours + 0.5 + index * 0.25),
        });
      });
    });

    await repository.save(records);
    return repository.find({
      where: { contractId: In(contracts.map((contract) => contract.contractId)) },
    });
  }

  private async loadContractRates(
    manager: EntityManager,
    contracts: Contract[],
  ): Promise<ContractRate[]> {
    return manager.getRepository(ContractRate).find({
      where: { contractId: In(contracts.map((contract) => contract.contractId)) },
    });
  }

  private async seedTransportUnits(
    manager: EntityManager,
    internalUsers: User[],
    branches: Branch[],
    vehicleTypes: VehicleType[],
  ): Promise<TransportUnit[]> {
    const repository = manager.getRepository(TransportUnit);
    const userByEmail = new Map(internalUsers.map((user) => [user.email, user]));
    const branchByCode = new Map(branches.map((branch) => [branch.branchCode, branch]));
    const vehicleTypeByCode = new Map(
      vehicleTypes.map((vehicleType) => [vehicleType.typeCode, vehicleType]),
    );

    const units = TRANSPORT_UNIT_BLUEPRINTS.map((blueprint, index) => {
      const branch = mustFind(branchByCode.get(blueprint.branchCode), blueprint.branchCode);
      const vehicleType = mustFind(
        vehicleTypeByCode.get(blueprint.vehicleTypeCode),
        blueprint.vehicleTypeCode,
      );
      const pilot = mustFind(userByEmail.get(blueprint.pilotEmail), blueprint.pilotEmail);

      return repository.create({
        branchId: branch.branchId,
        vehicleTypeId: vehicleType.vehicleTypeId,
        pilotUserId: pilot.userId,
        plateNumber: blueprint.plateNumber,
        vehicleModel: blueprint.vehicleModel,
        capacityTon: blueprint.capacityTon,
        hasRefrigeration: blueprint.hasRefrigeration,
        pilotLicenseNumber: blueprint.pilotLicenseNumber,
        pilotLicenseExpiration: toDateOnly(daysFromNow(340 + index * 15)),
        vehicleDocumentExpiration: toDateOnly(daysFromNow(420 + index * 20)),
        isActive: true,
      });
    });

    await repository.save(units);
    return repository.find();
  }

  private async seedUserSessions(
    manager: EntityManager,
    users: User[],
  ): Promise<void> {
    const repository = manager.getRepository(UserSession);
    const sessionUsers = users.slice(0, 24);
    const baseSessions = sessionUsers.map((user, index) => {
      const createdAt = daysFromNow(-(index + 2));
      const lastUsedAt = hoursAfter(createdAt, 12 + index);
      const deletedAt = index % 7 === 0 ? hoursAfter(lastUsedAt, 6) : null;

      return repository.create({
        userId: user.userId,
        userRemote: `10.0.${(index % 8) + 1}.${20 + index}`,
        userAgent: index % 2 === 0 ? 'Chrome/LogiTrans Seed' : 'MobileApp/LogiTrans Seed',
        userUuid: String(user.userId),
        sessionUuid: randomUUID(),
        sessionToken: `seed-session-token-${index + 1}-${user.userId}`,
        sessionSource: index % 2 === 0 ? 'WEB_PORTAL' : 'MOBILE_APP',
        usageCount: 3 + index,
        lastUsedAt,
        expirationAt: daysFromNow(25 - index),
        deletedAt,
        createdAt,
        updatedAt: deletedAt ?? lastUsedAt,
      });
    });

    const priorityUsers = users.filter((user) =>
      MVP_PRIORITY_USER_EMAILS.includes(user.email),
    );

    const prioritySessions = priorityUsers.flatMap((user, index) => {
      const activeCreatedAt = daysFromNow(-(index + 1));
      const activeLastUsedAt = hoursAfter(activeCreatedAt, 3 + index);

      const closedCreatedAt = hoursAfter(activeCreatedAt, -8);
      const closedLastUsedAt = hoursAfter(closedCreatedAt, 9);
      const closedDeletedAt = hoursAfter(closedLastUsedAt, 1);

      return [
        repository.create({
          userId: user.userId,
          userRemote: `172.16.${(index % 6) + 1}.${140 + index}`,
          userAgent: 'Chrome/LogiTrans MVP Session',
          userUuid: String(user.userId),
          sessionUuid: randomUUID(),
          sessionToken: `seed-mvp-active-${index + 1}-${user.userId}`,
          sessionSource: 'WEB_PORTAL',
          usageCount: 12 + index,
          lastUsedAt: activeLastUsedAt,
          expirationAt: daysFromNow(35 - index),
          deletedAt: null,
          createdAt: activeCreatedAt,
          updatedAt: activeLastUsedAt,
        }),
        repository.create({
          userId: user.userId,
          userRemote: `172.18.${(index % 5) + 1}.${170 + index}`,
          userAgent: 'MobileApp/LogiTrans MVP Session',
          userUuid: String(user.userId),
          sessionUuid: randomUUID(),
          sessionToken: `seed-mvp-closed-${index + 1}-${user.userId}`,
          sessionSource: 'MOBILE_APP',
          usageCount: 6 + index,
          lastUsedAt: closedLastUsedAt,
          expirationAt: daysFromNow(12 - index),
          deletedAt: closedDeletedAt,
          createdAt: closedCreatedAt,
          updatedAt: closedDeletedAt,
        }),
      ];
    });

    await repository.save([...baseSessions, ...prioritySessions]);
  }

  private async seedPasswordRecoveryTokens(
    manager: EntityManager,
    users: User[],
  ): Promise<void> {
    const repository = manager.getRepository(PasswordRecoveryToken);
    const selectedUsers = users.slice(3, 13);
    const baseTokens = selectedUsers.map((user, index) => {
      const expiresAt = daysFromNow(2 + index);
      const usedAt = index % 3 === 0 ? daysFromNow(-(index + 1)) : null;

      return repository.create({
        userId: user.userId,
        tokenHash: `recovery-token-${index + 1}-${user.userId}`,
        expiresAt,
        usedAt,
      });
    });

    const priorityUsers = users.filter((user) =>
      MVP_PRIORITY_USER_EMAILS.includes(user.email),
    );

    const priorityTokens = priorityUsers.flatMap((user, index) => {
      return [
        repository.create({
          userId: user.userId,
          tokenHash: `mvp-recovery-active-${index + 1}-${randomUUID()}`,
          expiresAt: daysFromNow(7 + index),
          usedAt: null,
        }),
        repository.create({
          userId: user.userId,
          tokenHash: `mvp-recovery-used-${index + 1}-${randomUUID()}`,
          expiresAt: daysFromNow(3 + index),
          usedAt: daysFromNow(-(index + 2)),
        }),
      ];
    });

    await repository.save([...baseTokens, ...priorityTokens]);
  }

  private async seedOrders(
    manager: EntityManager,
    clients: Client[],
    clientUsers: User[],
    contracts: Contract[],
    contractRoutes: ContractRoute[],
    contractRates: ContractRate[],
    routes: Route[],
    cargoTypes: CargoType[],
    transportUnits: TransportUnit[],
  ): Promise<CreatedOrderRecord[]> {
    const clientByNit = new Map(clients.map((client) => [client.nit, client]));
    const portalUserByClientId = new Map(clientUsers.map((user) => [user.clientId, user]));
    const contractByClientId = new Map(contracts.map((contract) => [contract.clientId, contract]));
    const routeById = new Map(routes.map((route) => [route.routeId, route]));
    const cargoByName = new Map(cargoTypes.map((cargo) => [cargo.cargoName, cargo]));
    const ratesByContractId = new Map<number, ContractRate[]>(
      contracts.map((contract) => [
        contract.contractId,
        contractRates.filter((rate) => rate.contractId === contract.contractId),
      ]),
    );
    const contractRoutesByContractId = new Map<number, ContractRoute[]>(
      contracts.map((contract) => [
        contract.contractId,
        contractRoutes.filter((route) => route.contractId === contract.contractId),
      ]),
    );

    const branchNameByOrigin = new Map<string, string>([
      ['CIUDAD DE GUATEMALA', 'GUA'],
      ['QUETZALTENANGO', 'XELA'],
      ['PUERTO BARRIOS', 'PBAR'],
    ]);

    const activeBlueprints = CLIENT_BLUEPRINTS.filter(
      (client) => client.contractStatus === ContractStatus.VIGENTE && !client.isBlocked,
    );

    const createdOrders: CreatedOrderRecord[] = [];
    const orderRepository = manager.getRepository(Order);
    let orderCounter = 0;

    for (const [clientIndex, blueprint] of activeBlueprints.entries()) {
      const client = mustFind(clientByNit.get(blueprint.nit), blueprint.legalName);
      const contract = mustFind(contractByClientId.get(client.clientId), blueprint.legalName);
      const portalUser = mustFind(portalUserByClientId.get(client.clientId), blueprint.legalName);
      const availableContractRoutes = mustFind(
        contractRoutesByContractId.get(contract.contractId),
        `${blueprint.legalName} rutas`,
      );
      const availableRates = mustFind(
        ratesByContractId.get(contract.contractId),
        `${blueprint.legalName} tarifas`,
      );

      for (const [planIndex, plan] of ORDER_PLANS.entries()) {
        const requestedAt = hoursAfter(daysFromNow(-(75 - clientIndex * 5 - planIndex * 2)), planIndex * 4);
        const contractRoute =
          plan.stage === 'REGISTRADA'
            ? null
            : availableContractRoutes[planIndex % availableContractRoutes.length];
        const route = contractRoute ? mustFind(routeById.get(contractRoute.routeId), `${contractRoute.routeId}`) : null;
        const preferredCargoName =
          plan.requiresRefrigeration && blueprint.cargoNames.includes('CARGA REFRIGERADA')
            ? 'CARGA REFRIGERADA'
            : blueprint.cargoNames[planIndex % blueprint.cargoNames.length];
        const cargoType = mustFind(cargoByName.get(preferredCargoName), preferredCargoName);
        const unit = route
          ? this.pickTransportUnit(
              transportUnits,
              routes,
              availableRates,
              branchNameByOrigin.get(route.origin),
              plan.preferredVehicleTypeCode,
              cargoType.requiresRefrigeration || Boolean(plan.requiresRefrigeration),
            )
          : null;
        const contractRate = unit
          ? availableRates.find(
              (rate) => Number(rate.vehicleTypeId) === Number(unit.vehicleTypeId),
            ) ?? availableRates[0]
          : null;
        const distance = route ? Number(route.distanceKm) : 0;
        const baseRatePerKm = contractRate ? Number(contractRate.baseRatePerKm) : 0;
        const discountPercentage = contractRate ? Number(contractRate.discountPercentage) : 0;
        const finalRatePerKm = contractRate ? Number(contractRate.finalRatePerKm) : 0;
        const subtotalAmount = route ? roundCurrency(distance * finalRatePerKm) : 0;
        const taxAmount = route ? roundCurrency(subtotalAmount * 0.12) : 0;
        const totalAmount = route ? roundCurrency(subtotalAmount + taxAmount) : 0;
        const scheduledPickupAt = route ? hoursAfter(requestedAt, 10 + planIndex) : null;
        const promisedDeliveryAt =
          route && scheduledPickupAt
            ? hoursAfter(scheduledPickupAt, Number(contractRoute?.promisedDeliveryHours ?? route.estimatedHours))
            : null;
        const dispatchedAt =
          plan.stage === 'TRANSITO' || plan.stage === 'ENTREGADA'
            ? hoursAfter(scheduledPickupAt ?? requestedAt, 1.5)
            : null;

        const declaredWeight = unit
          ? this.calculateDeclaredWeight(Number(unit.capacityTon), plan.preferredVehicleTypeCode)
          : roundCurrency(1.2 + planIndex * 0.35 + clientIndex * 0.1);
        const loadedWeight = unit ? roundCurrency(declaredWeight * 0.98) : null;
        const fuelCost = unit && distance > 0 ? roundCurrency(distance * 2.15) : 0;
        const viaticsCost = unit && distance > 0 ? roundCurrency(distance * 0.42) : 0;
        const maintenanceCost = unit && distance > 0 ? roundCurrency(distance * 0.28) : 0;
        const initialStatus = this.resolveInitialStatus(plan.stage);

        orderCounter++;
        const order = await orderRepository.save(
          orderRepository.create({
            contractId: contract.contractId,
            requestedByUserId: portalUser.userId,
            branchId: unit?.branchId ?? null,
            contractRouteId: contractRoute?.contractRouteId,
            contractRateId: contractRate?.contractRateId,
            cargoTypeId: cargoType.cargoTypeId,
            unitId: unit?.unitId,
            status: initialStatus,
            cargoDescription: `${cargoType.cargoName} para ${blueprint.legalName}`,
            declaredWeightTon: declaredWeight,
            loadedWeightTon: loadedWeight,
            origin: route?.origin,
            destination: route?.destination,
            pickupAddress: `${route?.origin ?? 'CIUDAD DE GUATEMALA'} - centro de distribucion ${clientIndex + 1}`,
            deliveryAddress: `${route?.destination ?? 'CIUDAD DE GUATEMALA'} - punto de entrega ${planIndex + 1}`,
            requestedAt,
            scheduledPickupAt,
            promisedDeliveryAt,
            dispatchedAt,
            stowageConfirmed:
              plan.stage === 'LISTA' ||
              plan.stage === 'TRANSITO' ||
              plan.stage === 'ENTREGADA'
                ? true
                : null,
            isSealed:
              plan.stage === 'LISTA' ||
              plan.stage === 'TRANSITO' ||
              plan.stage === 'ENTREGADA'
                ? true
                : null,
            distanceKm: distance,
            baseRatePerKm,
            discountPercentage,
            finalRatePerKm,
            subtotalAmount,
            taxAmount,
            totalAmount,
            fuelCost,
            viaticsCost,
            maintenanceCost,
            notes: `Orden seed ${plan.stage.toLowerCase()} para ${blueprint.legalName}`,
          }),
        );

        createdOrders.push({
          order,
          contract,
          blueprint,
          route,
          contractRoute,
          cargoType,
          unit,
          finalStage: plan.stage,
          requestedAt,
          scheduledPickupAt,
          dispatchedAt,
          deliveredAt: null,
        });
      }
    }

    for (const record of createdOrders.filter((order) => order.finalStage === 'ENTREGADA')) {
      const deliveredAt = hoursAfter(
        record.dispatchedAt ?? record.scheduledPickupAt ?? record.requestedAt,
        Number(record.contractRoute?.promisedDeliveryHours ?? 8) + 1,
      );

      await orderRepository.update(record.order.orderId, {
        status: OrderStatus.ENTREGADA,
        deliveredAt,
        receiverName: `Recibe ${record.blueprint.legalName}`,
        receiverSignaturePath: `/seed/signatures/${record.order.orderId}.png`,
        deliveryEvidencePath: `/seed/evidence/${record.order.orderId}.png`,
      });

      record.order.status = OrderStatus.ENTREGADA;
      record.deliveredAt = deliveredAt;
    }

    return createdOrders;
  }

  private async seedOrderLogs(
    manager: EntityManager,
    orders: CreatedOrderRecord[],
  ): Promise<void> {
    const repository = manager.getRepository(OrderRouteLog);
    let logCounter = 0;
    const logs = orders.flatMap((record, index) => {
      const entries: OrderRouteLog[] = [];

      if (record.finalStage === 'LISTA' && record.scheduledPickupAt) {
        logCounter++;
        entries.push(
          repository.create({

            orderId: record.order.orderId,
            eventType: RouteEventType.OTRO,
            eventTime: hoursAfter(record.scheduledPickupAt, -1),
            description: 'Carga validada y unidad lista para despacho.',
          }),
        );
      }

      if (
        (record.finalStage === 'TRANSITO' || record.finalStage === 'ENTREGADA') &&
        record.dispatchedAt
      ) {
        logCounter++;
        entries.push(
          repository.create({

            orderId: record.order.orderId,
            eventType: RouteEventType.SALIDA,
            eventTime: record.dispatchedAt,
            description: `Salida registrada desde ${record.route?.origin ?? 'origen pendiente'}.`,
          }),
        );

        logCounter++;
        entries.push(
          repository.create({

            orderId: record.order.orderId,
            eventType: RouteEventType.PUNTO_CONTROL,
            eventTime: hoursAfter(record.dispatchedAt, 2.5),
            description: 'Paso por punto de control intermedio sin novedad.',
          }),
        );

        if (record.route?.isInternational) {
          logCounter++;
          entries.push(
            repository.create({
  
              orderId: record.order.orderId,
              eventType: RouteEventType.ADUANA,
              eventTime: hoursAfter(record.dispatchedAt, 4.5),
              description: 'Revision aduanera completada para tramo internacional.',
            }),
          );
        }

        if (index % 4 === 0) {
          logCounter++;
          entries.push(
            repository.create({
  
              orderId: record.order.orderId,
              eventType: RouteEventType.INCIDENTE,
              eventTime: hoursAfter(record.dispatchedAt, 5.5),
              description: 'Ajuste menor de ruta por congestion vehicular.',
            }),
          );
        }
      }

      if (record.finalStage === 'ENTREGADA' && record.deliveredAt) {
        logCounter++;
        entries.push(
          repository.create({

            orderId: record.order.orderId,
            eventType: RouteEventType.LLEGADA,
            eventTime: record.deliveredAt,
            description: `Entrega completada en ${record.route?.destination ?? 'destino final'}.`,
          }),
        );
      }

      return entries;
    });

    if (logs.length > 0) {
      await repository.save(logs);
    }
  }

  private async seedInvoices(
    manager: EntityManager,
    orders: CreatedOrderRecord[],
    contracts: Contract[],
  ): Promise<Invoice[]> {
    const repository = manager.getRepository(Invoice);
    const deliveredOrders = orders.filter((order) => order.finalStage === 'ENTREGADA');
    let invoices = await repository.find({
      where: { orderId: In(deliveredOrders.map((record) => record.order.orderId)) },
    });
    const contractById = new Map(
      contracts.map((contract) => [String(contract.contractId), contract]),
    );

    // Fallback for environments where trigger-based draft invoice creation is missing.
    for (const record of deliveredOrders) {
      const recordOrderId = String(record.order.orderId);
      const existing = invoices.find(
        (invoice) => String(invoice.orderId) === recordOrderId,
      );
      if (existing) {
        continue;
      }

      const contract = mustFind(
        contractById.get(String(record.contract.contractId)),
        String(record.contract.contractId),
      );
      const issueDate = hoursAfter(record.deliveredAt ?? daysFromNow(-2), 2);
      const dueDate = toDateOnly(
        hoursAfter(issueDate, Number(contract.paymentTermDays) * 24),
      );

      await repository.query(
        `INSERT INTO invoices (
          order_id,
          client_id,
          status,
          issue_date,
          due_date,
          client_name,
          client_nit,
          client_address,
          service_description,
          subtotal_amount,
          tax_amount,
          total_amount,
          pdf_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (order_id) DO NOTHING`,
        [
          record.order.orderId,
          record.contract.clientId,
          InvoiceStatus.BORRADOR,
          issueDate,
          dueDate,
          record.blueprint.legalName,
          record.blueprint.nit,
          record.blueprint.taxAddress,
          `SERVICIO LOGISTICO DE LA ORDEN ${recordOrderId}`,
          Number(record.order.subtotalAmount ?? 0),
          Number(record.order.taxAmount ?? 0),
          Number(record.order.totalAmount ?? 0),
          `/seed/invoices/${record.order.orderId}-draft.pdf`,
        ],
      );
    }

    invoices = await repository.find({
      where: { orderId: In(deliveredOrders.map((record) => record.order.orderId)) },
    });
    const invoiceByOrderId = new Map(
      invoices.map((invoice) => [String(invoice.orderId), invoice]),
    );

    for (const [index, record] of deliveredOrders.entries()) {
      const invoice = mustFind(
        invoiceByOrderId.get(String(record.order.orderId)),
        String(record.order.orderId),
      );
      const contract = mustFind(
        contractById.get(String(record.contract.contractId)),
        String(record.contract.contractId),
      );
      const subtotalAmount = Number(record.order.subtotalAmount ?? 0);
      const taxAmount = Number(record.order.taxAmount ?? 0);
      const totalAmount = Number(record.order.totalAmount ?? 0);
      const issueDate = hoursAfter(record.deliveredAt ?? daysFromNow(-2), 2);
      const paymentDueDate = toDateOnly(
        hoursAfter(issueDate, Number(contract.paymentTermDays) * 24),
      );
      const invoiceBaseUpdate = {
        issueDate,
        dueDate: paymentDueDate,
        clientName: record.blueprint.legalName,
        clientNit: record.blueprint.nit,
        clientAddress: record.blueprint.taxAddress,
        serviceDescription: `Servicio de transporte ${record.route?.origin ?? 'origen por definir'} -> ${record.route?.destination ?? 'destino por definir'} para ${record.blueprint.legalName}`,
        subtotalAmount,
        taxAmount,
        totalAmount,
      };
      const invoiceSeedId = String(invoice.invoiceId);

      if (index < 8) {
        await repository.update(invoice.invoiceId, {
          ...invoiceBaseUpdate,
          status: InvoiceStatus.BORRADOR,
          pdfPath: `/seed/invoices/${invoice.invoiceId}-draft.pdf`,
        });
      } else if (index < 13) {
        await repository.update(invoice.invoiceId, {
          ...invoiceBaseUpdate,
          status: InvoiceStatus.CERTIFICADA,
          certifiedAt: hoursAfter(issueDate, 5),
          felUuid: `FEL-${invoiceSeedId.slice(0, 8).toUpperCase()}`,
          pdfPath: `/seed/invoices/${invoice.invoiceId}.pdf`,
        });
      } else if (index < 17) {
        await repository.update(invoice.invoiceId, {
          ...invoiceBaseUpdate,
          status: InvoiceStatus.ENVIADA,
          certifiedAt: hoursAfter(issueDate, 4),
          sentAt: hoursAfter(issueDate, 8),
          felUuid: `FEL-${invoiceSeedId.slice(0, 8).toUpperCase()}`,
          pdfPath: `/seed/invoices/${invoice.invoiceId}.pdf`,
        });
      } else if (index < 22) {
        await repository.update(invoice.invoiceId, {
          ...invoiceBaseUpdate,
          status: InvoiceStatus.ENVIADA,
          certifiedAt: hoursAfter(issueDate, 3),
          sentAt: hoursAfter(issueDate, 7),
          felUuid: `FEL-${invoiceSeedId.slice(0, 8).toUpperCase()}`,
          pdfPath: `/seed/invoices/${invoice.invoiceId}.pdf`,
        });
      } else {
        await repository.update(invoice.invoiceId, {
          ...invoiceBaseUpdate,
          status: InvoiceStatus.RECHAZADA,
          pdfPath: `/seed/invoices/${invoice.invoiceId}-rejected.pdf`,
        });
      }
    }

    return repository.find({
      where: { orderId: In(deliveredOrders.map((record) => record.order.orderId)) },
    });
  }

  private async seedPayments(
    manager: EntityManager,
    invoices: Invoice[],
    clientCards: ClientCard[],
    internalUsers: User[],
  ): Promise<void> {
    const repository = manager.getRepository(Payment);
    const financeUsers = internalUsers.filter(
      (user) => user.role === UserRole.AGENTE_FINANCIERO,
    );
    const cardByClientId = new Map<number, ClientCard>();

    for (const card of clientCards) {
      if (!cardByClientId.has(card.clientId)) {
        cardByClientId.set(card.clientId, card);
      }
    }

    const invoicesForApprovedPayments = invoices
      .filter((invoice) => invoice.status === InvoiceStatus.ENVIADA)
      .slice(0, 5);
    const remainingInvoices = invoices.filter(
      (invoice) => !invoicesForApprovedPayments.some((item) => item.invoiceId === invoice.invoiceId),
    );
    const invoicesForPendingPayments = remainingInvoices
      .filter(
        (invoice) =>
          invoice.status === InvoiceStatus.CERTIFICADA ||
          invoice.status === InvoiceStatus.ENVIADA,
      )
      .slice(0, 5);

    for (const [index, invoice] of invoicesForApprovedPayments.entries()) {
      const financeReviewer = mustFind(
        financeUsers[index % financeUsers.length],
        'revisor financiero',
      );
      const card = cardByClientId.get(invoice.clientId);
      const method = index % 3 === 0 ? PaymentMethod.TARJETA : index % 3 === 1 ? PaymentMethod.TRANSFERENCIA : PaymentMethod.CHEQUE;

      await repository.save(
        repository.create({
          invoiceId: invoice.invoiceId,
          method,
          status: PaymentStatus.APROBADO,
          cardId: method === PaymentMethod.TARJETA ? card?.cardId : null,
          bankName:
            method === PaymentMethod.TARJETA ? null : method === PaymentMethod.CHEQUE ? 'BANCO INDUSTRIAL' : 'BAC CREDOMATIC',
          bankAccountNumber:
            method === PaymentMethod.TARJETA ? null : `0100-2000-${100 + index}`,
          bankReference:
            method === PaymentMethod.TARJETA ? null : `REF-PAG-${index + 1}`,
          supportDocumentPath:
            method === PaymentMethod.TARJETA ? null : `/seed/payments/support-${invoice.invoiceId}.pdf`,
          amount: Number(invoice.totalAmount),
          paymentDate: hoursAfter(new Date(invoice.sentAt ?? invoice.issueDate), 24 + index * 2),
          reviewedByUserId: financeReviewer.userId,
        }),
      );
    }

    for (const [index, invoice] of invoicesForPendingPayments.entries()) {
      const status = index % 2 === 0 ? PaymentStatus.PENDIENTE : PaymentStatus.RECHAZADO;
      const financeReviewer = status === PaymentStatus.RECHAZADO ? financeUsers[index % financeUsers.length] : null;

      await repository.save(
        repository.create({
          invoiceId: invoice.invoiceId,
          method: index % 2 === 0 ? PaymentMethod.TRANSFERENCIA : PaymentMethod.CHEQUE,
          status,
          cardId: null,
          bankName: index % 2 === 0 ? 'BANRURAL' : 'BANCO G&T',
          bankAccountNumber: `0200-3000-${200 + index}`,
          bankReference: `REF-REV-${index + 1}`,
          supportDocumentPath: `/seed/payments/review-${invoice.invoiceId}.pdf`,
          amount: Number(invoice.totalAmount),
          paymentDate: hoursAfter(new Date(invoice.issueDate), 18 + index * 3),
          reviewedByUserId: financeReviewer?.userId,
        }),
      );
    }
  }

  private pickTransportUnit(
    units: TransportUnit[],
    routes: Route[],
    contractRates: ContractRate[],
    preferredBranchCode: string | undefined,
    preferredVehicleTypeCode: OrderPlan['preferredVehicleTypeCode'],
    requiresRefrigeration: boolean,
  ): TransportUnit {
    const vehicleTypeIdByRateOrder = new Set(contractRates.map((rate) => rate.vehicleTypeId));
    const candidates = units.filter((unit) => {
      if (!vehicleTypeIdByRateOrder.has(unit.vehicleTypeId)) {
        return false;
      }

      if (requiresRefrigeration && !unit.hasRefrigeration) {
        return false;
      }

      return true;
    });

    const prioritized = candidates.filter((unit) => {
      const branchMatches =
        !preferredBranchCode ||
        this.resolveBranchCodeFromUnit(unit, routes) === preferredBranchCode;
      const vehicleTypeMatches =
        !preferredVehicleTypeCode ||
        this.resolveVehicleTypeCode(unit.vehicleTypeId) === preferredVehicleTypeCode;

      return branchMatches && vehicleTypeMatches;
    });

    return prioritized[0] ?? candidates[0] ?? units[0];
  }

  private resolveBranchCodeFromUnit(
    unit: TransportUnit,
    _routes: Route[],
  ): string | undefined {
    const mapping = new Map<number, string>([
      [1, 'GUA'],
      [2, 'XELA'],
      [3, 'PBAR'],
    ]);

    return mapping.get(unit.branchId);
  }

  private resolveVehicleTypeCode(vehicleTypeId: number): 'LIGHT' | 'HEAVY' | 'TRAILER' | undefined {
    const mapping = new Map<number, 'LIGHT' | 'HEAVY' | 'TRAILER'>([
      [1, 'LIGHT'],
      [2, 'HEAVY'],
      [3, 'TRAILER'],
    ]);

    return mapping.get(vehicleTypeId);
  }

  private calculateDeclaredWeight(
    capacityTon: number,
    preferredVehicleTypeCode: OrderPlan['preferredVehicleTypeCode'],
  ): number {
    if (preferredVehicleTypeCode === 'LIGHT') {
      return roundCurrency(Math.min(capacityTon - 0.2, 2.9));
    }

    if (preferredVehicleTypeCode === 'HEAVY') {
      return roundCurrency(Math.min(capacityTon - 0.3, 10.9));
    }

    if (preferredVehicleTypeCode === 'TRAILER') {
      return roundCurrency(Math.min(capacityTon - 0.8, 24.2));
    }

    return roundCurrency(Math.max(1.2, capacityTon * 0.65));
  }

  private resolveInitialStatus(stage: OrderPlan['stage']): OrderStatus {
    if (stage === 'REGISTRADA') {
      return OrderStatus.REGISTRADA;
    }

    if (stage === 'ASIGNADA') {
      return OrderStatus.ASIGNADA;
    }

    if (stage === 'LISTA') {
      return OrderStatus.LISTA_PARA_DESPACHO;
    }

    return OrderStatus.EN_TRANSITO;
  }
}

export async function runInitialSeed(dataSource: DataSource): Promise<SeedSummary> {
  const seeder = new DatabaseSeeder(dataSource);
  return seeder.run();
}