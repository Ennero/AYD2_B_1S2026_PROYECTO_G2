"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
  ArrowRight,
} from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REGISTRADA:          { label: "Registrada",          color: "#9A9489", bg: "rgba(12,12,10,0.06)",   border: "rgba(12,12,10,0.1)" },
  ASIGNADA:            { label: "Asignada",             color: "#6B6260", bg: "rgba(12,12,10,0.06)",   border: "rgba(12,12,10,0.1)" },
  LISTA_PARA_DESPACHO: { label: "Lista para Despacho", color: "#0C0C0A", bg: "rgba(12,12,10,0.06)",   border: "rgba(12,12,10,0.15)" },
  EN_TRANSITO:         { label: "En Tránsito",          color: "#C9924B", bg: "rgba(201,146,75,0.1)",  border: "rgba(201,146,75,0.25)" },
  ENTREGADA:           { label: "Entregada",            color: "#3A8E2A", bg: "rgba(58,142,42,0.08)",  border: "rgba(58,142,42,0.2)" },
  BLOQUEADA:           { label: "Bloqueada",            color: "#E53E3E", bg: "rgba(229,62,62,0.08)",  border: "rgba(229,62,62,0.2)" },
  CANCELADA:           { label: "Cancelada",            color: "rgba(12,12,10,0.3)", bg: "rgba(12,12,10,0.04)", border: "rgba(12,12,10,0.08)" },
}

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

function DataItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#C9924B", display: "flex" }}>{icon}</span>
        {label}
      </p>
      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0C0C0A" }}>{value}</p>
    </div>
  )
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
    void fetchDetalle()
  }, [orderId])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F2EC" }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.24em", color: "#9A9489", textTransform: "uppercase" }}>
          Cargando viaje…
        </p>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !viaje) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F5F2EC" }}>
        <AlertCircle size={32} style={{ color: "#E53E3E" }} />
        <p style={{ fontSize: "0.82rem", color: "#6B6260" }}>{error ?? "Viaje no encontrado."}</p>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "0.5rem 1.5rem",
            background: "#0C0C0A", color: "#F5F2EC", borderRadius: "4px", cursor: "pointer",
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  const statusCfg = STATUS_CFG[viaje.status] ?? STATUS_CFG["REGISTRADA"]
  const accion = getAccionPrincipal(viaje.status)

  const scheduledDisplay = viaje.scheduledPickupAt
    ? new Date(viaje.scheduledPickupAt).toLocaleString("es-GT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—"

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>

      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-10">

        {/* ── Back link ── */}
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "0.68rem", letterSpacing: "0.1em", color: "#9A9489",
            textTransform: "uppercase", fontWeight: 600, marginBottom: "2rem",
            cursor: "pointer", background: "none", border: "none",
          }}
          onMouseOver={e => (e.currentTarget.style.color = "#0C0C0A")}
          onMouseOut={e => (e.currentTarget.style.color = "#9A9489")}
        >
          <ArrowLeft size={14} /> Mis Viajes
        </motion.button>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Detalle del Viaje
          </p>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ overflow: "hidden" }}>
              <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
                transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
                style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
                {viaje.orderNumber}
              </motion.h1>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.35rem 0.85rem", borderRadius: "4px",
                background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: statusCfg.color,
                flexShrink: 0,
              }}>
              {statusCfg.label}
            </motion.div>
          </div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── Sección 1: Información del viaje ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", overflow: "hidden", marginBottom: "1rem",
          }}>
          <div style={{ height: "3px", background: "#C9924B" }} />
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Navigation size={13} style={{ color: "#C9924B" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
              Información del Viaje
            </p>
          </div>
          <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1.25rem" }}>
            <DataItem icon={<MapPin size={10} />} label="Origen" value={viaje.origin} />
            <DataItem icon={<MapPin size={10} />} label="Destino" value={viaje.destination} />
            <DataItem icon={<Clock size={10} />} label="Tiempo estimado" value={`${viaje.estimatedHours} h`} />
            <DataItem icon={<CalendarDays size={10} />} label="Salida programada" value={scheduledDisplay} />
          </div>
        </motion.div>

        {/* ── Sección 2: Información de la carga ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.6, ease: EASE }}
          style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", overflow: "hidden", marginBottom: "1rem",
          }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={13} style={{ color: "#C9924B" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
              Información de la Carga
            </p>
          </div>
          <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1.25rem" }}>
            <DataItem icon={<Package size={10} />} label="Tipo de Carga" value={viaje.cargoType} />
            <DataItem icon={<Weight size={10} />} label="Peso declarado" value={`${viaje.declaredWeightTon} T`} />
            <DataItem icon={<User size={10} />} label="Cliente" value={viaje.clientName} />
          </div>
        </motion.div>

        {/* ── Sección 3: Piloto y vehículo ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.6, ease: EASE }}
          style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", overflow: "hidden", marginBottom: "2rem",
          }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={13} style={{ color: "#C9924B" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
              Piloto y Vehículo
            </p>
          </div>
          <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1.25rem" }}>
            <DataItem icon={<User size={10} />} label="Piloto asignado" value={viaje.pilotName} />
            {viaje.dispatchedAt && (
              <DataItem
                icon={<Clock size={10} />}
                label="Despachado a las"
                value={new Date(viaje.dispatchedAt).toLocaleString("es-GT", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {viaje.deliveredAt && (
              <DataItem
                icon={<Clock size={10} />}
                label="Entregado a las"
                value={new Date(viaje.deliveredAt).toLocaleString("es-GT", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => router.push(`/piloto/monitoreo/${orderId}`)}
            disabled={!accion.habilitado}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "0.7rem 1.5rem", borderRadius: "4px",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: accion.habilitado ? "pointer" : "not-allowed",
              background: accion.habilitado ? "#C9924B" : "rgba(12,12,10,0.08)",
              color: accion.habilitado ? "#ffffff" : "#9A9489",
              border: "none", transition: "background 0.15s",
            }}
            onMouseOver={e => { if (accion.habilitado) (e.currentTarget as HTMLButtonElement).style.background = "#b5833f" }}
            onMouseOut={e => { if (accion.habilitado) (e.currentTarget as HTMLButtonElement).style.background = "#C9924B" }}
          >
            <Navigation size={14} />
            {accion.label}
            {accion.habilitado && <ArrowRight size={13} />}
          </button>
        </motion.div>

        <div style={{ height: "4rem" }} />
      </div>
    </div>
  )
}
