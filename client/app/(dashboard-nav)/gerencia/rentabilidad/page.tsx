"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { Calendar, RefreshCw, Clock, TrendingUp, CheckCircle2, ChevronDown, MapPin, PieChart } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ──────────────────────────────────────────────── */
type RevenueClient   = { clientName: string; ingresos: number; rentabilidad: number }
type Compliance      = { onTimePct: number; onTime: number; total: number; avgDelayHrs: number }
type DeliveryTime    = { orderNumber: string; prometidoHrs: number; realHrs: number }
type ProfitabilityData = { revenueByClient: RevenueClient[]; compliance: Compliance; deliveryTimes: DeliveryTime[] }

type CostosDesglose  = { combustible: number; viaticos: number; mantenimiento: number }
type BranchProfit    = { branchName: string; ingresos: number; gastos: number; margen: number }
type TopRoute        = { ruta: string; total: number }

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}
function formatUsdShort(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

/* ─── SVG Bar Chart — Ingresos por cliente ───────────────── */
function BarChart({ data }: { data: RevenueClient[] }) {
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el período</p>
  const W = 540; const H = 200; const PAD = { top: 20, bottom: 44, left: 10, right: 10 }
  const chartW = W - PAD.left - PAD.right; const chartH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.map((d) => d.ingresos))
  const barGroupW = chartW / data.length; const barW = Math.min(barGroupW * 0.4, 32)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} aria-label="Ingresos por cliente">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9924B" stopOpacity="1" />
          <stop offset="100%" stopColor="#C9924B" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return <line key={pct} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(12,12,10,0.06)" strokeWidth={1} />
      })}
      {data.map((d, i) => {
        const x = PAD.left + i * barGroupW + barGroupW / 2
        const barH = (d.ingresos / maxVal) * chartH
        const barY = PAD.top + chartH - barH
        const shortName = d.clientName.split(" ")[0]
        return (
          <g key={d.clientName}>
            <rect x={x - barW / 2} y={barY} width={barW} height={barH} fill="url(#barGrad)" rx={2} />
            <text x={x} y={barY - 5} textAnchor="middle" fontSize={7.5} fill="#C9924B" fontWeight="700">{formatUsd(d.ingresos)}</text>
            <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8.5} fill="#9A9489">
              {shortName.length > 9 ? shortName.slice(0, 9) + "…" : shortName}
            </text>
          </g>
        )
      })}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="rgba(12,12,10,0.1)" strokeWidth={1} />
    </svg>
  )
}

/* ─── SVG Line Chart — Real vs Promesa ──────────────────── */
function LineChart({ data }: { data: DeliveryTime[] }) {
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos de entregas</p>
  const reversed = [...data].reverse()
  const W = 540; const H = 200; const PAD = { top: 20, bottom: 38, left: 38, right: 12 }
  const chartW = W - PAD.left - PAD.right; const chartH = H - PAD.top - PAD.bottom
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
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(12,12,10,0.06)" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#9A9489">{(maxVal * pct).toFixed(0)}h</text>
          </g>
        )
      })}
      <path d={pathR + ` L${toX(reversed.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`} fill="url(#lineAreaGrad)" />
      <path d={pathP} fill="none" stroke="#9A9489" strokeWidth={1.5} strokeDasharray="5,3" />
      <path d={pathR} fill="none" stroke="#C9924B" strokeWidth={2.5} />
      {reversed.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.prometidoHrs)} r={3} fill="#9A9489" />
          <circle cx={toX(i)} cy={toY(d.realHrs)} r={4} fill="#C9924B" />
          <text x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={7.5} fill="#9A9489">
            {d.orderNumber.replace("ORD-", "")}
          </text>
        </g>
      ))}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="rgba(12,12,10,0.1)" strokeWidth={1} />
    </svg>
  )
}

