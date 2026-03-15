"use client"
// ============================================================
// app/(dashboard-nav)/agente-logistico/ordenes/page.tsx
// Lista de Órdenes de Servicio — Agente Logístico
// ============================================================
// Fetch: GET /api/logistics/orders
// Click en tarjeta → /agente-logistico/ordenes/[id]
// ============================================================

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { OrdenResumen, FiltrosOrden } from "@/types/logistics"
import type { OrderStatus } from "@/types/pilot"
import { ClipboardList, MapPin, Package, Weight, CalendarDays, User, Search, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

// ── Status config ────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; badgeCls: string }> = {
  REGISTRADA:          { label: "Registrada",           badgeCls: "bg-gray-200 text-text-muted border border-gray-300" },
  ASIGNADA:            { label: "Asignada",              badgeCls: "bg-blue-100 text-blue-800 border border-blue-300" },
  LISTA_PARA_DESPACHO: { label: "Lista para Despacho",   badgeCls: "bg-yellow-100 text-yellow-800 border border-yellow-400" },
  EN_TRANSITO:         { label: "En Tránsito",           badgeCls: "bg-green-100 text-green-800 border border-green-300" },
  ENTREGADA:           { label: "Entregada",             badgeCls: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
  BLOQUEADA:           { label: "Bloqueada",             badgeCls: "bg-red-100 text-red-800 border border-red-300" },
  CANCELADA:           { label: "Cancelada",             badgeCls: "bg-gray-200 text-text-muted border border-gray-400" },
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "",                   label: "Todos los estados" },
  { value: "REGISTRADA",          label: "Registrada" },
  { value: "ASIGNADA",            label: "Asignada" },
  { value: "LISTA_PARA_DESPACHO", label: "Lista para Despacho" },
  { value: "EN_TRANSITO",         label: "En Tránsito" },
  { value: "ENTREGADA",           label: "Entregada" },
  { value: "BLOQUEADA",           label: "Bloqueada" },
  { value: "CANCELADA",           label: "Cancelada" },
]

const inputCls = "w-full p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"

