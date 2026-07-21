import type { UserRole } from "@/lib/api/types"

export type DemoPortal = {
  role: UserRole
  label: string
  description: string
  email: string
  password: string
}

/** Credenciales seed del MVP para explorar cada portal en staging. */
export const DEMO_PORTALS: DemoPortal[] = [
  {
    role: "GERENCIA",
    label: "Gerencia",
    description: "Dashboard BI y rentabilidad",
    email: "2895884051401@ingenieria.usac.edu.gt",
    password: "LogiGerencia",
  },
  {
    role: "AGENTE_FINANCIERO",
    label: "Finanzas",
    description: "Flujo FEL y conciliación",
    email: "2895884051401+f@ingenieria.usac.edu.gt",
    password: "LogiFinanzas",
  },
  {
    role: "AGENTE_OPERATIVO",
    label: "Operaciones",
    description: "Clientes y contratos",
    email: "2895884051401+v@ingenieria.usac.edu.gt",
    password: "LogiVentas",
  },
  {
    role: "AGENTE_LOGISTICO",
    label: "Logística",
    description: "Unidades y monitoreo",
    email: "2895884051401+l@ingenieria.usac.edu.gt",
    password: "LogiLogistica",
  },
  {
    role: "ENCARGADO_PATIO",
    label: "Patio",
    description: "Pesaje y despacho",
    email: "2895884051401+p@ingenieria.usac.edu.gt",
    password: "LogiPatio",
  },
  {
    role: "PILOTO",
    label: "Piloto",
    description: "Bitácoras y entregas",
    email: "2895884051401+t@ingenieria.usac.edu.gt",
    password: "LogiPiloto",
  },
  {
    role: "CLIENTE",
    label: "Cliente",
    description: "Portal de contratos y órdenes",
    email: "2895884051401+c@ingenieria.usac.edu.gt",
    password: "Logi2026",
  },
  {
    role: "CERTIFICADOR_FEL",
    label: "Certificador FEL",
    description: "Simulador técnico FEL",
    email: "2895884051401+s@ingenieria.usac.edu.gt",
    password: "LogiSAT",
  },
]
