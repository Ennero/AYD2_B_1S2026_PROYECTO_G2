"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { RouteInfo } from "@/types/logistics"
import { MapPin, Clock, Search, X, CheckCircle } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export default function AsignacionRutasPage() {
  const [routes, setRoutes] = useState<RouteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api
      .get<{ data: RouteInfo[] }>(ENDPOINTS.LOGISTICS.ROUTES)
      .then(({ data }) => setRoutes(data.data))
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

  const active = filtered.filter((r) => r.isActive)
  const inactive = filtered.filter((r) => !r.isActive)
  const ordered = [...active, ...inactive]

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Ghost letters */}
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem, 30vw, 28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>CR</div>

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
              Catálogo de Rutas
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Rutas activas disponibles para asignación de órdenes de servicio.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          style={{ marginBottom: "1.75rem" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "4px", padding: "0 1rem", gap: "10px",
          }}>
            <Search size={14} style={{ color: "#9A9489", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar por origen o destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, padding: "0.7rem 0",
                background: "none", border: "none", outline: "none",
                fontSize: "0.82rem", color: "#F5F2EC",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6260", display: "flex" }}>
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Count */}
        {!loading && ordered.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
            {filtered.length} ruta{filtered.length !== 1 ? "s" : ""} · {active.length} activa{active.length !== 1 ? "s" : ""}
          </motion.p>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Cargando rutas...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && ordered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <MapPin size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
              {search ? "Sin resultados" : "Sin rutas"}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6B6260" }}>
              {search ? "No se encontraron rutas con esa búsqueda." : "No hay rutas disponibles."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ fontSize: "0.68rem", color: "#C9924B", background: "none", border: "none", cursor: "pointer", marginTop: "0.75rem" }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {/* Route list */}
        {!loading && ordered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ordered.map((route, i) => (
              <motion.div key={route.routeId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                style={{
                  background: route.isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(12,12,10,0.07)",
                  borderLeft: `3px solid ${route.isActive ? "#3A8E2A" : "#9A9489"}`,
                  borderRadius: "4px",
                  padding: "1.1rem 1.5rem",
                  display: "flex", alignItems: "center", gap: "1.5rem",
                  opacity: route.isActive ? 1 : 0.6,
                  transition: "box-shadow 0.2s, transform 0.15s",
                }}
                onMouseOver={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = "0 4px 16px rgba(12,12,10,0.06)"
                  el.style.transform = "translateY(-1px)"
                }}
                onMouseOut={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = "none"
                  el.style.transform = "translateY(0)"
                }}
              >
                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  {route.isActive ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      background: "rgba(58,142,42,0.08)", borderRadius: "3px", padding: "3px 8px",
                    }}>
                      <CheckCircle size={10} style={{ color: "#3A8E2A" }} />
                      <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#3A8E2A" }}>
                        Activa
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      background: "rgba(154,148,137,0.08)", borderRadius: "3px", padding: "3px 8px",
                    }}>
                      <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9A9489" }}>
                        Inactiva
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} />

                {/* Origen */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                    Origen
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={11} style={{ color: "#C9924B", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {route.origin}
                    </span>
                  </div>
                </div>

                {/* Arrow connector */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{ width: "24px", height: "1px", background: "rgba(12,12,10,0.15)" }} />
                  <span style={{ fontSize: "0.6rem", color: "#9A9489" }}>→</span>
                  <div style={{ width: "24px", height: "1px", background: "rgba(12,12,10,0.15)" }} />
                </div>

                {/* Destino */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                    Destino
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={11} style={{ color: "#3A8E2A", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {route.destination}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)", flexShrink: 0 }} />

                {/* Duración */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                    Duración
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: "flex-end" }}>
                    <Clock size={11} style={{ color: "#9A9489" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C0C0A" }}>{route.estimatedHours}h</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
