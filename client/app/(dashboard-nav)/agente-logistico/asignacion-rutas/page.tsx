"use client"
// ============================================================
// app/(dashboard-nav)/agente-logistico/asignacion-rutas/page.tsx
// Catálogo de Rutas — Agente Logístico
// ============================================================
// Fetch: GET /api/logistics/routes
// ============================================================

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { RouteInfo } from "@/types/logistics"
import { MapPin, Clock, CheckCircle, Search, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function AsignacionRutasPage() {
  const [routes, setRoutes] = useState<RouteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api
      .get<RouteInfo[]>(ENDPOINTS.LOGISTICS.ROUTES)
      .then(({ data }) => setRoutes(data))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = routes.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold text-text-primary">
            Catálogo de Rutas
          </h1>
          <p className="text-text-muted mt-2 font-body text-lg">
            Rutas activas disponibles para asignación de órdenes de servicio.
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por origen o destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-error transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Estado — cargando */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
            <MapPin size={48} className="animate-bounce text-primary" />
            <p className="font-body text-lg">Cargando rutas...</p>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
              <MapPin size={40} className="text-text-muted" />
            </div>
            <p className="font-subheading text-xl text-text-primary">
              {search ? "Sin resultados para la búsqueda" : "No hay rutas disponibles"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-primary font-semibold hover:underline text-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {/* Grid de rutas */}
        {!loading && filtered.length > 0 && (
          <>
            <p className="text-text-muted text-sm mb-4 text-center">
              {filtered.length} ruta{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((route) => (
                <RouteCard key={route.routeId} route={route} />
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  )
}

// ── Tarjeta de Ruta ──────────────────────────────────────────
function RouteCard({ route }: { route: RouteInfo }) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-8 shadow-sm border border-black/5 transition-all duration-300",
        "hover:border-[#53B73E]/40 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(10,59,124,0.08)]",
        !route.isActive && "opacity-60"
      )}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full",
            route.isActive
              ? "bg-[#53B73E]/10 text-[#53B73E]"
              : "bg-gray-100 text-text-muted"
          )}
        >
          {route.isActive
            ? <><CheckCircle size={12} /> Activa</>
            : <>Inactiva</>
          }
        </div>
      </div>

      {/* Ruta visual */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0A3B7C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-[#0A3B7C]" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Origen</p>
            <p className="font-semibold text-text-primary">{route.origin}</p>
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-3">
          <div className="w-8 flex justify-center">
            <div className="w-0.5 h-6 bg-[#53B73E]/40 rounded-full" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#53B73E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-[#53B73E]" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Destino</p>
            <p className="font-semibold text-text-primary">{route.destination}</p>
          </div>
        </div>
      </div>

      {/* Duración estimada */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <Clock size={16} className="text-text-muted" />
        <span className="text-sm text-text-muted font-medium">
          {route.estimatedHours}h estimadas
        </span>
      </div>
    </div>
  )
}
