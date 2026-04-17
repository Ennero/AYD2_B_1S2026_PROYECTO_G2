"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { AlertTriangle, Clock, RefreshCw, Truck, Users, TrendingUp } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ──────────────────────────────────────────────── */
type Incident  = { description: string; orderNumber: string; route: string; eventTime: string }
type LateOrder = { orderNumber: string; delayHrs: number; route: string }
type TrendRow  = { mes: string; ordenes: number }
type Capacity  = { currentUnits: number; currentPilots: number }

type AlertsData = {
  incidents: Incident[]
  lateOrders: LateOrder[]
  trend: TrendRow[]
  capacity: Capacity
}

const MONTH_SHORT: Record<string, string> = {
  "01":"Ene","02":"Feb","03":"Mar","04":"Abr","05":"May","06":"Jun",
  "07":"Jul","08":"Ago","09":"Sep","10":"Oct","11":"Nov","12":"Dic",
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es-GT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

/* ─── SVG Trend Chart — Swiss palette ───────────────────── */
function TrendChart({ trend }: { trend: TrendRow[] }) {
  if (trend.length < 2) return null

  const W = 560; const H = 220
  const PAD = { top: 24, bottom: 44, left: 38, right: 24 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...trend.map((d) => d.ordenes), 1) * 1.3
  const stepX  = chartW / ((trend.length || 1) + 2)

  const toX = (i: number) => PAD.left + i * stepX
  const toY = (v: number) => PAD.top + chartH - (v / (maxVal || 1)) * chartH

  // Linear regression for projection
  const n = trend.length || 1
  const sumX  = trend.reduce((s, _, i) => s + i, 0)
  const sumY  = trend.reduce((s, d) => s + d.ordenes, 0)
  const sumXY = trend.reduce((s, d, i) => s + i * d.ordenes, 0)
  const sumX2 = trend.reduce((s, _, i) => s + i * i, 0)
  
  const denom = (n * sumX2 - sumX * sumX)
  const slope     = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
  const intercept = (sumY - slope * sumX) / n

  const projCount = 4
  const projPoints = Array.from({ length: projCount }, (_, i) => ({
    i: n + i,
    v: Math.max(0, Math.round(intercept + slope * (n + i))),
  }))

  const realPath = trend.length > 0 
    ? trend.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.ordenes).toFixed(1)}`).join(" ")
    : `M${PAD.left},${PAD.top + chartH}`

  const lastTrendVal = trend.length > 0 ? trend[trend.length - 1].ordenes : 0
  const projStart = `M${toX(Math.max(0, n - 1)).toFixed(1)},${toY(lastTrendVal).toFixed(1)}`
  const projPath  = projStart + " " + projPoints.map((p) => `L${toX(p.i).toFixed(1)},${toY(p.v).toFixed(1)}`).join(" ")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} aria-label="Tendencia de órdenes">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9924B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#C9924B" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={PAD.left - 5} y={y + 3} textAnchor="end" fontSize={8.5} fill="#6B6260">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path
        d={realPath + ` L${toX(n - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`}
        fill="url(#trendGrad)"
      />

      {/* Real line */}
      <path d={realPath} fill="none" stroke="#C9924B" strokeWidth={2.5} />

      {/* Projection line */}
      <path d={projPath} fill="none" stroke="#C9924B" strokeWidth={2} strokeDasharray="6,4" opacity={0.5} />

      {/* Divider */}
      <line x1={toX(n - 1)} y1={PAD.top} x2={toX(n - 1)} y2={PAD.top + chartH}
        stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3,3" />
      <text x={toX(n - 1) + 5} y={PAD.top + 10} fontSize={8} fill="#6B6260">Proyección →</text>

      {/* Real dots + labels */}
      {trend.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.ordenes)} r={4} fill="#C9924B" />
          <text x={toX(i)} y={toY(d.ordenes) - 8} textAnchor="middle" fontSize={8} fill="#C9924B" fontWeight="700">
            {d.ordenes}
          </text>
          <text x={toX(i)} y={H - PAD.bottom + 15} textAnchor="middle" fontSize={8.5} fill="#9A9489">
            {MONTH_SHORT[d.mes.split("-")[1]] ?? d.mes.split("-")[1]}
          </text>
        </g>
      ))}

      {/* Projection dots */}
      {projPoints.map((p, i) => (
        <g key={i}>
          <circle cx={toX(p.i)} cy={toY(p.v)} r={3.5} fill="none" stroke="#C9924B" strokeWidth={1.5} opacity={0.5} />
          <text x={toX(p.i)} y={H - PAD.bottom + 15} textAnchor="middle" fontSize={8} fill="#6B6260">
            P{i + 1}
          </text>
        </g>
      ))}

      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH}
        stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function AlertasPage() {
  const [data, setData]             = useState<AlertsData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await api.get<{ data: AlertsData }>("/api/bi/alerts")
      if (res.ok) setData(res.data.data)
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Capacity projections
  const lastOrdenes  = data?.trend.at(-1)?.ordenes ?? 0
  const avgOrdenes   = data?.trend.length
    ? Math.round(data.trend.reduce((s, r) => s + r.ordenes, 0) / data.trend.length)
    : 0
  const currentUnits  = data?.capacity.currentUnits ?? 0
  const currentPilots = data?.capacity.currentPilots ?? 0
  const ordersPerUnit = currentUnits > 0 ? Math.ceil(avgOrdenes / currentUnits) : 4
  const projectedOrders2x = lastOrdenes * 2
  const extraUnits  = Math.max(0, Math.ceil(projectedOrders2x / ordersPerUnit) - currentUnits)
  const extraPilots = Math.max(0, Math.ceil(projectedOrders2x / ordersPerUnit) - currentPilots)
  const totalAlerts = (data?.incidents.length ?? 0) + (data?.lateOrders.length ?? 0)

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
        color: "rgba(12,12,10,0.025)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>AP</div>

      {/* Top bar */}
      <div style={{ background: "#1E1E1B", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem 2rem" }}>
        <div style={{ maxWidth: "1024px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {totalAlerts > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)",
                borderRadius: "4px", padding: "3px 10px",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E53E3E", flexShrink: 0, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", color: "#E53E3E", textTransform: "uppercase" }}>
                  {totalAlerts} alerta{totalAlerts !== 1 ? "s" : ""} activa{totalAlerts !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "32px", height: "32px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px", cursor: refreshing ? "not-allowed" : "pointer",
            color: "#9A9489", opacity: refreshing ? 0.5 : 1,
          }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Gerencia
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Alertas y Planificación
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "48ch" }}>
            Incidentes activos, retrasos en tránsito y proyecciones de escalamiento regional.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── Alerts grid ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Incidentes */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#E53E3E" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <AlertTriangle size={14} style={{ color: "#E53E3E" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  Incidentes Activos en Ruta
                </p>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1, 2].map((i) => <div key={i} style={{ height: "64px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />)}
                </div>
              ) : !data?.incidents.length ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(58,142,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                    <AlertTriangle size={18} style={{ color: "#3A8E2A" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3A8E2A", marginBottom: "2px" }}>Sin incidentes activos</p>
                  <p style={{ fontSize: "0.68rem", color: "#9A9489" }}>Todas las operaciones corren con normalidad</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.incidents.map((inc, i) => (
                    <div key={i} style={{
                      background: "rgba(229,62,62,0.04)", border: "1px solid rgba(229,62,62,0.15)",
                      borderLeft: "3px solid #E53E3E", borderRadius: "4px", padding: "0.85rem 1rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div>
                          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#E53E3E", marginBottom: "2px" }}>{inc.orderNumber}</p>
                          <p style={{ fontSize: "0.75rem", color: "#0C0C0A" }}>{inc.description}</p>
                          {inc.route !== "Sin ruta" && (
                            <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "2px" }}>{inc.route}</p>
                          )}
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "#9A9489", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {formatTime(inc.eventTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Órdenes con retraso */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Clock size={14} style={{ color: "#C9924B" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  Órdenes en Tránsito con Retraso
                </p>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1, 2, 3].map((i) => <div key={i} style={{ height: "40px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />)}
                </div>
              ) : !data?.lateOrders.length ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(58,142,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                    <Clock size={18} style={{ color: "#3A8E2A" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3A8E2A", marginBottom: "2px" }}>Sin retrasos detectados</p>
                  <p style={{ fontSize: "0.68rem", color: "#9A9489" }}>Todos los despachos activos van en tiempo</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: "0 1rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", marginBottom: "4px" }}>
                    {["Orden", "Ruta", "Retraso"].map((h, i) => (
                      <span key={h} style={{ fontSize: "0.45rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, textAlign: i === 2 ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {data.lateOrders.map((o, i) => (
                      <div key={o.orderNumber} style={{
                        display: "grid", gridTemplateColumns: "1fr 1.5fr auto",
                        gap: "0 1rem", alignItems: "center",
                        padding: "0.55rem 0",
                        borderBottom: i < data.lateOrders.length - 1 ? "1px solid rgba(12,12,10,0.05)" : "none",
                      }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#C9924B" }}>{o.orderNumber}</span>
                        <span style={{ fontSize: "0.68rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.route}</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#E53E3E", textAlign: "right", whiteSpace: "nowrap" }}>
                          +{o.delayHrs.toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Projection section ─────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          style={{ background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ height: "2px", background: "#C9924B" }} />
          <div style={{ padding: "1.5rem 1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.35rem" }}>
              <TrendingUp size={14} style={{ color: "#C9924B" }} />
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                Proyección de Expansión
              </p>
            </div>
            <p style={{ fontSize: "0.68rem", color: "#6B6260", marginBottom: "1.5rem" }}>
              Requerimiento para absorber el 200% del volumen actual
            </p>

            {/* Capacity cards */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
                {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: "80px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
                {/* Current units */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
                  <Truck size={16} style={{ color: "#9A9489", margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#F5F2EC", lineHeight: 1, marginBottom: "4px" }}>{currentUnits}</p>
                  <p style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Camiones actuales</p>
                </div>
                {/* Current pilots */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
                  <Users size={16} style={{ color: "#9A9489", margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#F5F2EC", lineHeight: 1, marginBottom: "4px" }}>{currentPilots}</p>
                  <p style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Pilotos actuales</p>
                </div>
                {/* Extra units needed */}
                <div style={{ background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
                  <Truck size={16} style={{ color: "#C9924B", margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#C9924B", lineHeight: 1, marginBottom: "4px" }}>+{extraUnits}</p>
                  <p style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>Camiones extra</p>
                </div>
                {/* Extra pilots needed */}
                <div style={{ background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
                  <Users size={16} style={{ color: "#C9924B", margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#C9924B", lineHeight: 1, marginBottom: "4px" }}>+{extraPilots}</p>
                  <p style={{ fontSize: "0.52rem", letterSpacing: "0.12em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>Pilotos extra</p>
                </div>
              </div>
            )}

            {!loading && data && (
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.5rem" }}>
                Basado en {avgOrdenes} órdenes/mes promedio · {ordersPerUnit} órd./unidad · Proyección para {lastOrdenes * 2} órdenes mensuales.
              </p>
            )}

            {/* Trend chart */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  Tendencia mensual de órdenes
                </p>
                <div style={{ display: "flex", gap: "14px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#C9924B" }}>
                    <span style={{ display: "inline-block", width: "18px", borderTop: "2.5px solid #C9924B" }} />
                    Real
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#6B6260" }}>
                    <span style={{ display: "inline-block", width: "18px", borderTop: "2px dashed #C9924B", opacity: 0.5 }} />
                    Proyectado
                  </span>
                </div>
              </div>
              {loading
                ? <div style={{ height: "200px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
                : <TrendChart trend={data?.trend ?? []} />}
            </div>
          </div>
        </motion.div>

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
