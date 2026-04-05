"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { Calendar, RefreshCw, Clock, TrendingUp, CheckCircle2, ChevronDown } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ──────────────────────────────────────────────── */
type RevenueClient = { clientName: string; ingresos: number; rentabilidad: number }
type Compliance    = { onTimePct: number; onTime: number; total: number; avgDelayHrs: number }
type DeliveryTime  = { orderNumber: string; prometidoHrs: number; realHrs: number }

type ProfitabilityData = {
  revenueByClient: RevenueClient[]
  compliance: Compliance
  deliveryTimes: DeliveryTime[]
}

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/* ─── SVG Bar Chart — Swiss palette ─────────────────────── */
function BarChart({ data }: { data: RevenueClient[] }) {
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el período</p>

  const W = 540; const H = 200; const PAD = { top: 20, bottom: 44, left: 10, right: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.map((d) => d.ingresos))
  const barGroupW = chartW / data.length
  const barW = Math.min(barGroupW * 0.4, 32)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} aria-label="Ingresos por cliente">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9924B" stopOpacity="1" />
          <stop offset="100%" stopColor="#C9924B" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <line key={pct} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
            stroke="rgba(12,12,10,0.06)" strokeWidth={1} />
        )
      })}
      {data.map((d, i) => {
        const x = PAD.left + i * barGroupW + barGroupW / 2
        const barH = (d.ingresos / maxVal) * chartH
        const barY = PAD.top + chartH - barH
        const shortName = d.clientName.split(" ")[0]
        return (
          <g key={d.clientName}>
            <rect x={x - barW / 2} y={barY} width={barW} height={barH} fill="url(#barGrad)" rx={2} />
            <text x={x} y={barY - 5} textAnchor="middle" fontSize={7.5} fill="#C9924B" fontWeight="700">
              {formatUsd(d.ingresos)}
            </text>
            <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8.5} fill="#9A9489">
              {shortName.length > 9 ? shortName.slice(0, 9) + "…" : shortName}
            </text>
          </g>
        )
      })}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH}
        stroke="rgba(12,12,10,0.1)" strokeWidth={1} />
    </svg>
  )
}

/* ─── SVG Line Chart — Real vs Promesa ──────────────────── */
function LineChart({ data }: { data: DeliveryTime[] }) {
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos de entregas</p>

  const reversed = [...data].reverse()
  const W = 540; const H = 200; const PAD = { top: 20, bottom: 38, left: 38, right: 12 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const allVals = reversed.flatMap((d) => [d.prometidoHrs, d.realHrs])
  const maxVal  = Math.max(...allVals) * 1.1
  const stepX   = chartW / (reversed.length - 1 || 1)

  const toX = (i: number) => PAD.left + i * stepX
  const toY = (v: number) => PAD.top + chartH - (v / maxVal) * chartH

  const pathP = reversed.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.prometidoHrs).toFixed(1)}`).join(" ")
  const pathR = reversed.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.realHrs).toFixed(1)}`).join(" ")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} aria-label="Real vs Promesa">
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9924B" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#C9924B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(12,12,10,0.06)" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#9A9489">
              {(maxVal * pct).toFixed(0)}h
            </text>
          </g>
        )
      })}
      {/* Area */}
      <path
        d={pathR + ` L${toX(reversed.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`}
        fill="url(#lineAreaGrad)"
      />
      {/* Promised line (dashed gray) */}
      <path d={pathP} fill="none" stroke="#9A9489" strokeWidth={1.5} strokeDasharray="5,3" />
      {/* Real line (amber) */}
      <path d={pathR} fill="none" stroke="#C9924B" strokeWidth={2.5} />
      {/* Dots */}
      {reversed.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.prometidoHrs)} r={3} fill="#9A9489" />
          <circle cx={toX(i)} cy={toY(d.realHrs)} r={4} fill="#C9924B" />
          <text x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={7.5} fill="#9A9489">
            {d.orderNumber.replace("ORD-", "")}
          </text>
        </g>
      ))}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH}
        stroke="rgba(12,12,10,0.1)" strokeWidth={1} />
    </svg>
  )
}

