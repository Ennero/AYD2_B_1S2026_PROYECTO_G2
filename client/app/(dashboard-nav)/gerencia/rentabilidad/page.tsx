"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import { Calendar, RefreshCw, Clock, TrendingUp, CheckCircle2 } from "lucide-react"

/* ─── Types ───────────────────────────────────────────── */
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

function formatQ(n: number) {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 0 }).format(n)
}

/* ─── SVG Bar Chart ─────────────────────────────────────── */
function BarChart({ data }: { data: RevenueClient[] }) {
  if (!data.length) return <p className="text-center text-sm text-text-muted py-10">Sin datos para el período</p>

  const W = 540; const H = 180; const PAD = { top: 10, bottom: 40, left: 10, right: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.map(d => d.ingresos))
  const barGroupW = chartW / data.length
  const barW = Math.min(barGroupW * 0.35, 28)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Ingresos por cliente">
      {data.map((d, i) => {
        const x = PAD.left + i * barGroupW + barGroupW / 2
        const barH = (d.ingresos / maxVal) * chartH
        const barY = PAD.top + chartH - barH
        const shortName = d.clientName.split(' ')[0]
        return (
          <g key={d.clientName}>
            {/* Bar */}
            <rect x={x - barW / 2} y={barY} width={barW} height={barH} fill="#0A474D" rx={3} />
            {/* Value label */}
            <text x={x} y={barY - 4} textAnchor="middle" fontSize={8} fill="#0A474D" fontWeight="600">
              {formatQ(d.ingresos)}
            </text>
            {/* Client label */}
            <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8.5} fill="#6B7280">
              {shortName.length > 8 ? shortName.slice(0, 8) + '…' : shortName}
            </text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  )
}

/* ─── SVG Line Chart (Real vs Promesa) ──────────────────── */
function LineChart({ data }: { data: DeliveryTime[] }) {
  if (!data.length) return <p className="text-center text-sm text-text-muted py-10">Sin datos de entregas</p>

  const reversed = [...data].reverse()
  const W = 540; const H = 180; const PAD = { top: 20, bottom: 35, left: 36, right: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const allVals = reversed.flatMap(d => [d.prometidoHrs, d.realHrs])
  const maxVal = Math.max(...allVals) * 1.1
  const stepX = chartW / (reversed.length - 1 || 1)

  const toX = (i: number) => PAD.left + i * stepX
  const toY = (v: number) => PAD.top + chartH - (v / maxVal) * chartH

  const pathP = reversed.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.prometidoHrs).toFixed(1)}`).join(' ')
  const pathR = reversed.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.realHrs).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Real vs Promesa">
      {/* Y gridlines */}
      {[0.25, 0.5, 0.75, 1].map(pct => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">
              {(maxVal * pct).toFixed(0)}h
            </text>
          </g>
        )
      })}

      {/* Lines */}
      <path d={pathP} fill="none" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5,3" />
      <path d={pathR} fill="none" stroke="#0A474D" strokeWidth={2.5} />

      {/* Dots */}
      {reversed.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.prometidoHrs)} r={3} fill="#9CA3AF" />
          <circle cx={toX(i)} cy={toY(d.realHrs)} r={3.5} fill="#0A474D" />
        </g>
      ))}

      {/* X labels */}
      {reversed.map((d, i) => (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#6B7280">
          {d.orderNumber.replace('ORD-', '')}
        </text>
      ))}

      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════ */
export default function RentabilidadPage() {
  const currentDate = new Date()
  const [year, setYear]     = useState(currentDate.getFullYear())
  const [month, setMonth]   = useState(currentDate.getMonth() + 1)
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
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [period, year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const compliance = data?.compliance
  const periodLabel = period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-surface border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-primary">Análisis de Rentabilidad</h1>
            <p className="text-sm text-text-muted mt-0.5">Medición de cumplimiento (KPIs) — {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={16} className="text-text-muted" />
            <select value={period} onChange={e => setPeriod(e.target.value as "MONTHLY" | "ANNUAL")}
              className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="MONTHLY">Mensual</option>
              <option value="ANNUAL">Anual</option>
            </select>
            {period === "MONTHLY" && (
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            )}
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="p-1.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 transition-colors disabled:opacity-50">
              <RefreshCw size={15} className={cn("text-text-muted", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Summary cards ─────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="bg-surface rounded-2xl h-28 animate-pulse border border-black/5" />)}
          </div>
        ) : data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total facturado */}
            <div className="bg-surface rounded-2xl p-5 border border-black/5 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0"><TrendingUp size={22} /></div>
              <div>
                <p className="text-sm text-text-muted font-medium">Facturación Total</p>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {formatQ(data.revenueByClient.reduce((s, r) => s + r.ingresos, 0))}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{periodLabel}</p>
              </div>
            </div>

            {/* % entregas a tiempo */}
            <div className={cn(
              "rounded-2xl p-5 border shadow-sm flex items-start gap-4",
              (compliance?.onTimePct ?? 0) >= 80 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
            )}>
              <div className={cn("p-3 rounded-xl shrink-0",
                (compliance?.onTimePct ?? 0) >= 80 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
              )}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">Entregas a Tiempo</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{compliance?.onTimePct ?? 0}%</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {compliance?.onTime ?? 0} de {compliance?.total ?? 0} órdenes
                </p>
              </div>
            </div>

            {/* Retraso promedio */}
            <div className="bg-surface rounded-2xl p-5 border border-black/5 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0"><Clock size={22} /></div>
              <div>
                <p className="text-sm text-text-muted font-medium">Retraso Promedio</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {Math.abs(compliance?.avgDelayHrs ?? 0).toFixed(1)}h
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {(compliance?.avgDelayHrs ?? 0) > 0 ? "sobre lo prometido" : "dentro del plazo"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Charts row ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Ingresos por Cliente */}
          <div className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm">
            <h2 className="text-base font-semibold text-text-primary mb-1">Ingresos por Cliente</h2>
            <p className="text-xs text-text-muted mb-4">{periodLabel} · Monto facturado (Q)</p>
            {loading
              ? <div className="h-44 animate-pulse bg-gray-100 rounded-xl" />
              : <BarChart data={data?.revenueByClient ?? []} />
            }
          </div>

          {/* Real vs Promesa */}
          <div className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm">
            <h2 className="text-base font-semibold text-text-primary mb-1">Real vs Promesa (Horas)</h2>
            <p className="text-xs text-text-muted mb-2">Tiempo de entrega: prometido vs real</p>
            <div className="flex gap-4 text-xs mb-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 border-t-2 border-dashed border-gray-400" />
                Prometido
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 border-t-2 border-primary" style={{ borderColor: '#0A474D' }} />
                Real
              </span>
            </div>
            {loading
              ? <div className="h-44 animate-pulse bg-gray-100 rounded-xl" />
              : <LineChart data={data?.deliveryTimes ?? []} />
            }
          </div>
        </div>

        {/* ── Bottlenecks table ─────────────────────────── */}
        {!loading && data && data.deliveryTimes.length > 0 && (
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5">
              <h2 className="text-base font-semibold text-text-primary">Detalle de Cumplimiento por Orden</h2>
              <p className="text-xs text-text-muted mt-0.5">Comparativa prometido vs real en órdenes entregadas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-black/[0.02]">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Orden</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Prometido</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Real</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Desviación</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.deliveryTimes.map(row => {
                    const diff = row.realHrs - row.prometidoHrs
                    const onTime = diff <= 0
                    return (
                      <tr key={row.orderNumber} className="hover:bg-black/[0.015]">
                        <td className="px-5 py-3 font-mono text-primary font-semibold text-xs">{row.orderNumber}</td>
                        <td className="px-5 py-3 text-right text-text-muted">{row.prometidoHrs.toFixed(1)}h</td>
                        <td className="px-5 py-3 text-right font-semibold text-text-primary">{row.realHrs.toFixed(1)}h</td>
                        <td className={cn("px-5 py-3 text-right font-semibold", onTime ? "text-emerald-600" : "text-red-500")}>
                          {diff > 0 ? `+${diff.toFixed(1)}h` : `${diff.toFixed(1)}h`}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                            onTime ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                            {onTime ? "A tiempo" : "Con retraso"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
