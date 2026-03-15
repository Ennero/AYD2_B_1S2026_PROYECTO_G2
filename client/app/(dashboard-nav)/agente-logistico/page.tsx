"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { DashboardSummary } from "@/types/logistics"
import { ClipboardList, Truck, MapPin, ArrowRight } from "lucide-react"

export default function AgenteLogisticoPage() {
  const { user, loading: authLoading } = useAuth()
  const userName = authLoading ? "..." : (user?.nombre ?? "Agente")

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  useEffect(() => {
    api
      .get<DashboardSummary>(ENDPOINTS.LOGISTICS.DASHBOARD_SUMMARY)
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false))
  }, [])

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full min-h-screen px-6 py-12 md:p-20 flex flex-col items-center text-center max-w-7xl mx-auto">

        {/* Welcome */}
        <div className="max-w-4xl mb-16 mt-8">
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-[#0A3B7C] tracking-tight leading-tight">
            ¡Bienvenido, <br />
            <span className="text-[#53B73E]">{userName}!</span>
          </h1>
          <p className="text-[#64748B] text-xl md:text-2xl mt-6 font-light max-w-3xl mx-auto">
            Panel de Control Logístico — gestión de órdenes de servicio y asignación de rutas para operaciones LogiTrans.
          </p>
        </div>

        {/* KPI + Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">

          {/* Action — Órdenes */}
          <Link href="/agente-logistico/ordenes" className="lg:col-span-1 block outline-none group">
            <div className="bg-white/90 backdrop-blur-md border border-black/5 hover:border-[#53B73E]/40 rounded-3xl p-10 h-full transition-all duration-300 transform group-hover:-translate-y-2 shadow-sm group-hover:shadow-[0_20px_50px_rgba(10,59,124,0.1)] flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-[#0A3B7C]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#0A3B7C]/20 transition-colors">
                <ClipboardList size={40} className="text-[#0A3B7C]" />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-bold text-[#0A3B7C] mb-4">Órdenes de Servicio</h3>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  Revisa y gestiona las órdenes entrantes. Asigna piloto, vehículo y ruta a cada servicio pendiente.
                </p>
              </div>
              <div className="mt-4 text-[#53B73E] font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Ver órdenes <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* KPI — Órdenes Pendientes */}
          <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-[#64748B] text-sm font-semibold uppercase tracking-[0.2em]">Órdenes Pendientes</div>
            <div className="flex flex-col items-center">
              <div className="text-7xl font-heading font-extrabold text-[#0A3B7C]">
                {loadingSummary ? "—" : (summary?.pendingOrders ?? "—")}
              </div>
              <div className="w-12 h-1.5 bg-[#53B73E]/20 rounded-full mt-4" />
            </div>
            <p className="text-[#64748B] text-base mt-2">Esperan asignación</p>
          </div>

          {/* KPI — Unidades Disponibles */}
          <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-[#64748B] text-sm font-semibold uppercase tracking-[0.2em]">Unidades Disponibles</div>
            <div className="flex flex-col items-center">
              <div className="text-7xl font-heading font-extrabold text-[#53B73E]">
                {loadingSummary ? "—" : (summary?.availableUnits ?? "—")}
              </div>
              <div className="w-12 h-1.5 bg-[#0A3B7C]/10 rounded-full mt-4" />
            </div>
            <div className="flex items-center gap-2 text-[#53B73E] font-medium text-base">
              <Truck size={24} />
              Binomios listos
            </div>
          </div>
        </div>

        {/* Secondary action */}
        <div className="mt-12">
          <Link
            href="/agente-logistico/asignacion-rutas"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-md border border-black/5 rounded-full text-[#0A3B7C] font-semibold text-sm shadow-sm hover:border-[#0A3B7C]/30 hover:shadow-md transition-all"
          >
            <MapPin size={18} />
            Catálogo de Rutas
          </Link>
        </div>

        {/* Footer status */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-4 px-8 py-4 bg-white/60 rounded-full border border-black/5 shadow-sm">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#53B73E]" />
            </span>
            <span className="text-[#0A3B7C] text-sm font-bold tracking-widest uppercase">Sistema Operativo</span>
          </div>
        </div>

      </div>
    </div>
  )
}