// ── Sidebar de Filtros ───────────────────────────────────────
function FiltrosSidebar({
  filtros,
  onChange,
}: {
  filtros: FiltrosOrden
  onChange: (f: FiltrosOrden) => void
}) {
  const [local, setLocal] = useState<FiltrosOrden>(filtros)

  function set(key: keyof FiltrosOrden, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const tieneFiltros = Object.values(local).some(Boolean)

  return (
    <div className="bg-secondary/70 p-6 rounded-xl shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-subheading text-2xl font-bold text-primary">Buscar</h3>
        {tieneFiltros && (
          <button
            onClick={() => { const v: FiltrosOrden = {}; setLocal(v); onChange(v) }}
            className="text-text-muted hover:text-error flex items-center gap-1 text-xs font-bold transition-colors"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Estado */}
      <div>
        <label className="block text-xs font-bold text-primary mb-1">Estado</label>
        <select
          value={local.status ?? ""}
          onChange={(e) => set("status", e.target.value)}
          className={cn(inputCls, "text-gray-600")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Rango de fechas */}
      <div className="flex gap-2">
        <div className="w-1/2">
          <label className="block text-xs font-bold text-primary mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={local.startDate ?? ""}
            onChange={(e) => set("startDate", e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="w-1/2">
          <label className="block text-xs font-bold text-primary mb-1">Fecha Fin</label>
          <input
            type="date"
            value={local.endDate ?? ""}
            onChange={(e) => set("endDate", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <button
        onClick={() => onChange(local)}
        className="w-full bg-surface hover:bg-[#d4bca9] text-primary font-black py-3 rounded shadow-md mt-2 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <Search size={16} />
        FILTRAR
      </button>
    </div>
  )
}

// ── Tarjeta de Orden ─────────────────────────────────────────
function OrdenCard({ orden, onAbrir }: { orden: OrdenResumen; onAbrir: () => void }) {
  const cfg = statusConfig[orden.status] ?? statusConfig["REGISTRADA"]

  const fechaFormateada = orden.requestedAt
    ? new Date(orden.requestedAt).toLocaleDateString("es-GT", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—"

  return (
    <div className="relative bg-primary rounded-2xl shadow-lg mt-4">
      {/* Badge */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
        <span className={cn("font-bold px-6 py-1 rounded-full text-sm shadow whitespace-nowrap", cfg.badgeCls)}>
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center p-6 pt-8 gap-4">
        {/* Columna izquierda */}
        <div className="w-full md:w-1/4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-primary-hover pb-4 md:pb-0 md:pr-4 gap-2">
          <div className="bg-blue-400 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-md border-2 border-white">
            <User size={28} />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">{orden.orderNumber}</span>
          <div className="w-full bg-surface text-primary font-black py-2 px-3 rounded text-center text-sm shadow-inner">
            {orden.clientName}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="w-full md:w-3/4 flex flex-wrap md:flex-nowrap justify-between items-center text-white px-2 md:px-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <CalendarDays size={14} className="text-teal-200" />
            <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Fecha</p>
            <p className="font-semibold text-sm">{fechaFormateada}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <MapPin size={14} className="text-teal-200" />
            <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Origen</p>
            <p className="font-semibold text-sm leading-tight">{orden.origin}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <MapPin size={14} className="text-teal-200" />
            <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Destino</p>
            <p className="font-semibold text-sm leading-tight">{orden.destination}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <Package size={14} className="text-teal-200" />
            <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Tipo</p>
            <p className="font-semibold text-sm leading-tight">{orden.cargoType || "—"}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[50px]">
            <Weight size={14} className="text-teal-200" />
            <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Peso</p>
            <p className="font-semibold text-lg">{orden.declaredWeightTon}T</p>
          </div>

          <div className="flex items-center">
            <button
              onClick={onAbrir}
              className="font-bold py-2 px-4 rounded text-sm shadow-md transition-all hover:-translate-y-0.5 bg-secondary hover:bg-primary-hover text-white whitespace-nowrap"
            >
              Ver Detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function OrdenesPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosOrden>({})

  useEffect(() => {
    fetchOrdenes(filtros)
  }, [filtros])

  async function fetchOrdenes(params: FiltrosOrden) {
    setLoading(true)
    try {
      const query: Record<string, string> = {}
      if (params.status)    query.status    = params.status
      if (params.startDate) query.startDate = params.startDate
      if (params.endDate)   query.endDate   = params.endDate
      if (params.clientId)  query.clientId  = params.clientId

      const qs = new URLSearchParams(query).toString()
      const url = qs ? `${ENDPOINTS.LOGISTICS.ORDERS_LIST}?${qs}` : ENDPOINTS.LOGISTICS.ORDERS_LIST
      const { data } = await api.get<OrdenResumen[]>(url)
      setOrdenes(data)
    } catch {
      // api client ya muestra el toast
    } finally {
      setLoading(false)
    }
  }

  // Registradas primero, luego resto
  const ordenadas = [
    ...ordenes.filter((o) => o.status === "REGISTRADA"),
    ...ordenes.filter((o) => o.status !== "REGISTRADA"),
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-heading text-4xl font-extrabold text-center text-text-primary mb-8">
          Órdenes de Servicio
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4">
            <FiltrosSidebar filtros={filtros} onChange={(f) => setFiltros(f)} />
          </aside>

          {/* Lista */}
          <section className="w-full lg:w-3/4 flex flex-col gap-2">
            <h2 className="font-subheading text-3xl text-center text-text-primary mb-6">
              Todas las órdenes
            </h2>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
                <ClipboardList size={48} className="animate-bounce text-primary" />
                <p className="font-body text-lg">Cargando órdenes...</p>
              </div>
            )}

            {!loading && ordenadas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                  <ClipboardList size={40} className="text-text-muted" />
                </div>
                <p className="font-subheading text-xl text-text-primary">No hay órdenes</p>
                <p className="font-body text-text-muted text-center max-w-sm">
                  No se encontraron órdenes con los filtros seleccionados.
                </p>
              </div>
            )}

            {!loading && ordenadas.map((orden) => (
              <OrdenCard
                key={orden.orderId}
                orden={orden}
                onAbrir={() => router.push(`/agente-logistico/ordenes/${orden.orderId}`)}
              />
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