/* ─── Donut helpers ──────────────────────────────────────── */
function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function donutArc(cx: number, cy: number, R: number, r: number, startDeg: number, endDeg: number) {
  const sweep = endDeg - startDeg
  if (sweep >= 359.9) {
    return `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.01},${cy - R} Z M${cx},${cy - r} A${r},${r} 0 1 0 ${cx - 0.01},${cy - r} Z`
  }
  const s = polarToCart(cx, cy, R, startDeg); const e = polarToCart(cx, cy, R, endDeg)
  const si = polarToCart(cx, cy, r, startDeg); const ei = polarToCart(cx, cy, r, endDeg)
  const lg = sweep > 180 ? 1 : 0
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${R},${R} 0 ${lg} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} L${ei.x.toFixed(2)},${ei.y.toFixed(2)} A${r},${r} 0 ${lg} 0 ${si.x.toFixed(2)},${si.y.toFixed(2)} Z`
}

/* ─── Cost breakdown donut ───────────────────────────────── */
const COST_ITEMS = [
  { key: "combustible" as const, label: "Combustible", color: "#C9924B" },
  { key: "viaticos"    as const, label: "Viáticos",    color: "#1E1E1B" },
  { key: "mantenimiento" as const, label: "Mantenimiento", color: "#9A9489" },
]

function CostDonut({ data, loading }: { data: CostosDesglose | null; loading: boolean }) {
  if (loading) return <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
  if (!data) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el período</p>

  const total = data.combustible + data.viaticos + data.mantenimiento
  if (total === 0) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin costos registrados</p>

  const cx = 90; const cy = 90; const R = 72; const r = 44
  let angle = 0

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
      <svg viewBox="0 0 180 180" style={{ width: "180px", flexShrink: 0 }} aria-label="Desglose de costos">
        {COST_ITEMS.map((item) => {
          const val = data[item.key]
          const sweep = (val / total) * 360
          const path = donutArc(cx, cy, R, r, angle, angle + sweep - 0.5)
          angle += sweep
          return <path key={item.key} d={path} fill={item.color} opacity={0.88} />
        })}
        <text x={cx} y={cy - 6}  textAnchor="middle" fontSize={9} fill="#9A9489">TOTAL</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fontWeight="900" fill="#0C0C0A">{formatUsdShort(total)}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {COST_ITEMS.map((item) => {
          const val = data[item.key]
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          return (
            <div key={item.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.7rem", color: "#0C0C0A" }}>{item.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: item.color }}>{formatUsdShort(val)}</span>
                  <span style={{ fontSize: "0.6rem", color: "#9A9489" }}>{pct}%</span>
                </div>
              </div>
              <div style={{ width: "100%", height: "4px", background: "rgba(12,12,10,0.06)", borderRadius: "2px" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                  style={{ height: "100%", background: item.color, borderRadius: "2px" }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Branch profitability chart ─────────────────────────── */
function BranchProfitChart({ data, loading }: { data: BranchProfit[]; loading: boolean }) {
  if (loading) return <div style={{ height: "160px", background: "rgba(12,12,10,0.04)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el período</p>

  const maxVal = Math.max(...data.flatMap(d => [d.ingresos, d.gastos]), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {data.map((branch, idx) => {
        const ingPct = (branch.ingresos / maxVal) * 100
        const gasPct = (branch.gastos / maxVal) * 100
        const shortName = branch.branchName.replace("SEDE ", "")
        const margenPct = branch.ingresos > 0 ? Math.round((branch.margen / branch.ingresos) * 100) : 0
        const isPositive = branch.margen >= 0
        return (
          <div key={branch.branchName}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#0C0C0A" }}>{shortName}</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#6B6260" }}>
                  ing. <strong style={{ color: "#C9924B" }}>{formatUsdShort(branch.ingresos)}</strong>
                </span>
                <span style={{ fontSize: "0.62rem", color: "#6B6260" }}>
                  gas. <strong style={{ color: "#1E1E1B" }}>{formatUsdShort(branch.gastos)}</strong>
                </span>
                <span style={{
                  fontSize: "0.58rem", fontWeight: 700,
                  color: isPositive ? "#3A8E2A" : "#E53E3E",
                  background: isPositive ? "rgba(58,142,42,0.1)" : "rgba(229,62,62,0.1)",
                  borderRadius: "3px", padding: "1px 6px",
                }}>
                  {isPositive ? "+" : ""}{margenPct}%
                </span>
              </div>
            </div>
            {/* Ingresos bar */}
            <div style={{ width: "100%", height: "5px", background: "rgba(12,12,10,0.06)", borderRadius: "3px", overflow: "hidden", marginBottom: "3px" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${ingPct}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: idx * 0.1 }}
                style={{ height: "100%", background: "#C9924B", borderRadius: "3px" }}
              />
            </div>
            {/* Gastos bar */}
            <div style={{ width: "100%", height: "5px", background: "rgba(12,12,10,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${gasPct}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: idx * 0.1 + 0.05 }}
                style={{ height: "100%", background: "#1E1E1B", opacity: 0.55, borderRadius: "3px" }}
              />
            </div>
          </div>
        )
      })}
      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#9A9489" }}>
          <span style={{ display: "inline-block", width: "12px", height: "4px", background: "#C9924B", borderRadius: "2px" }} />Ingresos
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#9A9489" }}>
          <span style={{ display: "inline-block", width: "12px", height: "4px", background: "#1E1E1B", opacity: 0.55, borderRadius: "2px" }} />Gastos
        </span>
      </div>
    </div>
  )
}

/* ─── Top routes chart ───────────────────────────────────── */
function TopRoutesChart({ data, loading }: { data: TopRoute[]; loading: boolean }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: "24px", background: "rgba(12,12,10,0.04)", borderRadius: "3px", animation: "pulse 1.5s infinite" }} />)}
    </div>
  )
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos de rutas</p>

  const maxTotal = Math.max(...data.map(d => d.total), 1)
  const ROUTE_COLORS = ["#C9924B", "#B8813C", "#A87030", "#986024", "#886018", "#786010", "#6B6260", "#9A9489"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {data.map((route, idx) => {
        const pct = (route.total / maxTotal) * 100
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]
        return (
          <div key={route.ruta}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "0.68rem", color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>
                {route.ruta}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: color, flexShrink: 0 }}>{route.total} órd.</span>
            </div>
            <div style={{ width: "100%", height: "5px", background: "rgba(12,12,10,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: idx * 0.08 }}
                style={{ height: "100%", background: color, borderRadius: "3px" }}
              />
            </div>
          </div>
        )
      })}
    </div>
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
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Período de análisis</span>
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
  const [costos, setCostos]           = useState<CostosDesglose | null>(null)
  const [branchProfit, setBranchProfit] = useState<BranchProfit[]>([])
  const [topRoutes, setTopRoutes]     = useState<TopRoute[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    const params = new URLSearchParams({
      period, year: String(year),
      ...(period === "MONTHLY" ? { month: String(month) } : {}),
    })
    try {
      const [profRes, costRes, branchRes, routesRes] = await Promise.all([
        api.get<{ data: ProfitabilityData }>(`/api/bi/profitability?${params}`),
        api.get<{ data: CostosDesglose }>(`/api/bi/costos/desglose?${params}`),
        api.get<{ data: BranchProfit[] }>(`/api/bi/branches/profitability?${params}`),
        api.get<{ data: TopRoute[] }>(`/api/bi/routes/top?${params}`),
      ])
      if (profRes.ok)   setData(profRes.data.data)
      if (costRes.ok)   setCostos(costRes.data.data)
      if (branchRes.ok) setBranchProfit(branchRes.data.data)
      if (routesRes.ok) setTopRoutes(routesRes.data.data)
    } finally { setLoading(false); setRefreshing(false) }
  }, [period, year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const compliance  = data?.compliance
  const periodLabel = period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`
  const totalFacturado = data?.revenueByClient.reduce((s, r) => s + r.ingresos, 0) ?? 0
  const onTimePct  = compliance?.onTimePct ?? 0
  const totalCostos = costos ? costos.combustible + costos.viaticos + costos.mantenimiento : 0
  const margenTotal = totalFacturado - totalCostos
  const margenPct   = totalFacturado > 0 ? Math.round((margenTotal / totalFacturado) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
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
            Ingresos, costos operativos, cumplimiento de entregas y análisis por sede y ruta.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── KPI row ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>

          {/* Facturación */}
          <div style={{ background: "#1E1E1B", borderRadius: "6px", padding: "1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.45rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Facturación</p>
              <TrendingUp size={13} style={{ color: "#C9924B" }} />
            </div>
            {loading ? <div style={{ height: "40px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#C9924B", lineHeight: 1 }}>{formatUsd(totalFacturado)}</p>
            )}
            <p style={{ fontSize: "0.63rem", color: "#6B6260" }}>{periodLabel} · USD</p>
          </div>

          {/* Entregas a tiempo */}
          <div style={{
            background: onTimePct >= 80 ? "rgba(58,142,42,0.06)" : "rgba(201,146,75,0.06)",
            border: `1px solid ${onTimePct >= 80 ? "rgba(58,142,42,0.2)" : "rgba(201,146,75,0.2)"}`,
            borderRadius: "6px", padding: "1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.45rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Entregas a Tiempo</p>
              <CheckCircle2 size={13} style={{ color: onTimePct >= 80 ? "#3A8E2A" : "#C9924B" }} />
            </div>
            {loading ? <div style={{ height: "40px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: onTimePct >= 80 ? "#3A8E2A" : "#C9924B", lineHeight: 1 }}>{onTimePct}%</p>
            )}
            <p style={{ fontSize: "0.63rem", color: "#6B6260" }}>{compliance ? `${compliance.onTime} de ${compliance.total}` : "—"}</p>
          </div>

          {/* Retraso promedio */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", padding: "1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.45rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Retraso Prom.</p>
              <Clock size={13} style={{ color: "#9A9489" }} />
            </div>
            {loading ? <div style={{ height: "40px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0C0C0A", lineHeight: 1 }}>{Math.abs(compliance?.avgDelayHrs ?? 0).toFixed(1)}h</p>
            )}
            <p style={{ fontSize: "0.63rem", color: "#6B6260" }}>{(compliance?.avgDelayHrs ?? 0) > 0 ? "sobre lo prometido" : "en plazo"}</p>
          </div>

          {/* Margen operativo */}
          <div style={{
            background: margenTotal >= 0 ? "rgba(58,142,42,0.06)" : "rgba(229,62,62,0.06)",
            border: `1px solid ${margenTotal >= 0 ? "rgba(58,142,42,0.2)" : "rgba(229,62,62,0.2)"}`,
            borderRadius: "6px", padding: "1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.45rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Margen Operativo</p>
              <PieChart size={13} style={{ color: margenTotal >= 0 ? "#3A8E2A" : "#E53E3E" }} />
            </div>
            {loading ? <div style={{ height: "40px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} /> : (
              <p style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: margenTotal >= 0 ? "#3A8E2A" : "#E53E3E", lineHeight: 1 }}>{margenPct}%</p>
            )}
            <p style={{ fontSize: "0.63rem", color: "#6B6260" }}>{formatUsd(Math.abs(margenTotal))} {margenTotal >= 0 ? "ganancia" : "pérdida"}</p>
          </div>
        </motion.div>

        {/* ── Charts row 1: Ingresos por cliente + Real vs Promesa ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Ingresos por cliente */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Ingresos por Cliente</p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>{periodLabel} · Monto facturado (USD)</p>
              {loading ? <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />
                       : <BarChart data={data?.revenueByClient ?? []} />}
            </div>
          </div>

          {/* Real vs Promesa */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Real vs Promesa</p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "0.75rem" }}>Tiempo de entrega: prometido vs real (horas)</p>
              <div style={{ display: "flex", gap: "16px", marginBottom: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "20px", borderTop: "2px dashed #9A9489" }} />Prometido
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", color: "#C9924B" }}>
                  <span style={{ display: "inline-block", width: "20px", borderTop: "2.5px solid #C9924B" }} />Real
                </span>
              </div>
              {loading ? <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />
                       : <LineChart data={data?.deliveryTimes ?? []} />}
            </div>
          </div>
        </motion.div>

        {/* ── Charts row 2: Desglose costos + Rentabilidad por sede ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Desglose de costos */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <PieChart size={11} style={{ color: "#9A9489" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Desglose de Costos</p>
              </div>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>{periodLabel} · Combustible, viáticos y mantenimiento</p>
              <CostDonut data={costos} loading={loading} />
            </div>
          </div>

          {/* Rentabilidad por sede */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Rentabilidad por Sede</p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>{periodLabel} · Ingresos vs gastos operativos</p>
              <BranchProfitChart data={branchProfit} loading={loading} />
            </div>
          </div>
        </motion.div>

        {/* ── Top rutas ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
          style={{ marginBottom: "16px" }}>
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <MapPin size={11} style={{ color: "#9A9489" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Rutas Más Frecuentes</p>
              </div>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.5rem" }}>{periodLabel} · Top 8 rutas por volumen de órdenes</p>
              <TopRoutesChart data={topRoutes} loading={loading} />
            </div>
          </div>
        </motion.div>

        {/* ── Compliance table ──────────────────────────── */}
        {!loading && data && data.deliveryTimes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: EASE }}
            style={{ background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(201,146,75,0.4)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                Detalle de Cumplimiento por Orden
              </p>
              <p style={{ fontSize: "0.65rem", color: "#6B6260", marginBottom: "1.25rem" }}>Comparativa prometido vs real en órdenes entregadas</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: "0 1rem", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
                {["Orden", "Prometido", "Real", "Desviación", "Estado"].map((h, i) => (
                  <span key={h} style={{ fontSize: "0.45rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
