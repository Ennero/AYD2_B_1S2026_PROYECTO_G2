"use client"

import { useCallback, useEffect, useState } from "react"
import {
  FileText,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Clock,
  MapPin,
  Truck,
  Package,
  Thermometer,
  AlertCircle,
  RefreshCw,
  Tag,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils/cn"
import Button from "@/components/ui/Button"

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ContractStatus = "BORRADOR" | "PENDIENTE" | "VIGENTE" | "VENCIDO" | "RECHAZADO" | "CANCELADO"

interface ContractSummary {
  contractId: string
  contractNumber: string
  status: ContractStatus
  startDate: string
  endDate: string
  acceptedAt: string | null
  creditLimit: number
  paymentTermDays: number
  discountPercentage: number
  notes: string | null
}

interface ContractRoute {
  contractRouteId: string
  promisedDeliveryHours: number
  route: {
    routeCode: string
    origin: string
    destination: string
    distanceKm: number
    isInternational: boolean
  }
}

interface ContractRate {
  contractRateId: string
  baseRatePerKm: number
  discountPercentage: number
  finalRatePerKm: number
  vehicleType: {
    typeCode: string
    typeName: string
    minCapacityTon: number
    maxCapacityTon: number | null
  }
}

interface ContractDetail extends ContractSummary {
  cargoTypes: { cargoTypeId: number; cargoName: string; requiresRefrigeration: boolean }[]
  routes: ContractRoute[]
  rates: ContractRate[]
}

/* ─── Status config ─────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; className: string; dot: string }
> = {
  BORRADOR:  { label: "Borrador",  className: "bg-gray-100 text-gray-600",           dot: "bg-gray-400" },
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-700",         dot: "bg-amber-500" },
  VIGENTE:   { label: "Vigente",   className: "bg-[#53B73E]/15 text-[#3A8E2A]",      dot: "bg-[#53B73E]" },
  VENCIDO:   { label: "Vencido",   className: "bg-red-100 text-red-700",             dot: "bg-red-500" },
  RECHAZADO: { label: "Rechazado", className: "bg-red-50 text-red-400",              dot: "bg-red-300" },
  CANCELADO: { label: "Cancelado", className: "bg-gray-100 text-gray-400",           dot: "bg-gray-300" },
}

function StatusBadge({ status }: { status: ContractStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

/* ─── Helper formatters ─────────────────────────────────────────────────── */

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function fmtCurrency(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-3 mt-5 first:mt-0">
      {children}
    </h4>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#94A3B8] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#1A202C]">{value ?? <span className="italic text-[#CBD5E1]">—</span>}</p>
    </div>
  )
}

/* ─── Detail drawer ─────────────────────────────────────────────────────── */