/* ─── Period bar ─────────────────────────────────────────── */
function PeriodBar({
  period, month, year, refreshing,
  onPeriod, onMonth, onYear, onRefresh,
}: {
  period: "MONTHLY" | "ANNUAL"; month: number; year: number; refreshing: boolean
  onPeriod: (v: "MONTHLY" | "ANNUAL") => void
  onMonth: (v: number) => void
  onYear: (v: number) => void
  onRefresh: () => void
}) {
  const selStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px", padding: "0.45rem 1.75rem 0.45rem 0.75rem",
    color: "#F5F2EC", fontSize: "0.78rem", outline: "none", cursor: "pointer", appearance: "none",
  }
  return (
    <div style={{ background: "#1E1E1B", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem 2rem" }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={13} style={{ color: "#9A9489" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
            Período de análisis
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <select value={period} onChange={(e) => onPeriod(e.target.value as "MONTHLY" | "ANNUAL")} style={selStyle}>
              <option value="MONTHLY" style={{ background: "#1E1E1B" }}>Mensual</option>
              <option value="ANNUAL" style={{ background: "#1E1E1B" }}>Anual</option>
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
          </div>
          {period === "MONTHLY" && (
            <div style={{ position: "relative" }}>
              <select value={month} onChange={(e) => onMonth(Number(e.target.value))} style={selStyle}>
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1} style={{ background: "#1E1E1B" }}>{m}</option>)}
              </select>
              <ChevronDown size={11} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
            </div>
          )}
          <div style={{ position: "relative" }}>
            <select value={year} onChange={(e) => onYear(Number(e.target.value))} style={selStyle}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} style={{ background: "#1E1E1B" }}>{y}</option>)}
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
          </div>
          <button onClick={onRefresh} disabled={refreshing} style={{
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
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function RentabilidadPage() {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("ANNUAL")
  const [data, setData]     = useState<ProfitabilityData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    const params = new URLSearchParams({
      period, year: String(year),
      ...(period === "MONTHLY" ? { month: String(month) } : {}),
    })
    try {
      const res = await api.get<{ data: ProfitabilityData }>(`/api/bi/profitability?${params}`)
      if (res.ok) setData(res.data.data)
    } finally { setLoading(false); setRefreshing(false) }
  }, [period, year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const compliance = data?.compliance
  const periodLabel = period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`
  const totalFacturado = data?.revenueByClient.reduce((s, r) => s + r.ingresos, 0) ?? 0
  const onTimePct = compliance?.onTimePct ?? 0

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
      }}>AR</div>

      <PeriodBar period={period} month={month} year={year} refreshing={refreshing}
        onPeriod={setPeriod} onMonth={setMonth} onYear={setYear} onRefresh={() => fetchData(true)} />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Gerencia · {periodLabel}
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Análisis de Rentabilidad
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "48ch" }}>
            Medición de cumplimiento de entrega, ingresos por cliente y KPIs operativos.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── KPI row ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>

          {/* Facturación — dark */}
          <div style={{ background: "#1E1E1B", borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Facturación Total</p>
              <TrendingUp size={14} style={{ color: "#C9924B" }} />
            </div>
            {loading ? <div style={{ height: "44px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#C9924B", lineHeight: 1 }}>
                {formatUsd(totalFacturado)}
              </p>
            )}
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>{periodLabel} · USD</p>
          </div>

          {/* Entregas a tiempo */}
          <div style={{
            background: onTimePct >= 80 ? "rgba(58,142,42,0.06)" : "rgba(201,146,75,0.06)",
            border: `1px solid ${onTimePct >= 80 ? "rgba(58,142,42,0.2)" : "rgba(201,146,75,0.2)"}`,
            borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Entregas a Tiempo</p>
              <CheckCircle2 size={14} style={{ color: onTimePct >= 80 ? "#3A8E2A" : "#C9924B" }} />
            </div>
            {loading ? <div style={{ height: "44px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: onTimePct >= 80 ? "#3A8E2A" : "#C9924B", lineHeight: 1 }}>
                {onTimePct}%
              </p>
            )}
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>
              {compliance ? `${compliance.onTime} de ${compliance.total} órdenes` : "—"}
            </p>
          </div>

          {/* Retraso promedio */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Retraso Promedio</p>
              <Clock size={14} style={{ color: "#9A9489" }} />
            </div>
            {loading ? <div style={{ height: "44px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0C0C0A", lineHeight: 1 }}>
                {Math.abs(compliance?.avgDelayHrs ?? 0).toFixed(1)}h
              </p>
            )}
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>
              {(compliance?.avgDelayHrs ?? 0) > 0 ? "sobre lo prometido" : "dentro del plazo"}
            </p>
          </div>
        </motion.div>

        {/* ── Charts row ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Ingresos por cliente */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                Ingresos por Cliente
              </p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>{periodLabel} · Monto facturado (USD)</p>
              {loading
                ? <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />
                : <BarChart data={data?.revenueByClient ?? []} />}
            </div>
          </div>

          {/* Real vs Promesa */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                Real vs Promesa
              </p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "0.75rem" }}>Tiempo de entrega: prometido vs real (horas)</p>
              {/* Legend */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "20px", borderTop: "2px dashed #9A9489" }} />
                  Prometido
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#C9924B" }}>
                  <span style={{ display: "inline-block", width: "20px", borderTop: "2.5px solid #C9924B" }} />
                  Real
                </span>
              </div>
              {loading
                ? <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />
                : <LineChart data={data?.deliveryTimes ?? []} />}
            </div>
          </div>
        </motion.div>

        {/* ── Compliance table ─────────────────────────── */}
        {!loading && data && data.deliveryTimes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
            style={{ background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(201,146,75,0.4)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                Detalle de Cumplimiento por Orden
              </p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>Comparativa prometido vs real en órdenes entregadas</p>

              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: "0 1rem", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
                {["Orden", "Prometido", "Real", "Desviación", "Estado"].map((h, i) => (
                  <span key={h} style={{ fontSize: "0.45rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, textAlign: i > 0 ? "right" : "left" }}>
                    {h}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.deliveryTimes.map((row, i) => {
                  const diff = row.realHrs - row.prometidoHrs
                  const onTime = diff <= 0
                  return (
                    <div key={row.orderNumber} style={{
                      display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.8fr 0.8fr",
                      gap: "0 1rem", alignItems: "center",
                      padding: "0.6rem 0",
                      borderBottom: i < data.deliveryTimes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#C9924B", letterSpacing: "0.02em" }}>{row.orderNumber}</span>
                      <span style={{ fontSize: "0.72rem", color: "#9A9489", textAlign: "right" }}>{row.prometidoHrs.toFixed(1)}h</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#F5F2EC", textAlign: "right" }}>{row.realHrs.toFixed(1)}h</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: onTime ? "#3A8E2A" : "#E53E3E", textAlign: "right" }}>
                        {diff > 0 ? `+${diff.toFixed(1)}h` : `${diff.toFixed(1)}h`}
                      </span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em",
                          color: onTime ? "#3A8E2A" : "#E53E3E",
                          background: onTime ? "rgba(58,142,42,0.1)" : "rgba(229,62,62,0.1)",
                          borderRadius: "3px", padding: "2px 7px",
                        }}>
                          {onTime ? "A tiempo" : "Con retraso"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
