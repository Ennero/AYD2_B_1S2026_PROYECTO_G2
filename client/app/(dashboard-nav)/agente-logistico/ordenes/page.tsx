"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { OrdenResumen, FiltrosOrden } from "@/types/logistics"
import type { OrderStatus } from "@/types/pilot"
import { ClipboardList, MapPin, Package, Weight, CalendarDays, User, Search, X, SlidersHorizontal, ArrowRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

// ── Status config ─────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  REGISTRADA:          { label: "Registrada",         color: "#9A9489", bg: "rgba(154,148,137,0.1)" },
  ASIGNADA:            { label: "Asignada",           color: "#C9924B", bg: "rgba(201,146,75,0.1)" },
  LISTA_PARA_DESPACHO: { label: "Lista p/ Despacho",  color: "#C9924B", bg: "rgba(201,146,75,0.12)" },
  EN_TRANSITO:         { label: "En Tránsito",        color: "#3A8E2A", bg: "rgba(58,142,42,0.1)" },
  ENTREGADA:           { label: "Entregada",          color: "#3A8E2A", bg: "rgba(58,142,42,0.08)" },
  BLOQUEADA:           { label: "Bloqueada",          color: "#E53E3E", bg: "rgba(229,62,62,0.1)" },
  CANCELADA:           { label: "Cancelada",          color: "#6B6260", bg: "rgba(107,98,96,0.08)" },
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

// ── Inline filter bar ─────────────────────────────────────────
function FilterBar({
  filtros,
  onChange,
}: {
  filtros: FiltrosOrden
  onChange: (f: FiltrosOrden) => void
}) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<FiltrosOrden>(filtros)

  function set(key: keyof FiltrosOrden, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }))
  }

  function apply() {
    onChange(local)
    setOpen(false)
  }

  function clear() {
    const v: FiltrosOrden = {}
    setLocal(v)
    onChange(v)
    setOpen(false)
  }

  const hasFilters = Object.values(filtros).some(Boolean)

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Trigger row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "0.55rem 1rem",
            background: open ? "#1E1E1B" : "#ffffff",
            border: `1px solid ${open ? "#1E1E1B" : "rgba(12,12,10,0.1)"}`,
            borderRadius: "4px",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: open ? "#C9924B" : "#0C0C0A",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <SlidersHorizontal size={13} />
          Filtros
        </button>

        {hasFilters && (
          <button onClick={clear} style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#E53E3E", background: "none", border: "none", cursor: "pointer",
          }}>
            <X size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* Expandable panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              marginTop: "8px",
              background: "#1E1E1B", borderRadius: "6px",
              padding: "1.25rem 1.5rem",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end",
            }}>
              {/* Estado */}
              <div>
                <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                  Estado
                </label>
                <select
                  value={local.status ?? ""}
                  onChange={(e) => set("status", e.target.value)}
                  style={{
                    width: "100%", padding: "0.55rem 0.75rem",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.8rem",
                    outline: "none", cursor: "pointer",
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#1E1E1B" }}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Fecha inicio */}
              <div>
                <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={local.startDate ?? ""}
                  onChange={(e) => set("startDate", e.target.value)}
                  style={{
                    width: "100%", padding: "0.55rem 0.75rem",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.8rem",
                    outline: "none", colorScheme: "dark",
                  }}
                />
              </div>

              {/* Fecha fin */}
              <div>
                <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={local.endDate ?? ""}
                  onChange={(e) => set("endDate", e.target.value)}
                  style={{
                    width: "100%", padding: "0.55rem 0.75rem",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.8rem",
                    outline: "none", colorScheme: "dark",
                  }}
                />
              </div>

              {/* Nombre cliente */}
              <div>
                <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                  Nombre cliente
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={local.clientName ?? ""}
                  onChange={(e) => set("clientName", e.target.value)}
                  style={{
                    width: "100%", padding: "0.55rem 0.75rem",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Aplicar */}
              <button
                onClick={apply}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "0.55rem 1.25rem",
                  background: "#C9924B", border: "none", borderRadius: "4px",
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Search size={12} /> Aplicar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Orden row card ─────────────────────────────────────────────
function OrdenRow({ orden, onAbrir }: { orden: OrdenResumen; onAbrir: () => void }) {
  const cfg = statusConfig[orden.status] ?? statusConfig["REGISTRADA"]

  const fecha = orden.requestedAt
    ? new Date(orden.requestedAt).toLocaleDateString("es-GT", {
        day: "2-digit", month: "2-digit", year: "2-digit",
      })
    : "—"

  return (
    <div
      onClick={onAbrir}
      style={{
        background: "#ffffff",
        border: "1px solid rgba(12,12,10,0.07)",
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: "4px",
        padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", gap: "1.25rem",
        cursor: "pointer", transition: "border-color 0.2s, transform 0.15s, box-shadow 0.15s",
      }}
      onMouseOver={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `rgba(12,12,10,0.15)`
        el.style.borderLeftColor = cfg.color
        el.style.transform = "translateY(-1px)"
        el.style.boxShadow = "0 4px 16px rgba(12,12,10,0.06)"
      }}
      onMouseOut={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "rgba(12,12,10,0.07)"
        el.style.borderLeftColor = cfg.color
        el.style.transform = "translateY(0)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Status dot + order number */}
      <div style={{ flexShrink: 0, minWidth: "6rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: cfg.bg, borderRadius: "3px",
          padding: "2px 7px", marginBottom: "4px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", letterSpacing: "-0.01em" }}>
          {orden.orderNumber}
        </p>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} />

      {/* Client */}
      <div style={{ flexShrink: 0, minWidth: "7rem" }}>
        <p style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
          Cliente
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <User size={10} style={{ color: "#9A9489", flexShrink: 0 }} />
          <p style={{ fontSize: "0.78rem", color: "#0C0C0A", fontWeight: 600 }}>{orden.clientName}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} />

      {/* Route */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
          Ruta
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={10} style={{ color: "#9A9489", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", color: "#0C0C0A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {orden.origin}
          </span>
          <span style={{ fontSize: "0.65rem", color: "#9A9489", flexShrink: 0 }}>→</span>
          <span style={{ fontSize: "0.78rem", color: "#0C0C0A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {orden.destination}
          </span>
        </div>
      </div>

      {/* Cargo + Weight */}
      <div style={{ flexShrink: 0, minWidth: "5rem", textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", marginBottom: "2px" }}>
          <Package size={10} style={{ color: "#9A9489" }} />
          <span style={{ fontSize: "0.7rem", color: "#6B6260" }}>{orden.cargoType || "—"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
          <Weight size={10} style={{ color: "#9A9489" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0C0C0A" }}>{orden.declaredWeightTon}T</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} />

      {/* Date */}
      <div style={{ flexShrink: 0, textAlign: "center", minWidth: "4.5rem" }}>
        <CalendarDays size={12} style={{ color: "#9A9489", margin: "0 auto 2px" }} />
        <p style={{ fontSize: "0.7rem", color: "#6B6260" }}>{fecha}</p>
      </div>

      {/* CTA */}
      <ArrowRight size={14} style={{ color: "#C9924B", flexShrink: 0, transition: "transform 0.2s" }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
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
      if (params.status)     query.status     = params.status
      if (params.startDate)  query.startDate  = params.startDate
      if (params.endDate)    query.endDate    = params.endDate
      if (params.clientId)   query.clientId   = params.clientId
      if (params.clientName) query.clientName = params.clientName

      const qs = new URLSearchParams(query).toString()
      const url = qs ? `${ENDPOINTS.LOGISTICS.ORDERS_LIST}?${qs}` : ENDPOINTS.LOGISTICS.ORDERS_LIST
      const { data } = await api.get<{ data: OrdenResumen[] }>(url)
      setOrdenes(data.data)
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
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Agente Logístico
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Órdenes de Servicio
            </motion.h1>
          </div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Filter bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
          <FilterBar filtros={filtros} onChange={setFiltros} />
        </motion.div>

        {/* Count */}
        {!loading && ordenadas.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
            {ordenadas.length} orden{ordenadas.length !== 1 ? "es" : ""}
          </motion.p>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Cargando órdenes...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && ordenadas.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <ClipboardList size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
              Sin órdenes
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6B6260" }}>
              No se encontraron órdenes con los filtros seleccionados.
            </p>
          </div>
        )}

        {/* List */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ordenadas.map((orden, i) => (
              <motion.div key={orden.orderId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}>
                <OrdenRow
                  orden={orden}
                  onAbrir={() => router.push(`/agente-logistico/ordenes/${orden.orderId}`)}
                />
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
