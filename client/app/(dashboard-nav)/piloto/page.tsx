"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { ViajeResumen, FiltrosViaje } from "@/types/pilot"
import { useAuth } from "@/hooks/useAuth"
import FiltrosSidebar from "@/components/piloto/FIltrosSidebar"
import ViajeCard from "@/components/piloto/ViajeCard"

const EASE = [0.16, 1, 0.3, 1] as const

/* ── Priority sort: EN_TRANSITO first, then LISTA_PARA_DESPACHO, rest ── */
const PRIORITY: Record<string, number> = {
  EN_TRANSITO: 0,
  LISTA_PARA_DESPACHO: 1,
  ASIGNADA: 2,
  REGISTRADA: 3,
  ENTREGADA: 4,
  BLOQUEADA: 5,
  CANCELADA: 6,
}

export default function PilotoDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [viajes, setViajes] = useState<ViajeResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosViaje>({})

  useEffect(() => { fetchViaje(filtros) }, [filtros])

  async function fetchViaje(params: FiltrosViaje) {
    setLoading(true)
    try {
      const query: Record<string, string> = {}
      if (params.status)      query.status       = params.status
      if (params.startDate)   query.startDate    = params.startDate
      if (params.endDate)     query.endDate      = params.endDate
      if (params.clientName)  query.clientName   = params.clientName
      if (params.origin)      query.origin       = params.origin
      if (params.destination) query.destination = params.destination
      if (params.cargoType)   query.cargoType    = params.cargoType
      if (params.sortByWeight) query.sortByWeight = params.sortByWeight

      const qs = new URLSearchParams(query).toString()
      const url = qs ? `${ENDPOINTS.VIAJES.LIST}?${qs}` : ENDPOINTS.VIAJES.LIST

      const res = await api.get<{ message: string; data: ViajeResumen[] }>(url)
      const data = (res.data as any).data
      const arr: ViajeResumen[] = Array.isArray(data) ? data : []

      // Sort by priority unless user has a weight sort
      if (!params.sortByWeight) {
        arr.sort((a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9))
      }
      setViajes(arr)
    } catch {
      // api client handles toast
    } finally {
      setLoading(false)
    }
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "Piloto"

  /* ── Active trip (EN_TRANSITO) ── */
  const activo = viajes.find(v => v.status === "EN_TRANSITO")
  const resto  = viajes.filter(v => v.status !== "EN_TRANSITO")

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>

      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Portal del Piloto
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Hola, {firstName}.
            </motion.h1>
          </div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── Filters ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}>
          <FiltrosSidebar filtros={filtros} onChange={setFiltros} />
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: "0.68rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase" }}>
            Cargando viajes…
          </p>
        )}

        {/* ── Empty ── */}
        {!loading && viajes.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "5rem 0" }}>
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Sin viajes asignados
            </p>
            <p style={{ fontSize: "0.82rem", color: "#6B6260" }}>
              Cuando el agente logístico te asigne una orden, aparecerá aquí.
            </p>
          </motion.div>
        )}

        {!loading && viajes.length > 0 && (
          <>
            {/* ── Active trip highlight ── */}
            {activo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: EASE }} style={{ marginBottom: "2rem" }}>

                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="relative flex" style={{ width: "6px", height: "6px" }}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#C9924B" }} />
                    <span className="relative inline-flex rounded-full" style={{ width: "6px", height: "6px", background: "#C9924B" }} />
                  </span>
                  Viaje activo
                </p>
                <ViajeCard viaje={activo} onAbrir={() => router.push(`/piloto/monitoreo/${activo.orderId}`)} />
              </motion.div>
            )}

            {/* ── Rest of trips ── */}
            {resto.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}>

                {activo && (
                  <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Otros viajes · {resto.length}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {resto.map((viaje, i) => (
                    <motion.div key={viaje.orderId}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.04, duration: 0.5, ease: EASE }}>
                      <ViajeCard viaje={viaje} onAbrir={() => router.push(`/piloto/monitoreo/${viaje.orderId}`)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Count */}
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(12,12,10,0.25)", textTransform: "uppercase", marginTop: "1.5rem", textAlign: "right" }}>
              {viajes.length} {viajes.length === 1 ? "viaje" : "viajes"} en total
            </p>
          </>
        )}

        <div style={{ height: "4rem" }} />
      </div>
    </div>
  )
}
