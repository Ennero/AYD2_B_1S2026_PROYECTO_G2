"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Package,
  BarChart2,
  ArrowRight,
  Truck,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  RefreshCw,
  Plus,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils/cn"

/* ─── Types ─────────────────────────────────────────────────────────────── */

type OrderStatus =
  | "REGISTRADA"
  | "ASIGNADA"
  | "LISTA_PARA_DESPACHO"
  | "EN_TRANSITO"
  | "ENTREGADA"
  | "BLOQUEADA"
  | "CANCELADA"

interface RecentOrder {
  orderId: string
  orderNumber: string
  destination: string
  status: OrderStatus
  requestedAt: string
}

interface DashboardAlert {
  type: "INVOICE_PENDING"
  invoiceNumber: string
  message: string
  dueDate: string
  amount: number
}

interface DashboardSummary {
  clientName: string
  isBlocked: boolean
  creditLimit: number
  totalOwed: number
  availableCredit: number
  activeOrdersCount: number
  recentOrders: RecentOrder[]
  alerts: DashboardAlert[]
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatQ(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatQShort(n: number) {
  if (n >= 1_000_000) return `Q${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Q${(n / 1_000).toFixed(0)}k`
  return `Q${n}`
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  REGISTRADA: {
    label: "Registrada",
    icon: ClipboardList,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  ASIGNADA: {
    label: "Asignada",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  LISTA_PARA_DESPACHO: {
    label: "Lista para Despacho",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  EN_TRANSITO: {
    label: "En Tránsito",
    icon: Truck,
    color: "text-accent",
    bg: "bg-[#53B73E]/10",
  },
  ENTREGADA: {
    label: "Entregada",
    icon: CheckCircle,
    color: "text-gray-500",
    bg: "bg-gray-100",
  },
  BLOQUEADA: {
    label: "Bloqueada",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  CANCELADA: {
    label: "Cancelada",
    icon: Ban,
    color: "text-gray-400",
    bg: "bg-gray-50",
  },
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-72 bg-gray-200 rounded-xl" />
        <div className="h-10 w-40 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-[#d4bca9]/40 rounded-3xl p-8 min-h-85 space-y-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-36 bg-gray-200 rounded-t-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Tab: Resumen ───────────────────────────────────────────────────────── */

function TabResumen({
  data,
  onSwitchTab,
}: {
  data: DashboardSummary
  onSwitchTab: (tab: string) => void
}) {
  const creditUsedPct = data.creditLimit > 0
    ? Math.min((data.totalOwed / data.creditLimit) * 100, 100)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Órdenes Activas */}
      <button
        onClick={() => onSwitchTab("ordenes")}
        className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all text-center cursor-pointer"
      >
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider w-full bg-gray-100 rounded-lg py-1.5 px-3">
          Órdenes Activas
        </h3>
        <div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-inner",
            data.activeOrdersCount === 0
              ? "bg-gray-300"
              : "bg-linear-to-tr from-primary to-[#53B73E]"
          )}
        >
          {data.activeOrdersCount}
        </div>
        <p className="text-xs text-text-muted font-medium">
          {data.activeOrdersCount === 1 ? "orden en curso" : "órdenes en curso"}
        </p>
      </button>

      {/* Límite de Crédito */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider w-full bg-gray-100 rounded-lg py-1.5 px-3 text-center">
          Límite Crédito
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <BarChart2 size={40} className="text-primary" />
          {/* Barra de progreso */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-3 rounded-full transition-all",
                creditUsedPct > 80 ? "bg-red-500" : creditUsedPct > 50 ? "bg-amber-400" : "bg-[#53B73E]"
              )}
              style={{ width: `${creditUsedPct}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-xs font-semibold">
            <span className="text-text-muted">
              Consumido <span className="text-red-500 block">{formatQ(data.totalOwed)}</span>
            </span>
            <span className="text-right text-text-muted">
              Total <span className="text-accent block">{formatQ(data.creditLimit)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Saldo Pendiente */}
      <Link
        href="/cliente/estado-cuenta"
        className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all text-center cursor-pointer"
      >
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider w-full bg-gray-100 rounded-lg py-1.5 px-3">
          Saldo Pendiente
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl font-black text-text-primary">
            {formatQShort(data.totalOwed)}
          </span>
          <BarChart2 size={32} className="text-[#53B73E]" />
          <span className="text-xs text-text-muted font-bold flex items-center gap-1">
            Ver Estado de Cuenta <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </div>
  )
}

/* ─── Tab: Órdenes Recientes ─────────────────────────────────────────────── */

function TabOrdenes({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted space-y-2">
        <Package size={40} className="mx-auto text-primary/30" />
        <p className="font-semibold">Sin órdenes activas</p>
        <p className="text-sm">Crea tu primer servicio con el botón de arriba.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between bg-white/70 border border-white/60 rounded-2xl px-4 py-2.5 shadow-sm">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-white border border-primary/20 rounded-full px-3 py-1">
          GET /api/client/orders?limit=3
        </span>
        <Link
          href="/cliente/ordenes"
          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
        >
          Ver historial completo <ArrowRight size={13} />
        </Link>
      </div>

      {/* Order cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orders.map((order) => {
          const meta = STATUS_META[order.status] ?? STATUS_META.REGISTRADA
          const Icon = meta.icon
          return (
            <div
              key={order.orderId}
              className="bg-white rounded-2xl shadow-sm border border-black/5 hover:border-primary/30 transition-colors p-5 flex flex-col gap-4"
            >
              {/* Info block */}
              <div className="bg-gray-100 rounded-xl p-3 text-sm text-center space-y-0.5 font-semibold text-text-primary">
                <p className="font-bold">{order.orderNumber}</p>
                <p className="text-xs text-text-muted font-medium truncate">
                  Destino: {order.destination ?? "—"}
                </p>
                <span
                  className={cn(
                    "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    meta.bg,
                    meta.color
                  )}
                >
                  {meta.label}
                </span>
              </div>

              {/* Icon */}
              <div className={cn("flex justify-center items-center h-16 rounded-xl", meta.bg)}>
                <Icon size={44} className={meta.color} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Tab: Alertas ───────────────────────────────────────────────────────── */

function TabAlertas({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted space-y-2">
        <CheckCircle size={40} className="mx-auto text-[#53B73E]" />
        <p className="font-semibold">Sin alertas pendientes</p>
        <p className="text-sm">Todas tus facturas están al día.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.invoiceNumber}
          className="bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 text-sm uppercase tracking-wide">
                Factura Pendiente
              </p>
              <p className="text-sm text-amber-700">{alert.message}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Monto: {formatQ(alert.amount)} · Venció: {alert.dueDate}
              </p>
            </div>
          </div>
          <Link
            href="/cliente/estado-cuenta"
            className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Ver cuenta <ArrowRight size={12} />
          </Link>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

type Tab = "resumen" | "ordenes" | "alertas"

export default function ClienteDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("resumen")

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get<{ data: DashboardSummary }>(ENDPOINTS.CLIENT.DASHBOARD_SUMMARY)
      setData(res.data.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [])

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "resumen", label: "RESUMEN" },
    { id: "ordenes", label: "ÓRDENES RECIENTES" },
    {
      id: "alertas",
      label: "ALERTAS",
      badge: data?.alerts.length ?? 0,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight uppercase">
            {loading ? "Bienvenido" : data ? `Bienvenido, ${data.clientName}` : "Dashboard"}
          </h1>
          {data?.isBlocked && (
            <p className="text-sm text-red-600 font-semibold mt-1 flex items-center gap-1.5">
              <Ban size={14} /> Cuenta bloqueada — contacta a tu agente operativo
            </p>
          )}
        </div>
        <Link
          href="/cliente/nuevo-servicio"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors text-sm"
        >
          <Plus size={16} /> Nuevo Servicio
        </Link>
      </div>

      {/* ── Panel ──────────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-12 text-center space-y-4">
          <AlertTriangle size={36} className="text-amber-500 mx-auto" />
          <p className="text-text-muted">No se pudo cargar el dashboard.</p>
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      ) : data ? (
        <div className="bg-[#d4bca9]/60 rounded-3xl p-6 shadow-inner border border-[#c4b1a0] min-h-95">

          {/* Tab buttons */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "font-bold py-2 px-5 rounded-t-lg text-sm transition-all cursor-pointer flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-white text-text-primary shadow-sm"
                    : "bg-black/10 text-text-muted hover:bg-black/15"
                )}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "resumen" && (
              <TabResumen data={data} onSwitchTab={setActiveTab} />
            )}
            {activeTab === "ordenes" && <TabOrdenes orders={data.recentOrders} />}
            {activeTab === "alertas" && <TabAlertas alerts={data.alerts} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}
