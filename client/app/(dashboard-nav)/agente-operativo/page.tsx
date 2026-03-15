"use client"

import Link from "next/link"
import WelcomeCard from "@/components/shared/WelcomeCard"
import Card from "@/components/ui/Card"
import { useAuth } from "@/hooks/useAuth"

import { UserPlus, NotebookPen, Handshake, ChevronRight, TrendingUp, Users, Globe2, FileSignature } from 'lucide-react';

export default function AgenteOperativoPage() {
  const { user, loading } = useAuth()

  const userName = loading ? "..." : (user?.nombre ?? "Agente")

  return (
    <div className="relative">
      {/* Background Watermarks */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-between">
        <Globe2 className="absolute -top-24 -right-24 text-primary/[0.03] w-[500px] h-[500px] transform rotate-12" strokeWidth={1} />
        <FileSignature className="absolute -bottom-24 -left-24 text-secondary/[0.04] w-[600px] h-[600px] transform -rotate-12" strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-8 animate-in fade-in duration-500">
      <WelcomeCard
        userName={userName}
        roleName="Área Comercial"
        description="Gestiona la incorporación de nuevos clientes y formaliza las reglas operativas y financieras mediante contratos digitales."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
            <Handshake className="text-secondary" />
            Accesos Rápidos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/agente-operativo/registrar-cliente" className="block group">
              <Card className="h-full cursor-pointer hover:shadow-lg hover:border-accent/40 transition-all flex flex-col items-start gap-4 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <UserPlus size={80} className="text-primary transform rotate-12" />
                </div>
                <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center shadow-sm">
                  <UserPlus size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-primary mb-1">Nuevo Cliente</h3>
                  <p className="text-text-muted text-sm pr-6">
                    Registra datos fiscales, información de contacto y evalúa el perfil de riesgo.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                  Comenzar registro <ChevronRight size={16} className="ml-1" />
                </div>
              </Card>
            </Link>

            <Link href="/agente-operativo/formalizar-contrato" className="block group">
              <Card className="h-full cursor-pointer hover:shadow-lg hover:border-accent/40 transition-all flex flex-col items-start gap-4 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <NotebookPen size={80} className="text-secondary transform -rotate-12" />
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
                  <NotebookPen size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-primary mb-1">Crear Contrato</h3>
                  <p className="text-text-muted text-sm pr-6">
                    Define límite de crédito, rutas comerciales, tipos de carga y condiciones financieras.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                  Formalizar acuerdo <ChevronRight size={16} className="ml-1" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column: Stats / Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold text-primary opacity-0 lg:opacity-100 hidden lg:block">
            Resumen
          </h2>
          
          <Card className="bg-surface border-none shadow-sm p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Clientes Activos</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-heading font-bold text-primary">128</span>
                  <span className="text-sm font-medium text-secondary flex items-center"><TrendingUp size={14} className="mr-0.5" /> +12%</span>
                </div>
              </div>
              <div className="p-3 bg-white/60 rounded-xl">
                <Users size={24} className="text-primary" />
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-black/5 rounded-full h-1.5">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-text-muted mt-2">75% meta mensual alcanzada</p>
            </div>
          </Card>

          <Card className="bg-primary text-white border-none shadow-md p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="font-heading font-semibold text-lg relative z-10">Tip del Día</h3>
            <p className="text-sm text-white/80 mt-2 relative z-10">
              Recuerda siempre verificar la vigencia de los documentos fiscales del cliente antes de emitir un nuevo contrato comercial.
            </p>
          </Card>
        </div>

      </div>
    </div>
    </div>
  )
}
