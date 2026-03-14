/** Aquí implementar pantalla de Bienvenida del Agente Operativo
 *
 * Pantalla: ¡Bienvenido al Área Comercial!
 * Wireframes: Wireframe-21 (primer cuadro)
 *
 * Contenido:
 * - WelcomeCard con saludo personalizado
 * - Accesos rápidos: "Nuevo Cliente" y "Crear Contrato"
 *
 * Componentes sugeridos: WelcomeCard, Card, Button
 * Ruta sugerida: GET /api/v1/auth/me (para nombre del usuario)
 */
"use client"

import Link from "next/link"
import WelcomeCard from "@/components/shared/WelcomeCard"
import Card from "@/components/ui/Card"
import { useAuth } from "@/hooks/useAuth"

import { UserPlus, NotebookPen, Handshake } from 'lucide-react';

export default function AgenteOperativoPage() {
  const { user, loading } = useAuth()

  const userName = loading ? "..." : (user?.nombre ?? "Agente")

  return (
    <div className="space-y-8">
      <WelcomeCard
        userName={userName}
        roleName="Área Comercial"
        description="Gestiona la incorporación de nuevos clientes y formaliza las reglas operativas y financieras mediante contratos digitales."
      />

      <div className="flex justify-center">
        <Card className="w-full max-w-4xl rounded-2xl p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl"><Handshake/></span>
            </div>

            <h2 className="mt-6">¡Bienvenido al Área Comercial!</h2>
            <p className="text-text-muted text-small mt-2 max-w-2xl mx-auto">
              Gestiona la incorporación de nuevos clientes y formaliza las reglas operativas y financieras mediante
              contratos digitales.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/agente-operativo/registrar-cliente" className="block">
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl"><UserPlus /></span>
                </div>
                <h3 className="text-lg">1. Nuevo Cliente</h3>
                <p className="text-text-muted text-small">
                  Registra datos fiscales, de contacto y perfil de riesgo.
                </p>
              </Card>
            </Link>

            <Link href="/agente-operativo/formalizar-contrato" className="block">
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl"><NotebookPen/></span>
                </div>
                <h3 className="text-lg">2. Crear Contrato</h3>
                <p className="text-text-muted text-small">
                  Define crédito, rutas, tipos de carga y descuentos.
                </p>
              </Card>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
