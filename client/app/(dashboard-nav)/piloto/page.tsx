'use client'
// ============================================================
// app/(dashboard-nav)/piloto/page.tsx
// Dashboard "Mis Viajes" — Portal del Piloto
// ============================================================
// Estructura:
//   - Sidebar izquierdo: FiltrosSidebar (filtros de búsqueda)
//   - Contenido derecho: lista de ViajeCard
//
// Fetch: GET /api/pilot/orders
// Navegación: al hacer clic en una tarjeta → /piloto/monitoreo/[id]
// ============================================================

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { ViajeResumen, FiltrosViaje } from "@/types/pilot"
import { useAuth } from "@/hooks/useAuth"
import FiltrosSidebar from "@/components/piloto/FIltrosSidebar"
import ViajeCard from "@/components/piloto/ViajeCard"
import { Truck } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { param } from "framer-motion/client"



export default function PilotoDashboardPage() {

  const router = useRouter()
  const { user } = useAuth()

  const [viajes, setViajes] = useState<ViajeResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosViaje>({})

  // ---- Fetch inicial y cada vez que cambien los filtros ------
  useEffect(() => {
    fetchViaje(filtros)
  }, [filtros])

  async function fetchViaje(params:FiltrosViaje) {
    setLoading(true)
    try {
      // Construir query string solo con los campos que tienen valor
      const query: Record<string, string> = {}
      if (params.status) query.status = params.status
      if (params.startDate) query.startDate = params.startDate
      if (params.endDate) query.endDate = params.endDate
      if (params.clientName) query.clientName = params.clientName
      if (params.origin) query.origin = params.origin
      if (params.destination) query.destinantion = params.destination
      if (params.cargoType) query.cargoType = params.cargoType
      if (params.sortByWeight) query.sortByWeight = params.sortByWeight
  
      const queryString = new URLSearchParams(query).toString()
      const url = queryString
        ? `${ENDPOINTS.VIAJES.LIST}?${queryString}`
        : ENDPOINTS.VIAJES.LIST
  
      const { data } = await api.get<ViajeResumen[]>(url)
      setViajes(data)
    } catch {
      // El cliente api ya muestra el toast de error automáticamente
    } finally {
      setLoading(false)
    }
  } 

  function handleAbrirViaje(orderId: string) {
    router.push(`/piloto/monitoreo/${orderId}`)
  }

  // -- Separar viajes por estado para mostrar en Tránsito primero -----
  const viajesEnTransito = viajes.filter((v) => v.status == "EN_TRANSITO")
  const viajesPendientes = viajes.filter((v) => v.status == "LISTA_PARA_DESPACHO" )
  const otrosViajes = viajes.filter((v) => v.status !== "EN_TRANSITO" && v.status !== "LISTA_PARA_DESPACHO")

  const viajesOrdenados = [...viajesEnTransito, ...viajesPendientes, ...otrosViajes]

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-7xl mx-auto px-6 py-8">
        {/* ── Bienvenida ──────────────────────────────────────────── */}
        <h1 className="font-heading text-4xl font-extrabold text-center text-text-primary mb-8">
          ¡Bienvenido{user ? `, ${user}` : ""}!
        </h1>

        {/* ── Layout principal: Sidebar + Lista ────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de filtros */}
          <aside className="w-full lg:w-1/4">
            <FiltrosSidebar
              filtros={filtros}
              onChange={(nuevosFiltros) => setFiltros(nuevosFiltros)}
            />
          </aside>

          {/* Lista de viajes */}
          <section className="w-full lg:w-3/4 flex flex-col gap-2">
            <h2 className="font-subheading text-3xl text-center text-text-primary mb-6">
              Mis viajes
            </h2>

            {/* Estado de carga */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
                <Truck size={48} className="animate-bounce text-primary" />
                <p className="font-body text-lg">Cargando tus viajes...</p>
              </div>
            )}

            {/* Sin resultados */}
            {!loading && viajesOrdenados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                  <Truck size={40} className="text-text-muted" />
                </div>
                <p className="font-subheading text-xl text-text-primary">
                  No hay viajes asignados
                </p>
                <p className="font-body text-text-muted text-center max-w-sm">
                  Cuando el agente logístico te asigne una orden, aparecerá aquí.
                </p>
              </div>
            )}

            {/* Tarjetas de viaje */}
            {!loading && viajesOrdenados.map((viaje) => (
              <ViajeCard
                key={viaje.orderId}
                viaje={viaje}
                onAbrir={() => handleAbrirViaje(viaje.orderId)}
              />
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
