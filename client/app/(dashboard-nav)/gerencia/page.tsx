"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { useAuth } from "@/hooks/useAuth"
import { useEvents } from "@/hooks/useEvents"
import { CheckCircle2, TrendingUp, AlertTriangle, RefreshCw, Calendar, ChevronDown, DollarSign, Activity } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ──────────────────────────────────────────────── */
type Kpis            = { completedServices: number; billingAmount: number; activeIncidents: number }
type BranchRow       = { branchId: number; branchName: string; totalOrders: number }
type OrderRow        = { orderNumber: string; clientName: string; route: string; status: string; requestedAt: string }
type GastosIngRow    = { mes: string; ingresos: number; gastos: number }
type StatusRow       = { status: string; total: number }

/* ─── Status config ──────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  REGISTRADA:          { label: "Registrada",        color: "#9A9489" },
  ASIGNADA:            { label: "Asignada",          color: "#C9924B" },
  LISTA_PARA_DESPACHO: { label: "Lista p/ Despacho", color: "#B8813C" },
  EN_TRANSITO:         { label: "En Tránsito",       color: "#A87030" },
  ENTREGADA:           { label: "Entregada",         color: "#3A8E2A" },
  BLOQUEADA:           { label: "Bloqueada",         color: "#E53E3E" },
  CANCELADA:           { label: "Cancelada",         color: "#6B6260" },
}

const BRANCH_AMBERS = ["#C9924B", "#B8813C", "#A87030", "#986024"]

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]
const SHORT_MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
}

/* ─── Branch bar chart (horizontal) ─────────────────────── */
function BranchBars({ branches, loading }: { branches: BranchRow[]; loading: boolean }) {
  const maxOrders = Math.max(...branches.map((b) => b.totalOrders), 1)
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: "28px", background: "rgba(12,12,10,0.05)", borderRadius: "2px", animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  )
  if (!branches.length) return <p style={{ fontSize: "0.78rem", color: "#9A9489", textAlign: "center", padding: "2rem 0" }}>Sin datos para el período</p>
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {branches.map((branch, idx) => {
        const pct = (branch.totalOrders / maxOrders) * 100
        const color = BRANCH_AMBERS[idx % BRANCH_AMBERS.length]
        const shortName = branch.branchName.replace("SEDE ", "")
        return (
          <div key={branch.branchId}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0C0C0A" }}>{shortName}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: color }}>{branch.totalOrders} órd.</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(12,12,10,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: idx * 0.1 }}
                style={{ height: "100%", background: color, borderRadius: "3px" }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Gastos vs Ingresos grouped bar chart ───────────────── */
function GastosIngresosChart({ data, loading }: { data: GastosIngRow[]; loading: boolean }) {
  if (loading) return <div style={{ height: "200px", background: "rgba(12,12,10,0.04)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el año seleccionado</p>

  const W = 780; const H = 220
  const PAD = { top: 24, bottom: 48, left: 52, right: 16 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.flatMap((d) => [d.ingresos, d.gastos]), 1)
  const groupW = chartW / data.length
  const barW = Math.min(groupW * 0.3, 18)
  const gap = 3

  const yTicks = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} aria-label="Gastos vs Ingresos por mes">
      <defs>
        <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9924B" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#C9924B" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E1E1B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1E1E1B" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Y grid + labels */}
      {yTicks.map((pct) => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(12,12,10,0.07)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fontSize={8.5} fill="#9A9489">
              {formatUsd(maxVal * pct)}
            </text>
          </g>
        )
      })}

      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="rgba(12,12,10,0.12)" strokeWidth={1} />

      {/* Bars */}
      {data.map((d, i) => {
        const cx = PAD.left + i * groupW + groupW / 2
        const ingH = (d.ingresos / maxVal) * chartH
        const gasH = (d.gastos / maxVal) * chartH
        const mesLabel = SHORT_MONTHS[parseInt(d.mes.split("-")[1], 10) - 1] ?? d.mes.slice(5)
        const margen = d.ingresos - d.gastos
        return (
          <g key={d.mes}>
            {/* Ingresos bar */}
            <rect
              x={cx - barW - gap / 2} y={PAD.top + chartH - ingH}
              width={barW} height={ingH}
              fill="url(#ingGrad)" rx={2}
            />
            {/* Gastos bar */}
            <rect
              x={cx + gap / 2} y={PAD.top + chartH - gasH}
              width={barW} height={gasH}
              fill="url(#gasGrad)" rx={2}
            />
            {/* Month label */}
            <text x={cx} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#9A9489">{mesLabel}</text>
            {/* Margen indicator dot */}
            {margen !== 0 && (
              <circle
                cx={cx} cy={PAD.top + chartH - Math.max(ingH, gasH) - 8}
                r={3}
                fill={margen > 0 ? "#3A8E2A" : "#E53E3E"}
                opacity={0.8}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Orders by Status donut chart ──────────────────────── */
function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function donutArc(cx: number, cy: number, R: number, r: number, startDeg: number, endDeg: number) {
  const sweep = endDeg - startDeg
  if (sweep >= 360) {
    // Full circle — draw two arcs
    const mid = startDeg + 180
    const s1 = polarToCart(cx, cy, R, startDeg)
    const m1 = polarToCart(cx, cy, R, mid)
    const si1 = polarToCart(cx, cy, r, startDeg)
    const mi1 = polarToCart(cx, cy, r, mid)
    return `M${s1.x},${s1.y} A${R},${R} 0 1 1 ${m1.x},${m1.y} A${R},${R} 0 1 1 ${s1.x},${s1.y} ` +
           `M${si1.x},${si1.y} A${r},${r} 0 1 0 ${mi1.x},${mi1.y} A${r},${r} 0 1 0 ${si1.x},${si1.y} Z`
  }
  const s  = polarToCart(cx, cy, R, startDeg)
  const e  = polarToCart(cx, cy, R, endDeg)
  const si = polarToCart(cx, cy, r, startDeg)
  const ei = polarToCart(cx, cy, r, endDeg)
  const lg = sweep > 180 ? 1 : 0
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${R},${R} 0 ${lg} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} L${ei.x.toFixed(2)},${ei.y.toFixed(2)} A${r},${r} 0 ${lg} 0 ${si.x.toFixed(2)},${si.y.toFixed(2)} Z`
}

function StatusDonut({ data, loading }: { data: StatusRow[]; loading: boolean }) {
  if (loading) return <div style={{ height: "180px", background: "rgba(12,12,10,0.04)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
  if (!data.length) return <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9A9489", padding: "2.5rem 0" }}>Sin datos para el período</p>

  const total = data.reduce((s, d) => s + d.total, 0)
  const cx = 90; const cy = 90; const R = 72; const r = 44

  const slices = data.reduce<{ status: string; sweep: number; startAngle: number }[]>((acc, d) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1].startAngle + acc[acc.length - 1].sweep : 0
    return [...acc, { status: d.status, sweep: (d.total / total) * 360, startAngle }]
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <svg viewBox="0 0 180 180" style={{ width: "180px", flexShrink: 0 }} aria-label="Órdenes por estado">
        {slices.map(({ status, sweep, startAngle }) => {
          const cfg = STATUS_CFG[status] ?? { label: status, color: "#9A9489" }
          const path = donutArc(cx, cy, R, r, startAngle, startAngle + sweep - 1)
          return <path key={status} d={path} fill={cfg.color} opacity={0.9} />
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight="900" fill="#0C0C0A">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={8.5} fill="#9A9489">TOTAL</text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {data.map((d) => {
          const cfg = STATUS_CFG[d.status] ?? { label: d.status, color: "#9A9489" }
          const pct = Math.round((d.total / total) * 100)
          return (
            <div key={d.status} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.68rem", color: "#0C0C0A", flex: 1 }}>{cfg.label}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: cfg.color }}>{d.total}</span>
              <span style={{ fontSize: "0.6rem", color: "#9A9489", width: "28px", textAlign: "right" }}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Period controls ────────────────────────────────────── */
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
    color: "#F5F2EC", fontSize: "0.78rem", outline: "none", cursor: "pointer",
    appearance: "none",
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
          <button
            onClick={onRefresh} disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px", cursor: refreshing ? "not-allowed" : "pointer",
              color: "#9A9489", opacity: refreshing ? 0.5 : 1,
            }}
          >
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
export default function GerenciaDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(" ")[0] ?? "Gerencia"

  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")

  const [kpis, setKpis]                   = useState<Kpis | null>(null)
  const [branches, setBranches]           = useState<BranchRow[]>([])
  const [recentOrders, setRecentOrders]   = useState<OrderRow[]>([])
  const [gastosIngresos, setGastosIngresos] = useState<GastosIngRow[]>([])
  const [statusData, setStatusData]       = useState<StatusRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    const params = new URLSearchParams({
      period, year: String(year),
      ...(period === "MONTHLY" ? { month: String(month) } : {}),
    })
    try {
      const [kpisRes, branchesRes, ordersRes, gastosRes, statusRes] = await Promise.all([
        api.get<{ data: Kpis }>(`/api/bi/kpis?${params}`),
        api.get<{ data: BranchRow[] }>(`/api/bi/branches/distribution?${params}`),
        api.get<{ data: OrderRow[] }>("/api/bi/orders/recent?limit=10"),
        api.get<{ data: GastosIngRow[] }>(`/api/bi/gastos-ingresos?year=${year}`),
        api.get<{ data: StatusRow[] }>(`/api/bi/orders/by-status?${params}`),
      ])
      if (kpisRes.ok)      setKpis(kpisRes.data.data)
      if (branchesRes.ok)  setBranches(branchesRes.data.data)
      if (ordersRes.ok)    setRecentOrders(ordersRes.data.data)
      if (gastosRes.ok)    setGastosIngresos(gastosRes.data.data)
      if (statusRes.ok)    setStatusData(statusRes.data.data)
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [period, year, month])

  // Real-time updates via WebSockets
  useEvents("gerencia", () => fetchAll(true))

  useEffect(() => { fetchAll() }, [fetchAll])

  const periodLabel = period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`

  // Summary stats for gastos vs ingresos
  const totalIngresos = gastosIngresos.reduce((s, d) => s + d.ingresos, 0)
  const totalGastos   = gastosIngresos.reduce((s, d) => s + d.gastos, 0)
  const margenTotal   = totalIngresos - totalGastos
  const margenPct     = totalIngresos > 0 ? Math.round((margenTotal / totalIngresos) * 100) : 0

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
      }}>GD</div>

      <PeriodBar
        period={period} month={month} year={year} refreshing={refreshing}
        onPeriod={setPeriod} onMonth={setMonth} onYear={setYear}
        onRefresh={() => fetchAll(true)}
      />

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
              Hola, {firstName}.
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "48ch" }}>
            Resumen ejecutivo de operaciones, KPIs logísticos y actividad por sede.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── KPI row ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>

          {/* Facturación */}
          <div style={{ background: "#1E1E1B", borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Facturación</p>
              <TrendingUp size={14} style={{ color: "#C9924B" }} />
            </div>
            {loading
              ? <div style={{ height: "48px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }} />
              : <p style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#C9924B", lineHeight: 1 }}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(kpis?.billingAmount ?? 0)}</p>
            }
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>{periodLabel} · USD</p>
          </div>

          {/* Servicios completados */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Servicios Completados</p>
              <CheckCircle2 size={14} style={{ color: "#3A8E2A" }} />
            </div>
            {loading
              ? <div style={{ height: "48px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} />
              : <p style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0C0C0A", lineHeight: 1 }}>{(kpis?.completedServices ?? 0).toLocaleString("es-GT")}</p>
            }
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>Entregas exitosas</p>
          </div>

          {/* Incidentes */}
          <div style={{
            background: (kpis?.activeIncidents ?? 0) > 0 ? "rgba(229,62,62,0.06)" : "#ffffff",
            border: `1px solid ${(kpis?.activeIncidents ?? 0) > 0 ? "rgba(229,62,62,0.2)" : "rgba(12,12,10,0.07)"}`,
            borderRadius: "6px", padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Incidentes Activos</p>
              <AlertTriangle size={14} style={{ color: (kpis?.activeIncidents ?? 0) > 0 ? "#E53E3E" : "#9A9489" }} />
            </div>
            {loading
              ? <div style={{ height: "48px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} />
              : <p style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: (kpis?.activeIncidents ?? 0) > 0 ? "#E53E3E" : "#0C0C0A", lineHeight: 1 }}>{kpis?.activeIncidents ?? 0}</p>
            }
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>{(kpis?.activeIncidents ?? 0) > 0 ? "Requiere atención" : "Sin incidentes"}</p>
          </div>
        </motion.div>

        {/* ── Middle row ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "16px" }}>

          {/* Operaciones por sede */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                Operaciones por Sede
              </p>
              <BranchBars branches={branches} loading={loading} />
            </div>
          </div>

          {/* Últimos despachos */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.25rem 1.75rem 0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Últimos Despachos</p>
                <span style={{ fontSize: "0.6rem", color: "#9A9489" }}>10 más recientes</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 0.8fr", gap: "0 0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", marginBottom: "4px" }}>
                {["Orden", "Cliente", "Ruta", "Fecha", "Estado"].map((h) => (
                  <span key={h} style={{ fontSize: "0.45rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>{h}</span>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ padding: "1rem 1.75rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ height: "22px", background: "rgba(12,12,10,0.04)", borderRadius: "2px" }} />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "#9A9489", textAlign: "center", padding: "2rem 0" }}>No hay órdenes recientes.</p>
            ) : (
              <div style={{ padding: "0 1.75rem 1rem", maxHeight: "280px", overflowY: "auto" }}>
                {recentOrders.map((order, i) => {
                  const cfg = STATUS_CFG[order.status] ?? { label: order.status, color: "#9A9489" }
                  return (
                    <div key={order.orderNumber} style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 0.8fr",
                      gap: "0 0.75rem", alignItems: "center",
                      padding: "0.55rem 0",
                      borderBottom: i < recentOrders.length - 1 ? "1px solid rgba(12,12,10,0.05)" : "none",
                    }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#C9924B", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.orderNumber}</span>
                      <span style={{ fontSize: "0.7rem", color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.clientName}</span>
                      <span style={{ fontSize: "0.65rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.route}</span>
                      <span style={{ fontSize: "0.62rem", color: "#9A9489", whiteSpace: "nowrap" }}>{formatDate(order.requestedAt)}</span>
                      <div>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em",
                          color: cfg.color, background: `${cfg.color}14`,
                          borderRadius: "3px", padding: "1px 6px",
                        }}>
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Gastos vs Ingresos ──────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          style={{ marginBottom: "16px" }}>
          <div style={{ background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "linear-gradient(90deg, #C9924B, #3A8E2A)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
                    Comparativa Gastos vs Ingresos
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#6B6260" }}>Evolución mensual · Año {year} · USD</p>
                </div>
                {/* Summary pills */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(201,146,75,0.12)", border: "1px solid rgba(201,146,75,0.2)", borderRadius: "4px", padding: "0.35rem 0.85rem" }}>
                    <p style={{ fontSize: "0.45rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", marginBottom: "2px" }}>Ingresos Año</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#C9924B" }}>{formatUsd(totalIngresos)}</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "0.35rem 0.85rem" }}>
                    <p style={{ fontSize: "0.45rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", marginBottom: "2px" }}>Gastos Año</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#F5F2EC" }}>{formatUsd(totalGastos)}</p>
                  </div>
                  <div style={{
                    background: margenTotal >= 0 ? "rgba(58,142,42,0.12)" : "rgba(229,62,62,0.12)",
                    border: `1px solid ${margenTotal >= 0 ? "rgba(58,142,42,0.2)" : "rgba(229,62,62,0.2)"}`,
                    borderRadius: "4px", padding: "0.35rem 0.85rem",
                  }}>
                    <p style={{ fontSize: "0.45rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", marginBottom: "2px" }}>Margen</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 800, color: margenTotal >= 0 ? "#3A8E2A" : "#E53E3E" }}>{margenPct}%</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "10px", background: "#C9924B", borderRadius: "2px", opacity: 0.85 }} />
                  Ingresos
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "10px", background: "#1E1E1B", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.2)" }} />
                  Gastos
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#3A8E2A" }} />
                  Margen positivo
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", color: "#9A9489" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#E53E3E" }} />
                  Margen negativo
                </span>
              </div>

              <GastosIngresosChart data={gastosIngresos} loading={loading} />
            </div>
          </div>
        </motion.div>

        {/* ── Status donut + DollarSign summary ──────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Distribución por estado */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1.25rem" }}>
                <Activity size={12} style={{ color: "#9A9489" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  Distribución por Estado
                </p>
              </div>
              <StatusDonut data={statusData} loading={loading} />
            </div>
          </div>

          {/* Resumen financiero del período */}
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1.25rem" }}>
                <DollarSign size={12} style={{ color: "#9A9489" }} />
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  Resumen Financiero · {periodLabel}
                </p>
              </div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: "38px", background: "rgba(12,12,10,0.04)", borderRadius: "4px" }} />)}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Ingresos totales", value: formatUsd(kpis?.billingAmount ?? 0), color: "#C9924B", bg: "rgba(201,146,75,0.06)", border: "rgba(201,146,75,0.15)" },
                    { label: "Servicios entregados", value: String(kpis?.completedServices ?? 0), color: "#3A8E2A", bg: "rgba(58,142,42,0.06)", border: "rgba(58,142,42,0.15)" },
                    { label: "Incidentes activos", value: String(kpis?.activeIncidents ?? 0), color: (kpis?.activeIncidents ?? 0) > 0 ? "#E53E3E" : "#9A9489", bg: (kpis?.activeIncidents ?? 0) > 0 ? "rgba(229,62,62,0.06)" : "rgba(12,12,10,0.03)", border: (kpis?.activeIncidents ?? 0) > 0 ? "rgba(229,62,62,0.15)" : "rgba(12,12,10,0.06)" },
                    { label: "Órdenes en tránsito", value: String(statusData.find(s => s.status === "EN_TRANSITO")?.total ?? 0), color: "#A87030", bg: "rgba(168,112,48,0.06)", border: "rgba(168,112,48,0.15)" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: item.bg, border: `1px solid ${item.border}`,
                      borderRadius: "4px", padding: "0.55rem 0.85rem",
                    }}>
                      <span style={{ fontSize: "0.68rem", color: "#6B6260" }}>{item.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
