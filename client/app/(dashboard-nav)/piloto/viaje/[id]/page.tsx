"use client"

// ============================================================
// app/(dashboard-nav)/piloto/viaje/[id]/page.tsx
// Vista de detalle de una orden antes de entrar al monitoreo.
// Muestra toda la info de la orden: ruta, carga, cliente,
// vehículo y fechas. Desde aquí el piloto puede ir al
// monitoreo activo si el estado lo permite.
//
// Fetch: GET /api/pilot/orders/{ORDER_ID}
// ============================================================

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { ViajeDetalle } from "@/types/pilot"
import {
  ArrowLeft,
  MapPin,
  Package,
  Weight,
  Clock,
  User,
  Truck,
  CalendarDays,
  Navigation,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

// Colores de estado
const statusStyles: Record<string, { label: string; cls: string }> = {
  REGISTRADA:          { label: "Registrada",           cls: "bg-gray-100 text-gray-700" },
  ASIGNADA:            { label: "Asignada",              cls: "bg-blue-100 text-blue-800" },
  LISTA_PARA_DESPACHO: { label: "Lista para Despacho",  cls: "bg-warning/20 text-yellow-800" },
  EN_TRANSITO:         { label: "En Tránsito",           cls: "bg-accent/40 text-primary" },
  ENTREGADA:           { label: "Entregada",             cls: "bg-green-100 text-green-800" },
  BLOQUEADA:           { label: "Bloqueada",             cls: "bg-error/10 text-error" },
  CANCELADA:           { label: "Cancelada",             cls: "bg-gray-200 text-text-muted" },
}

// --- Acción a mostrar según estado
function getAccionPrincipal(status: string) {
  switch (status) {
    case "LISTA_PARA_DESPACHO":
      return { label: "Ir al Monitoreo · Empezar Viaje", habilitado: true }
    case "EN_TRANSITO":
      return { label: "Ir al Monitoreo · Ver Bitácora", habilitado: true }
    default:
      return { label: "Monitoreo no disponible en este estado", habilitado: false }
  }
}

export default function ViajeDetallePage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [viaje, setViaje] = useState<ViajeDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetalle() {
      try {
        const { data } = await api.get<ViajeDetalle>(ENDPOINTS.VIAJES.GET(orderId))
        setViaje(data)
      } catch {
        setError("No se pudo cargar el detalle del viaje.")
      } finally {
        setLoading(false)
      }
    }
    fetchDetalle()
  }, [orderId])

  function irAlMonitoreo() {
    router.push(`/piloto/monitoreo/${orderId}`)
  }

  // ---- Estados de la UI -----
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <Truck size={48} className="animate-bounce text-primary" />
          <p className="font-body text-lg">Cargando detalle del viaje...</p>
        </div>
      </div>
    )
  }

  if (error || !viaje) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-error">
          <AlertCircle size={48} />
          <p className="font-body text-lg">{error ?? "Viaje no encontrado."}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white font-bold py-2 px-6 rounded hover:bg-primary-hover transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const statusCfg = statusStyles[viaje.status] ?? statusStyles["REGISTRADA"]
  const accion = getAccionPrincipal(viaje.status)

  const scheduledDisplay = viaje.scheduledPickupAt
    ? new Date(viaje.scheduledPickupAt).toLocaleString("es-GT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—"


  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-4xl mx-auto px-6 py-8">
       {/* ── Breadcrumb / Volver ──────────────────────────────── */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors"
        >
          <ArrowLeft size={18} />
          Volver al Dashboard
        </button>

        {/* ── Header: número de orden + badge de estado ────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Detalle del Viaje
            </h1>
            <p className="text-text-muted font-body mt-1">
              Orden:{" "}
              <span className="font-bold text-primary">{viaje.orderNumber}</span>
            </p>
          </div>
          <span
            className={cn(
              "self-start sm:self-auto px-4 py-2 rounded-full text-sm font-bold",
              statusCfg.cls
            )}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* ── Sección 1: Información del viaje ─────────────────── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Navigation size={18} />
            Información del Viaje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoItem icon={<MapPin size={16} />} label="Origen"       value={viaje.origin} />
            <InfoItem icon={<MapPin size={16} />} label="Destino"      value={viaje.destination} />
            <InfoItem icon={<Clock size={16} />}  label="Tiempo Est."  value={`${viaje.estimatedHours} h`} />
            <InfoItem icon={<CalendarDays size={16} />} label="Salida Prog." value={scheduledDisplay} />
          </div>
        </section>

        {/* ── Sección 2: Información de la carga ───────────────── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Package size={18} />
            Información de la Carga
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem icon={<Package size={16} />} label="Tipo de Carga"   value={viaje.cargoType} />
            <InfoItem icon={<Weight size={16} />}  label="Peso Declarado"  value={`${viaje.declaredWeightTon} T`} />
            <InfoItem icon={<User size={16} />}    label="Cliente"         value={viaje.clientName} />
          </div>
        </section>

        {/* ── Sección 3: Piloto y vehículo ─────────────────────── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Truck size={18} />
            Piloto y Vehículo
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <InfoItem icon={<User size={16} />}  label="Piloto Asignado" value={viaje.pilotName} />
            {viaje.dispatchedAt && (
              <InfoItem
                icon={<Clock size={16} />}
                label="Despachado a las"
                value={new Date(viaje.dispatchedAt).toLocaleString("es-GT", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {viaje.deliveredAt && (
              <InfoItem
                icon={<Clock size={16} />}
                label="Entregado a las"
                value={new Date(viaje.deliveredAt).toLocaleString("es-GT", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
          </div>
        </section>

        {/* ── Botón de acción principal ─────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={irAlMonitoreo}
            disabled={!accion.habilitado}
            className={cn(
              "font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2",
              accion.habilitado
                ? "bg-primary hover:bg-primary-hover text-white hover:-translate-y-0.5"
                : "bg-gray-200 text-text-muted cursor-not-allowed"
            )}
          >
            <Navigation size={18} />
            {accion.label}
          </button>
        </div>
        
      </main>
    </div>
  )
}


// Subcomponente reutilizable para cada dato

function InfoItem({
  icon,
  label, 
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-text-muted font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="font-semibold text-text-primary">{value}</p>
    </div>
  )
}