function ContractDrawer({
  contractId,
  open,
  onClose,
  onStatusChange,
}: {
  contractId: string | null
  open: boolean
  onClose: () => void
  onStatusChange: (contractId: string, newStatus: ContractStatus) => void
}) {
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<"accept" | "reject" | null>(null)

  useEffect(() => {
    if (!open || !contractId) return
    setDetail(null)
    setLoading(true)
    void api
      .get<{ data: ContractDetail }>(ENDPOINTS.CLIENT.CONTRACT_DETAIL(contractId))
      .then((res) => setDetail(res.data.data))
      .catch(() => {}) // api client shows toast
      .finally(() => setLoading(false))
  }, [open, contractId])

  const handleAccept = async () => {
    if (!contractId) return
    setActing("accept")
    try {
      await api.patch(ENDPOINTS.CLIENT.CONTRACT_ACCEPT(contractId))
      toast.success("Contrato aceptado. Ya está vigente.")
      onStatusChange(contractId, "VIGENTE")
      if (detail) setDetail({ ...detail, status: "VIGENTE" })
    } catch {
      // api client shows toast
    } finally {
      setActing(null)
    }
  }

  const handleReject = async () => {
    if (!contractId) return
    setActing("reject")
    try {
      await api.patch(ENDPOINTS.CLIENT.CONTRACT_REJECT(contractId))
      toast.success("Propuesta rechazada.")
      onStatusChange(contractId, "RECHAZADO")
      if (detail) setDetail({ ...detail, status: "RECHAZADO" })
    } catch {
      // api client shows toast
    } finally {
      setActing(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg z-50 flex flex-col bg-white shadow-2xl border-l border-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#095556]/10 flex items-center justify-center">
              <FileText size={18} className="text-[#095556]" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Detalle del Contrato</p>
              <p className="font-bold text-[#1A202C] text-sm">
                {loading ? "Cargando…" : detail?.contractNumber ?? "—"}
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-[#F1F5F9] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-1">
              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={detail.status} />
                {detail.acceptedAt && (
                  <p className="text-xs text-[#94A3B8]">
                    Aceptado: {new Date(detail.acceptedAt).toLocaleDateString("es-GT")}
                  </p>
                )}
              </div>

              {/* Condiciones generales */}
              <SectionTitle>Condiciones Generales</SectionTitle>
              <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                <Field label="Número" value={detail.contractNumber} />
                <Field label="Estado" value={<StatusBadge status={detail.status} />} />
                <Field label="Inicio" value={fmtDate(detail.startDate)} />
                <Field label="Vencimiento" value={fmtDate(detail.endDate)} />
                <Field label="Límite de Crédito" value={fmtCurrency(detail.creditLimit)} />
                <Field label="Plazo de Pago" value={`${detail.paymentTermDays} días`} />
                {detail.discountPercentage > 0 && (
                  <Field label="Descuento Base" value={`${detail.discountPercentage}%`} />
                )}
              </div>

              {detail.notes && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{detail.notes}</p>
                </div>
              )}

              {/* Tipos de carga */}
              {detail.cargoTypes.length > 0 && (
                <>
                  <SectionTitle>Tipos de Mercancía Autorizados</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {detail.cargoTypes.map((ct) => (
                      <span
                        key={ct.cargoTypeId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#095556]/8 text-[#095556] text-xs font-medium border border-[#095556]/15"
                      >
                        {ct.requiresRefrigeration && (
                          <Thermometer size={11} className="text-blue-500" />
                        )}
                        <Package size={11} />
                        {ct.cargoName}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Rutas */}
              {detail.routes.length > 0 && (
                <>
                  <SectionTitle>Rutas Contratadas</SectionTitle>
                  <div className="space-y-2">
                    {detail.routes.map((cr) => (
                      <div
                        key={cr.contractRouteId}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-[#095556] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A202C] truncate">
                              {cr.route.origin}
                              <span className="text-[#94A3B8] mx-1">→</span>
                              {cr.route.destination}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              <span className="text-xs text-[#64748B]">
                                {cr.route.distanceKm} km
                              </span>
                              <span className="text-xs text-[#64748B]">
                                Entrega: {cr.promisedDeliveryHours}h
                              </span>
                              {cr.route.isInternational && (
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  Internacional
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-[#94A3B8] shrink-0">{cr.route.routeCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Tarifas */}
              {detail.rates.length > 0 && (
                <>
                  <SectionTitle>Tarifario por Tipo de Unidad</SectionTitle>
                  <div className="space-y-2">
                    {detail.rates.map((r) => (
                      <div
                        key={r.contractRateId}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Truck size={14} className="text-[#095556]" />
                          <p className="text-sm font-semibold text-[#1A202C]">
                            {r.vehicleType.typeName}
                          </p>
                          <span className="text-xs text-[#94A3B8]">
                            ({r.vehicleType.minCapacityTon}
                            {r.vehicleType.maxCapacityTon ? `–${r.vehicleType.maxCapacityTon}` : "+"} ton)
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-lg p-2 border border-[#E2E8F0]">
                            <p className="text-[10px] text-[#94A3B8] mb-0.5">Tarifa base</p>
                            <p className="text-xs font-bold text-[#475569]">Q{r.baseRatePerKm}/km</p>
                          </div>
                          {r.discountPercentage > 0 && (
                            <div className="bg-white rounded-lg p-2 border border-[#E2E8F0]">
                              <p className="text-[10px] text-[#94A3B8] mb-0.5">Descuento</p>
                              <p className="text-xs font-bold text-[#53B73E]">{r.discountPercentage}%</p>
                            </div>
                          )}
                          <div className="bg-[#095556]/5 rounded-lg p-2 border border-[#095556]/15">
                            <p className="text-[10px] text-[#095556] mb-0.5">Tarifa final</p>
                            <p className="text-xs font-bold text-[#095556]">Q{r.finalRatePerKm}/km</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer — acciones PENDIENTE */}
        {detail?.status === "PENDIENTE" && (
          <div className="shrink-0 px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
            <p className="text-xs text-[#64748B] mb-3">
              Este contrato está pendiente de tu aprobación.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => void handleAccept()}
                loading={acting === "accept"}
                disabled={acting !== null}
                className="flex-1"
              >
                <CheckCircle2 size={15} />
                Aceptar Contrato
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleReject()}
                loading={acting === "reject"}
                disabled={acting !== null}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle size={15} />
                Rechazar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Contract card ─────────────────────────────────────────────────────── */

function ContractCard({
  contract,
  onOpen,
}: {
  contract: ContractSummary
  onOpen: () => void
}) {
  const isExpiringSoon =
    contract.status === "VIGENTE" &&
    (() => {
      const end = new Date(contract.endDate + "T00:00:00")
      const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    })()

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow",
        contract.status === "VIGENTE"
          ? "border-[#095556]/25"
          : contract.status === "PENDIENTE"
          ? "border-amber-200"
          : "border-black/5",
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              contract.status === "VIGENTE"
                ? "bg-[#095556]/10"
                : contract.status === "PENDIENTE"
                ? "bg-amber-100"
                : "bg-gray-100",
            )}
          >
            <FileText
              size={18}
              className={cn(
                contract.status === "VIGENTE"
                  ? "text-[#095556]"
                  : contract.status === "PENDIENTE"
                  ? "text-amber-600"
                  : "text-gray-400",
              )}
            />
          </div>
          <div>
            <p className="font-bold text-[#1A202C] text-sm">{contract.contractNumber}</p>
            <StatusBadge status={contract.status} />
          </div>
        </div>
        {contract.status === "PENDIENTE" && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg shrink-0 animate-pulse">
            Requiere acción
          </span>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Calendar size={12} className="text-[#94A3B8]" />
          <span>Inicio: <span className="font-medium">{fmtDate(contract.startDate)}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Calendar size={12} className={isExpiringSoon ? "text-amber-500" : "text-[#94A3B8]"} />
          <span className={isExpiringSoon ? "text-amber-600 font-semibold" : ""}>
            Vence: <span className="font-medium">{fmtDate(contract.endDate)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <CreditCard size={12} className="text-[#94A3B8]" />
          <span>Crédito: <span className="font-medium">{fmtCurrency(contract.creditLimit)}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Clock size={12} className="text-[#94A3B8]" />
          <span>Plazo: <span className="font-medium">{contract.paymentTermDays}d</span></span>
        </div>
        {contract.discountPercentage > 0 && (
          <div className="flex items-center gap-1.5 text-[#475569] col-span-2">
            <Tag size={12} className="text-[#94A3B8]" />
            <span>Descuento: <span className="font-medium text-[#3A8E2A]">{contract.discountPercentage}%</span></span>
          </div>
        )}
      </div>

      {isExpiringSoon && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <AlertCircle size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Contrato próximo a vencer</p>
        </div>
      )}

      <button
        onClick={onOpen}
        className="mt-auto w-full flex items-center justify-center gap-2 border-2 border-[#095556]/20 text-[#095556] hover:bg-[#095556]/5 font-semibold py-2 rounded-xl text-sm transition-colors cursor-pointer"
      >
        Ver Detalles
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

const STATUS_FILTERS: { label: string; value: ContractStatus | "TODOS" }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "Vigente", value: "VIGENTE" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Vencido", value: "VENCIDO" },
  { label: "Rechazado", value: "RECHAZADO" },
]

export default function ContratosPage() {
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "TODOS">("TODOS")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: ContractSummary[] }>(ENDPOINTS.CLIENT.CONTRACTS)
      setContracts(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchContracts()
  }, [fetchContracts])

  const handleStatusChange = (contractId: string, newStatus: ContractStatus) => {
    setContracts((prev) =>
      prev.map((c) => (c.contractId === contractId ? { ...c, status: newStatus } : c)),
    )
  }

  const openDrawer = (contractId: string) => {
    setSelectedId(contractId)
    setDrawerOpen(true)
  }

  const filtered = contracts.filter((c) => {
    const matchesSearch = c.contractNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "TODOS" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = contracts.filter((c) => c.status === "PENDIENTE").length

  /* Skeleton */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-9 w-64 bg-[#095556]/10 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <ContractDrawer
        contractId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] tracking-tight uppercase">
              Reglas y Contratos
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Consulta los contratos y condiciones operativas pactadas con LogiTrans.
            </p>
          </div>
          <button
            onClick={() => void fetchContracts()}
            title="Actualizar"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#095556] hover:bg-[#095556]/8 border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Alert — pendientes de acción */}
        {pendingCount > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingCount === 1
                  ? "Tienes 1 contrato pendiente de aprobación"
                  : `Tienes ${pendingCount} contratos pendientes de aprobación`}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Revisa los detalles y acepta o rechaza la propuesta para activar el servicio.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contrato..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#095556]/30 focus:border-[#095556]/50"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.value === "TODOS"
                  ? contracts.length
                  : contracts.filter((c) => c.status === f.value).length
              if (f.value !== "TODOS" && count === 0) return null
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    statusFilter === f.value
                      ? "bg-[#095556] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]",
                  )}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                      statusFilter === f.value ? "bg-white/20" : "bg-[#E2E8F0]"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#095556]/8 flex items-center justify-center">
              <FileText size={26} className="text-[#095556]/40" />
            </div>
            <div>
              <p className="font-semibold text-[#1A202C]">
                {search || statusFilter !== "TODOS" ? "Sin resultados" : "No hay contratos"}
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                {search || statusFilter !== "TODOS"
                  ? "Prueba con otro filtro o término de búsqueda."
                  : "Aún no tienes contratos registrados. Contacta a tu agente operativo."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <ContractCard
                key={c.contractId}
                contract={c}
                onOpen={() => openDrawer(c.contractId)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
