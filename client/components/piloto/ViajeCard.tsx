"use client"

import { ViajeResumen, OrderStatus } from "@/types/pilot"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface ViajeCardProps {
  viaje: ViajeResumen
  onAbrir: () => void
}

/* ── Status config ─────────────────────────────────────────── */
const STATUS: Record<OrderStatus, {
  label: string
  strip: string      // left accent color
  labelColor: string
  ctaLabel: string
  ctaDark: boolean   // true = dark bg CTA, false = ghost/amber
}> = {
  EN_TRANSITO: {
    label: "En Tránsito",
    strip: "#C9924B",
    labelColor: "#C9924B",
    ctaLabel: "Actualizar Bitácora",
    ctaDark: false,
  },
  LISTA_PARA_DESPACHO: {
    label: "Listo para Despacho",
    strip: "#0C0C0A",
    labelColor: "#0C0C0A",
    ctaLabel: "Empezar Viaje",
    ctaDark: true,
  },
  ASIGNADA: {
    label: "Asignada",
    strip: "rgba(12,12,10,0.15)",
    labelColor: "#9A9489",
    ctaLabel: "Ver Detalle",
    ctaDark: false,
  },
  REGISTRADA: {
    label: "Registrada",
    strip: "rgba(12,12,10,0.1)",
    labelColor: "#9A9489",
    ctaLabel: "Ver Detalle",
    ctaDark: false,
  },
  ENTREGADA: {
    label: "Entregada",
    strip: "#3A8E2A",
    labelColor: "#3A8E2A",
    ctaLabel: "Ver Bitácora",
    ctaDark: false,
  },
  BLOQUEADA: {
    label: "Bloqueada",
    strip: "#E53E3E",
    labelColor: "#E53E3E",
    ctaLabel: "Ver Detalle",
    ctaDark: false,
  },
  CANCELADA: {
    label: "Cancelada",
    strip: "rgba(12,12,10,0.08)",
    labelColor: "rgba(12,12,10,0.3)",
    ctaLabel: "Ver Detalle",
    ctaDark: false,
  },
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "3px" }}>
      {children}
    </p>
  )
}

export default function ViajeCard({ viaje, onAbrir }: ViajeCardProps) {
  const cfg = STATUS[viaje.status] ?? STATUS["REGISTRADA"]
  const isActive = viaje.status === "EN_TRANSITO"
  const isReady  = viaje.status === "LISTA_PARA_DESPACHO"

  const fecha = viaje.scheduledPickupAt
    ? new Date(viaje.scheduledPickupAt).toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—"

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      style={{
        background: "#ffffff",
        border: `1px solid ${isActive ? "rgba(201,146,75,0.25)" : "rgba(12,12,10,0.07)"}`,
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
        cursor: "pointer",
      }}
      onClick={onAbrir}
    >
      {/* Left accent strip */}
      <div style={{ width: "3px", background: cfg.strip, flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>

        {/* Order + client */}
        <div style={{ minWidth: "130px", flexShrink: 0 }}>
          <Label>Orden</Label>
          <p style={{ fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.05em", color: "#0C0C0A", lineHeight: 1.1 }}>
            {viaje.orderNumber}
          </p>
          <p style={{ fontSize: "0.7rem", color: "#6B6260", marginTop: "3px", fontWeight: 500 }}>
            {viaje.clientName ?? "—"}
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "36px", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} className="hidden sm:block" />

        {/* Route */}
        <div style={{ flex: "1 1 180px", display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
          <div>
            <Label>Origen</Label>
            <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0C0C0A" }}>{viaje.origin}</p>
          </div>
          <ArrowRight size={14} style={{ color: "#C9924B", flexShrink: 0, marginTop: "12px" }} />
          <div>
            <Label>Destino</Label>
            <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0C0C0A" }}>{viaje.destination}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "36px", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} className="hidden md:block" />

        {/* Date */}
        <div style={{ minWidth: "70px" }}>
          <Label>Fecha</Label>
          <p style={{ fontWeight: 600, fontSize: "0.78rem", color: "#0C0C0A" }}>{fecha}</p>
        </div>

        {/* Cargo + Weight */}
        <div>
          <Label>Carga</Label>
          <p style={{ fontWeight: 600, fontSize: "0.78rem", color: "#0C0C0A" }}>
            {viaje.cargoType ?? "—"}
          </p>
          {viaje.declaredWeightTon && (
            <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "1px" }}>
              {viaje.declaredWeightTon} TON
            </p>
          )}
        </div>

        {/* Status + CTA */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
          <span style={{
            fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: cfg.labelColor,
          }}>
            {cfg.label}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); onAbrir() }}
            style={{
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "0.45rem 1.1rem", borderRadius: "4px",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              background: cfg.ctaDark ? "#0C0C0A" : isActive ? "rgba(201,146,75,0.1)" : "transparent",
              color: cfg.ctaDark ? "#F5F2EC" : isActive ? "#C9924B" : "rgba(12,12,10,0.45)",
              border: cfg.ctaDark ? "none" : isActive ? "1px solid rgba(201,146,75,0.3)" : "1px solid rgba(12,12,10,0.12)",
            }}
            onMouseOver={(e) => {
              if (cfg.ctaDark) e.currentTarget.style.background = "#C9924B"
              else if (isActive) e.currentTarget.style.background = "rgba(201,146,75,0.18)"
              else e.currentTarget.style.color = "#0C0C0A"
            }}
            onMouseOut={(e) => {
              if (cfg.ctaDark) e.currentTarget.style.background = "#0C0C0A"
              else if (isActive) e.currentTarget.style.background = "rgba(201,146,75,0.1)"
              else e.currentTarget.style.color = "rgba(12,12,10,0.45)"
            }}
          >
            {cfg.ctaLabel}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
