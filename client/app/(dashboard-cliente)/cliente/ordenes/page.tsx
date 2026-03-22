"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Package,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Navigation,
  Flag,
  ShieldAlert,
  RefreshCw,
  Plus,
  Weight,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"
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

type EventType = "SALIDA" | "PUNTO_CONTROL" | "ADUANA" | "INCIDENTE" | "LLEGADA" | "OTRO"

interface OrderSummary {
  orderId: string
  orderNumber: string
  status: OrderStatus
  cargoType: string | null
  pickupAddress: string
  deliveryAddress: string
  origin: string | null
  destination: string | null
  declaredWeightTon: number
  totalAmount: number
  requestedAt: string
  scheduledPickupAt: string | null
  promisedDeliveryAt: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  unitPlate: string | null
  vehicleType: string | null
}

interface TrackingLog {
  logId: string
  eventType: EventType
  eventTime: string
  description: string
}

interface OrderTracking extends OrderSummary {
  cargoDescription: string
  loadedWeightTon: number | null
  receiverName: string | null
  stowageConfirmed: boolean | null
  isSealed: boolean | null
  logs: TrackingLog[]
}

interface OrderPage {
  items: OrderSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/* ─── Status config ─────────────────────────────────────────────────────── */

const STATUS_CFG: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  REGISTRADA:         { label: "Registrada",          bg: "bg-gray-100",          text: "text-gray-600",   dot: "bg-gray-400" },
  ASIGNADA:           { label: "Asignada",             bg: "bg-blue-100",          text: "text-blue-700",   dot: "bg-blue-500" },
  LISTA_PARA_DESPACHO:{ label: "Lista p/ despacho",   bg: "bg-purple-100",        text: "text-purple-700", dot: "bg-purple-500" },
  EN_TRANSITO:        { label: "En tránsito",          bg: "bg-amber-100",         text: "text-amber-700",  dot: "bg-amber-500" },
  ENTREGADA:          { label: "Entregada",            bg: "bg-[#53B73E]/15",      text: "text-[#3A8E2A]",  dot: "bg-[#53B73E]" },
  BLOQUEADA:          { label: "Bloqueada",            bg: "bg-red-100",           text: "text-red-700",    dot: "bg-red-500" },
  CANCELADA:          { label: "Cancelada",            bg: "bg-gray-100",          text: "text-gray-400",   dot: "bg-gray-300" },
}

const EVENT_CFG: Record<EventType, { label: string; Icon: React.ElementType; color: string }> = {
  SALIDA:        { label: "Salida",          Icon: Navigation,   color: "text-[#095556]" },
  PUNTO_CONTROL: { label: "Punto de control",Icon: Circle,       color: "text-blue-500" },
  ADUANA:        { label: "Aduana",          Icon: ShieldAlert,  color: "text-purple-500" },
  INCIDENTE:     { label: "Incidente",       Icon: AlertCircle,  color: "text-red-500" },
  LLEGADA:       { label: "Llegada",         Icon: Flag,         color: "text-[#53B73E]" },
  OTRO:          { label: "Otro",            Icon: Clock,        color: "text-gray-400" },
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  )
}

function fmtDate(d: string | null | undefined, withTime = false) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function fmtCurrency(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={14} className="text-[#94A3B8] shrink-0 mt-0.5" />
      <span className="text-[#64748B] shrink-0">{label}:</span>
      <span className="font-medium text-[#1A202C] break-words min-w-0">{value ?? "—"}</span>
    </div>
  )
}

/* ─── Tracking drawer ───────────────────────────────────────────────────── */

