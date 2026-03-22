"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import { AlertTriangle, Clock, RefreshCw, Truck, Users, TrendingUp } from "lucide-react"

/* ─── Types ───────────────────────────────────────────── */
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
  return new Date(iso).toLocaleString("es-GT", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  })
}

/* ─── SVG Trend Line Chart ──────────────────────────────── */
function TrendChart({ trend }: { trend: TrendRow[] }) {
  if (trend.length < 2) return null

  const W = 560; const H = 200
  const PAD = { top: 20, bottom: 40, left: 36, right: 20 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  // Real data
  const maxVal = Math.max(...trend.map(d => d.ordenes)) * 1.3
  const stepX = chartW / (trend.length + 2) // leave room for projection

  const toX = (i: number) => PAD.left + i * stepX
  const toY = (v: number) => PAD.top + chartH - (v / maxVal) * chartH

  // Simple linear regression for projection (next 4 months)
  const n = trend.length
  const sumX = trend.reduce((s, _, i) => s + i, 0)
  const sumY = trend.reduce((s, d) => s + d.ordenes, 0)
  const sumXY = trend.reduce((s, d, i) => s + i * d.ordenes, 0)
  const sumX2 = trend.reduce((s, _, i) => s + i * i, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const projCount = 4
  const projPoints = Array.from({ length: projCount }, (_, i) => ({
    i: n + i,
    v: Math.max(0, Math.round(intercept + slope * (n + i))),
  }))

  const realPath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.ordenes).toFixed(1)}`).join(' ')
  const projStart = `M${toX(n - 1).toFixed(1)},${toY(trend[n - 1].ordenes).toFixed(1)}`
  const projPath  = projStart + ' ' + projPoints.map(p => `L${toX(p.i).toFixed(1)},${toY(p.v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Tendencia de órdenes">
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map(pct => {
        const y = PAD.top + chartH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8.5} fill="#9CA3AF">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        )
      })}

      {/* Area fill (real) */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A474D" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0A474D" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={realPath + ` L${toX(n-1).toFixed(1)},${(PAD.top+chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top+chartH).toFixed(1)} Z`}
        fill="url(#areaGrad)"
      />

      {/* Real line */}
      <path d={realPath} fill="none" stroke="#0A474D" strokeWidth={2.5} />

      {/* Projection line */}
      <path d={projPath} fill="none" stroke="#0A474D" strokeWidth={2} strokeDasharray="6,4" opacity={0.6} />

      {/* Real dots */}
      {trend.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.ordenes)} r={4} fill="#0A474D" />
          <text x={toX(i)} y={toY(d.ordenes) - 7} textAnchor="middle" fontSize={8} fill="#0A474D" fontWeight="600">
            {d.ordenes}
          </text>
          <text x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8.5} fill="#6B7280">
            {MONTH_SHORT[d.mes.split('-')[1]] ?? d.mes.split('-')[1]}
          </text>
        </g>
      ))}

      {/* Projection dots + labels */}
      {projPoints.map((p, i) => (
        <g key={i}>
          <circle cx={toX(p.i)} cy={toY(p.v)} r={3.5} fill="none" stroke="#0A474D" strokeWidth={1.5} opacity={0.6} />
          <text x={toX(p.i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
            P{i + 1}
          </text>
        </g>
      ))}

      {/* Divider between real and projection */}
      <line
        x1={toX(n - 1)} y1={PAD.top} x2={toX(n - 1)} y2={PAD.top + chartH}
        stroke="#E5E7EB" strokeWidth={1} strokeDasharray="3,3"
      />
      <text x={toX(n - 1) + 4} y={PAD.top + 10} fontSize={8} fill="#9CA3AF">Proyección →</text>

      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════ */
export default function AlertasPage() {
  const [data, setData]           = useState<AlertsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await api.get<{ data: AlertsData }>("/api/bi/alerts")
      if (res.ok) setData(res.data.data)
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Projection: estimate extra units/pilots needed for 2× growth
  const lastOrdenes = data?.trend.at(-1)?.ordenes ?? 0
  const avgOrdenes  = data?.trend.length
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
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-surface border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-primary">Alertas y Planificación Regional</h1>
            <p className="text-sm text-text-muted mt-0.5">Alertas y Proyecciones de Escalamiento</p>
          </div>
          <div className="flex items-center gap-2">
            {totalAlerts > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-3 py-1 rounded-full">
                {totalAlerts} alerta{totalAlerts !== 1 ? "s" : ""} activa{totalAlerts !== 1 ? "s" : ""}
              </span>
            )}
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="p-1.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 transition-colors disabled:opacity-50">
              <RefreshCw size={15} className={cn("text-text-muted", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Alerts section ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Incidentes activos */}
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h2 className="text-base font-semibold text-text-primary">Incidentes Activos en Ruta</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2].map(i => <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />)}
              </div>
            ) : !data?.incidents.length ? (
              <div className="px-6 py-10 text-center">
                <div className="inline-flex p-3 bg-emerald-50 rounded-full mb-3">
                  <AlertTriangle size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-700">Sin incidentes activos</p>
                <p className="text-xs text-text-muted mt-1">Todas las operaciones corren con normalidad</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {data.incidents.map((inc, i) => (
                  <div key={i} className="border border-red-100 bg-red-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-red-700">{inc.orderNumber}</p>
                        <p className="text-sm text-text-primary mt-0.5">{inc.description}</p>
                        {inc.route !== "Sin ruta" && (
                          <p className="text-xs text-text-muted mt-1">{inc.route}</p>
                        )}
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                        {formatTime(inc.eventTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Órdenes con retraso */}
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h2 className="text-base font-semibold text-text-primary">Órdenes en Tránsito con Retraso</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl" />)}
              </div>
            ) : !data?.lateOrders.length ? (
              <div className="px-6 py-10 text-center">
                <div className="inline-flex p-3 bg-emerald-50 rounded-full mb-3">
                  <Clock size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-700">Sin retrasos detectados</p>
                <p className="text-xs text-text-muted mt-1">Todos los despachos activos van en tiempo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 bg-black/[0.02]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Orden</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide hidden sm:table-cell">Ruta</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Retraso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {data.lateOrders.map(o => (
                      <tr key={o.orderNumber} className="hover:bg-black/[0.015]">
                        <td className="px-5 py-3 font-mono text-primary font-semibold text-xs">{o.orderNumber}</td>
                        <td className="px-5 py-3 text-text-muted text-xs hidden sm:table-cell">{o.route}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-xs font-bold text-red-600">+{o.delayHrs.toFixed(1)}h</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Projection section ────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-text-primary">Proyección de Expansión</h2>
              <p className="text-xs text-text-muted">Requerimiento para absorber el 200% del volumen actual</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Capacity cards */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1,2].map(i => <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-black/[0.02] rounded-xl p-4 text-center border border-black/5">
                    <Truck size={20} className="mx-auto text-text-muted mb-2" />
                    <p className="text-2xl font-bold text-text-primary">{currentUnits}</p>
                    <p className="text-xs text-text-muted mt-0.5">Camiones actuales</p>
                  </div>
                  <div className="bg-black/[0.02] rounded-xl p-4 text-center border border-black/5">
                    <Users size={20} className="mx-auto text-text-muted mb-2" />
                    <p className="text-2xl font-bold text-text-primary">{currentPilots}</p>
                    <p className="text-xs text-text-muted mt-0.5">Pilotos actuales</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                    <Truck size={20} className="mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold text-primary">+{extraUnits}</p>
                    <p className="text-xs text-primary/80 font-semibold mt-0.5">Camiones extra</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                    <Users size={20} className="mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold text-primary">+{extraPilots}</p>
                    <p className="text-xs text-primary/80 font-semibold mt-0.5">Pilotos extra</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  Basado en {avgOrdenes} órdenes/mes promedio y {ordersPerUnit} órd./unidad de capacidad.
                  Proyección para {lastOrdenes * 2} órdenes mensuales.
                </p>
              </>
            )}

            {/* Trend chart */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Tendencia mensual de órdenes</h3>
              <div className="flex gap-4 text-xs mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t-2" style={{ borderColor: '#0A474D' }} />
                  Real
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: '#0A474D' }} />
                  Proyectado
                </span>
              </div>
              {loading
                ? <div className="h-44 animate-pulse bg-gray-100 rounded-xl" />
                : <TrendChart trend={data?.trend ?? []} />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
