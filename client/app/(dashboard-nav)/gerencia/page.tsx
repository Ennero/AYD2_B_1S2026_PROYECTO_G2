"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api/client"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils/cn"
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Calendar,
} from "lucide-react"

/* ─── Types ─────────────────────────────────────────── */
type Kpis = {
  completedServices: number
  billingAmount: number
  activeIncidents: number
}

type BranchRow = {
  branchId: number
  branchName: string
  totalOrders: number
}

type OrderRow = {
  orderNumber: string
  clientName: string
  route: string
  status: string
  requestedAt: string
}

/* ─── Status helpers ─────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  REGISTRADA: "Registrada",
  ASIGNADA: "Asignada",
  LISTA_PARA_DESPACHO: "Lista para Despacho",
  EN_TRANSITO: "En Tránsito",
  ENTREGADA: "Entregada",
  BLOQUEADA: "Bloqueada",
  CANCELADA: "Cancelada",
}

const STATUS_COLOR: Record<string, string> = {
  REGISTRADA: "bg-gray-100 text-gray-700",
  ASIGNADA: "bg-blue-100 text-blue-700",
  LISTA_PARA_DESPACHO: "bg-yellow-100 text-yellow-800",
  EN_TRANSITO: "bg-indigo-100 text-indigo-700",
  ENTREGADA: "bg-emerald-100 text-emerald-700",
  BLOQUEADA: "bg-red-100 text-red-700",
  CANCELADA: "bg-red-100 text-red-700",
}

/* ─── Branch colors ──────────────────────────────────── */
const BRANCH_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-indigo-500",
  "bg-amber-500",
]

/* ─── Currency formatter ─────────────────────────────── */
function formatQ(amount: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/* ─── Months ─────────────────────────────────────────── */
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

/* ═══════════════════════════════════════════════════════
   Page Component
═══════════════════════════════════════════════════════ */
export default function GerenciaDashboardPage() {
  const { user } = useAuth()

  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")

  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [branches, setBranches] = useState<BranchRow[]>([])
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const params = new URLSearchParams({
      period,
      year: String(year),
      ...(period === "MONTHLY" ? { month: String(month) } : {}),
    })

    try {
      const [kpisRes, branchesRes, ordersRes] = await Promise.all([
        api.get<{ data: Kpis }>(`/api/bi/kpis?${params}`),
        api.get<{ data: BranchRow[] }>(`/api/bi/branches/distribution?${params}`),
        api.get<{ data: OrderRow[] }>("/api/bi/orders/recent?limit=10"),
      ])

      if (kpisRes.ok) setKpis(kpisRes.data.data)
      if (branchesRes.ok) setBranches(branchesRes.data.data)
      if (ordersRes.ok) setRecentOrders(ordersRes.data.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, year, month])

  useEffect(() => { fetchAll() }, [fetchAll])

  const maxOrders = Math.max(...branches.map((b) => b.totalOrders), 1)

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ───────────────────────────────────── */}
      <div className="bg-surface border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-primary">
              Dashboard Gerencial
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Bienvenido/a, {user?.fullName ?? "Gerencia"} · Resumen de operaciones y KPIs logísticos
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={16} className="text-text-muted" />

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "MONTHLY" | "ANNUAL")}
              className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="MONTHLY">Mensual</option>
              <option value="ANNUAL">Anual</option>
            </select>

            {period === "MONTHLY" && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-sm border border-black/10 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw size={15} className={cn("text-text-muted", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── KPI Cards ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Servicios Completados */}
            <div className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">Servicios Completados</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {kpis.completedServices.toLocaleString("es-GT")}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`}
                </p>
              </div>
            </div>

            {/* Facturación del Período */}
            <div className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">Facturación del Período</p>
                <p className="text-2xl font-bold text-text-primary mt-1 leading-tight">
                  {formatQ(kpis.billingAmount)}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {period === "MONTHLY" ? `${MONTHS[month - 1]} ${year}` : `Año ${year}`}
                </p>
              </div>
            </div>

            {/* Incidentes Activos */}
            <div className={cn(
              "rounded-2xl p-6 border shadow-sm flex items-start gap-4",
              kpis.activeIncidents > 0
                ? "bg-red-50 border-red-100"
                : "bg-surface border-black/5"
            )}>
              <div className={cn(
                "p-3 rounded-xl shrink-0",
                kpis.activeIncidents > 0
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-500"
              )}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">Incidentes Activos</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  kpis.activeIncidents > 0 ? "text-red-600" : "text-text-primary"
                )}>
                  {kpis.activeIncidents}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {kpis.activeIncidents > 0 ? "Requiere atención" : "Sin incidentes"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Middle row: Branches + Recent orders ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Operaciones por sedes */}
          <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-black/5 shadow-sm">
            <h2 className="text-base font-semibold text-text-primary mb-5">
              Operaciones por Sede
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : branches.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Sin datos para el período</p>
            ) : (
              <div className="space-y-5">
                {branches.map((branch, idx) => {
                  const pct = Math.round((branch.totalOrders / maxOrders) * 100)
                  const color = BRANCH_COLORS[idx % BRANCH_COLORS.length]
                  const shortName = branch.branchName.replace("SEDE ", "")
                  return (
                    <div key={branch.branchId}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-text-primary">{shortName}</span>
                        <span className="text-sm font-bold text-text-primary">
                          {branch.totalOrders} órd.
                        </span>
                      </div>
                      <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                  {branches.map((branch, idx) => (
                    <div key={branch.branchId} className="flex items-center gap-1.5">
                      <span className={cn("w-2.5 h-2.5 rounded-full", BRANCH_COLORS[idx % BRANCH_COLORS.length])} />
                      <span className="text-xs text-text-muted">
                        {branch.branchName.replace("SEDE ", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Últimos despachos */}
          <div className="lg:col-span-3 bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Últimos Despachos</h2>
              <span className="text-xs text-text-muted">Últimas 10 órdenes</span>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-12">No hay órdenes recientes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 bg-black/[0.02]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Orden</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide hidden md:table-cell">Ruta</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {recentOrders.map((order) => (
                      <tr key={order.orderNumber} className="hover:bg-black/[0.015] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-primary text-xs">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-text-primary max-w-[140px] truncate">
                          {order.clientName}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell max-w-[180px] truncate">
                          {order.route}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell whitespace-nowrap">
                          {formatDate(order.requestedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"
                          )}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