function TrackingDrawer({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null
  open: boolean
  onClose: () => void
}) {
  const [data, setData] = useState<OrderTracking | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !orderId) return
    setData(null)
    setLoading(true)
    void api
      .get<{ data: OrderTracking }>(ENDPOINTS.CLIENT.ORDER_TRACKING(orderId))
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, orderId])

  if (!open) return null

  const isActive = data && !["ENTREGADA", "CANCELADA", "BLOQUEADA"].includes(data.status)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-lg z-50 flex flex-col bg-white shadow-2xl border-l border-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#095556]/10 flex items-center justify-center">
              <Navigation size={18} className="text-[#095556]" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Tracking de Orden</p>
              <p className="font-bold text-[#1A202C] text-sm">
                {loading ? "Cargando…" : data?.orderNumber ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1A202C] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-[#F1F5F9] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Status + badge */}
              <div className="flex items-center justify-between">
                <StatusBadge status={data.status} />
                {isActive && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg animate-pulse">
                    En curso
                  </span>
                )}
              </div>

              {/* Info card */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                <InfoRow icon={MapPin} label="Recolección" value={data.pickupAddress} />
                <InfoRow icon={MapPin} label="Entrega" value={data.deliveryAddress} />
                {data.cargoType && <InfoRow icon={Package} label="Mercancía" value={data.cargoType} />}
                <InfoRow icon={Weight} label="Peso declarado" value={`${data.declaredWeightTon} ton`} />
                {data.loadedWeightTon && (
                  <InfoRow icon={Weight} label="Peso cargado" value={`${data.loadedWeightTon} ton`} />
                )}
                {data.unitPlate && (
                  <InfoRow icon={Truck} label="Unidad" value={`${data.unitPlate}${data.vehicleType ? ` — ${data.vehicleType}` : ""}`} />
                )}
                {data.receiverName && (
                  <InfoRow icon={CheckCircle2} label="Recibido por" value={data.receiverName} />
                )}
                <InfoRow icon={Calendar} label="Solicitado" value={fmtDate(data.requestedAt, true)} />
                {data.scheduledPickupAt && (
                  <InfoRow icon={Calendar} label="Recolección prog." value={fmtDate(data.scheduledPickupAt, true)} />
                )}
                {data.promisedDeliveryAt && (
                  <InfoRow icon={Calendar} label="Entrega prometida" value={fmtDate(data.promisedDeliveryAt, true)} />
                )}
                {data.deliveredAt && (
                  <InfoRow icon={CheckCircle2} label="Entregado" value={fmtDate(data.deliveredAt, true)} />
                )}
                {data.totalAmount > 0 && (
                  <InfoRow icon={DollarSign} label="Total" value={fmtCurrency(data.totalAmount)} />
                )}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-3">
                  Bitácora de ruta
                </p>

                {data.logs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#94A3B8]">
                    Aún no hay eventos registrados para esta orden.
                  </div>
                ) : (
                  <div className="relative">
                    {/* vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E2E8F0]" />

                    <div className="space-y-4">
                      {data.logs.map((log, idx) => {
                        const cfg = EVENT_CFG[log.eventType]
                        const isLast = idx === data.logs.length - 1
                        return (
                          <div key={log.logId} className="flex gap-4 relative">
                            {/* dot */}
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center bg-white border-2 shrink-0 z-10",
                              log.eventType === "INCIDENTE"
                                ? "border-red-300"
                                : log.eventType === "LLEGADA"
                                ? "border-[#53B73E]"
                                : "border-[#E2E8F0]",
                            )}>
                              <cfg.Icon size={14} className={cfg.color} />
                            </div>

                            <div className={cn(
                              "flex-1 bg-[#F8FAFC] rounded-xl p-3 border",
                              log.eventType === "INCIDENTE"
                                ? "border-red-100 bg-red-50"
                                : isLast
                                ? "border-[#095556]/20 bg-[#095556]/5"
                                : "border-[#E2E8F0]",
                            )}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={cn("text-xs font-bold", cfg.color)}>
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {fmtDate(log.eventTime, true)}
                                </span>
                              </div>
                              <p className="text-xs text-[#475569]">{log.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Order row ─────────────────────────────────────────────────────────── */

function OrderRow({
  order,
  onTrack,
}: {
  order: OrderSummary
  onTrack: () => void
}) {
  const addr = order.destination ?? order.deliveryAddress
  const origin = order.origin ?? order.pickupAddress

  return (
    <div className="bg-white rounded-2xl border border-black/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow group">
      {/* Status icon */}
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        order.status === "EN_TRANSITO" ? "bg-amber-100" :
        order.status === "ENTREGADA"   ? "bg-[#53B73E]/15" :
        order.status === "BLOQUEADA"   ? "bg-red-100" :
        "bg-[#095556]/8",
      )}>
        <Package size={18} className={cn(
          order.status === "EN_TRANSITO" ? "text-amber-600" :
          order.status === "ENTREGADA"   ? "text-[#3A8E2A]" :
          order.status === "BLOQUEADA"   ? "text-red-600" :
          "text-[#095556]",
        )} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-bold text-[#1A202C] text-sm">{order.orderNumber}</p>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <MapPin size={11} className="text-[#94A3B8]" />
            <span className="truncate max-w-[140px]" title={origin}>{origin}</span>
            <span className="text-[#CBD5E1]">→</span>
            <span className="truncate max-w-[140px]" title={addr}>{addr}</span>
          </div>
          {order.cargoType && (
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Package size={11} className="text-[#94A3B8]" />
              <span>{order.cargoType}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1">
            <Calendar size={10} />
            {fmtDate(order.requestedAt)}
          </span>
          {order.declaredWeightTon > 0 && (
            <span className="text-xs text-[#94A3B8] flex items-center gap-1">
              <Weight size={10} />
              {order.declaredWeightTon} ton
            </span>
          )}
          {order.unitPlate && (
            <span className="text-xs text-[#94A3B8] flex items-center gap-1">
              <Truck size={10} />
              {order.unitPlate}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={onTrack}
        className="shrink-0 flex items-center gap-2 border-2 border-[#095556]/20 text-[#095556] hover:bg-[#095556]/5 font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
      >
        <Navigation size={13} />
        Ver tracking
      </button>
    </div>
  )
}

/* ─── Status filter pills ────────────────────────────────────────────────── */

const FILTERS: { label: string; value: string }[] = [
  { label: "Todas",              value: "" },
  { label: "Registrada",         value: "REGISTRADA" },
  { label: "Asignada",           value: "ASIGNADA" },
  { label: "Lista p/ despacho",  value: "LISTA_PARA_DESPACHO" },
  { label: "En tránsito",        value: "EN_TRANSITO" },
  { label: "Entregada",          value: "ENTREGADA" },
  { label: "Bloqueada",          value: "BLOQUEADA" },
  { label: "Cancelada",          value: "CANCELADA" },
]

/* ─── Main page ─────────────────────────────────────────────────────────── */

const LIMIT = 10

export default function OrdenesPage() {
  const [page, setPage] = useState<OrderPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(
    async (s: string, st: string, p: number) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (s) params.set("search", s)
        if (st) params.set("status", st)
        params.set("page", String(p))
        params.set("limit", String(LIMIT))
        const res = await api.get<{ data: OrderPage }>(
          `${ENDPOINTS.CLIENT.ORDERS}?${params.toString()}`,
        )
        setPage(res.data.data)
      } catch {
        // api client shows toast
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setCurrentPage(1)
      void fetchOrders(search, statusFilter, 1)
    }, 350)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search, statusFilter, fetchOrders])

  useEffect(() => {
    void fetchOrders(search, statusFilter, currentPage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const openTracking = (orderId: string) => {
    setTrackingId(orderId)
    setDrawerOpen(true)
  }

  const orders = page?.items ?? []
  const totalPages = page?.totalPages ?? 1

  /* Skeleton */
  if (loading && !page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-9 w-64 bg-[#095556]/10 rounded-xl animate-pulse mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <TrackingDrawer
        orderId={trackingId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] tracking-tight uppercase">
              Historial de Órdenes
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Consulta el estado y tracking de todos tus envíos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchOrders(search, statusFilter, currentPage)}
              title="Actualizar"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#095556] hover:bg-[#095556]/8 border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              <RefreshCw size={16} />
            </button>
            <Link
              href="/cliente/nuevo-servicio"
              className="flex items-center gap-2 bg-[#095556] hover:bg-[#074041] text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              <Plus size={15} />
              Nueva Orden
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número de orden..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#095556]/30 focus:border-[#095556]/50"
            />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setCurrentPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                  statusFilter === f.value
                    ? "bg-[#095556] text-white"
                    : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Count */}
          {page && (
            <p className="text-xs text-[#94A3B8]">
              {page.total} orden{page.total !== 1 ? "es" : ""} encontrada{page.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#095556]/8 flex items-center justify-center">
              <Package size={26} className="text-[#095556]/40" />
            </div>
            <div>
              <p className="font-semibold text-[#1A202C]">
                {search || statusFilter ? "Sin resultados" : "No tienes órdenes aún"}
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                {search || statusFilter
                  ? "Prueba con otro filtro o término de búsqueda."
                  : "Solicita tu primer servicio de transporte."}
              </p>
            </div>
            {!search && !statusFilter && (
              <Link
                href="/cliente/nuevo-servicio"
                className="flex items-center gap-2 bg-[#095556] hover:bg-[#074041] text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
              >
                <Plus size={14} />
                Solicitar servicio
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow
                key={order.orderId}
                order={order}
                onTrack={() => openTracking(order.orderId)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#94A3B8]">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer",
                  currentPage === 1
                    ? "border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]",
                )}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "h-9 w-9 rounded-xl text-sm font-semibold border transition-colors cursor-pointer",
                      p === currentPage
                        ? "bg-[#095556] text-white border-[#095556]"
                        : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]",
                    )}
                  >
                    {p}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer",
                  currentPage === totalPages
                    ? "border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]",
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
