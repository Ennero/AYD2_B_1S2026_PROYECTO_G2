"use client"
// ============================================================
// app/(dashboard-nav)/agente-logistico/ordenes/[id]/page.tsx
// Detalle de Orden + Modal de Asignación
// ============================================================
// Fetch: GET /api/logistics/orders/:id
// Fetch binomios: GET /api/logistics/unit-binomials?orderId=:id
// Asignar: PATCH /api/logistics/orders/:id/assignment
// ============================================================

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { OrdenDetalle, UnitBinomial, AssignOrderPayload, ContractRouteInfo } from "@/types/logistics"
import type { PageProps } from "@/types"
import {
  ArrowLeft, MapPin, Package, Weight, User, Phone, Mail, Home,
  Truck, CheckCircle, X, Calendar, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

// ── Status badge ─────────────────────────────────────────────
const statusLabels: Record<string, { label: string; cls: string }> = {
  REGISTRADA:          { label: "Registrada",           cls: "bg-gray-200 text-text-muted border border-gray-300" },
  ASIGNADA:            { label: "Asignada",              cls: "bg-blue-100 text-blue-800 border border-blue-300" },
  LISTA_PARA_DESPACHO: { label: "Lista para Despacho",   cls: "bg-yellow-100 text-yellow-800 border border-yellow-400" },
  EN_TRANSITO:         { label: "En Tránsito",           cls: "bg-green-100 text-green-800 border border-green-300" },
  ENTREGADA:           { label: "Entregada",             cls: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
  BLOQUEADA:           { label: "Bloqueada",             cls: "bg-red-100 text-red-800 border border-red-300" },
  CANCELADA:           { label: "Cancelada",             cls: "bg-gray-200 text-text-muted border border-gray-400" },
}

// ── Modal de Asignación ──────────────────────────────────────
function ModalAsignacion({
  orden,
  onClose,
  onSuccess,
}: {
  orden: OrdenDetalle
  onClose: () => void
  onSuccess: () => void
}) {
  const [binomials, setBinomials] = useState<UnitBinomial[]>([])
  const [loadingBinomials, setLoadingBinomials] = useState(true)
  const [selectedBinomialId, setSelectedBinomialId] = useState("")
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [scheduledDeparture, setScheduledDeparture] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api
      .get<{ data: UnitBinomial[] }>(`${ENDPOINTS.LOGISTICS.UNIT_BINOMIALS}?orderId=${orden.orderId}`)
      .then(({ data }) => setBinomials(data.data))
      .catch(() => setBinomials([]))
      .finally(() => setLoadingBinomials(false))
  }, [orden.orderId])

  async function handleAsignar() {
    if (!selectedBinomialId || !selectedRouteId || !scheduledDeparture) {
      setError("Completa todos los campos para continuar.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload: AssignOrderPayload = {
        contractRouteId: selectedRouteId,
        binomialId: selectedBinomialId,
        scheduledDeparture,
      }
      await api.patch(ENDPOINTS.LOGISTICS.ASSIGN_ORDER(orden.orderId), payload)
      setSuccess(true)
    } catch {
      setError("No se pudo realizar la asignación. Verifica los datos e intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-[#53B73E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={52} className="text-[#53B73E]" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-[#0A3B7C] mb-3">¡Asignación Exitosa!</h2>
          <p className="text-[#64748B] text-lg mb-8">
            La orden <span className="font-bold text-[#0A3B7C]">{orden.orderNumber}</span> ha sido asignada correctamente.
          </p>
          <button
            onClick={onSuccess}
            className="w-full bg-[#0A3B7C] hover:bg-[#083066] text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Volver a Órdenes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-[#0A3B7C]">Asignar Piloto y Vehículo</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error transition-colors">
            <X size={24} />
          </button>
        </div>

        <p className="text-text-muted text-sm mb-6">
          Orden: <span className="font-bold text-text-primary">{orden.orderNumber}</span> —{" "}
          {orden.origin} → {orden.destination} ({orden.declaredWeightTon}T)
        </p>

        {/* Ruta (contractRoute) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-[#0A3B7C] mb-2">Ruta del Contrato</label>
          {orden.contractRoutes.length === 0 ? (
            <p className="text-sm text-error">Este contrato no tiene rutas configuradas.</p>
          ) : (
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3B7C]"
            >
              <option value="">Selecciona una ruta...</option>
              {orden.contractRoutes.map((cr: ContractRouteInfo) => (
                <option key={cr.contractRouteId} value={cr.contractRouteId}>
                  {cr.origin} → {cr.destination} ({cr.estimatedHours}h estimadas)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Binomio (unidad + piloto) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-[#0A3B7C] mb-2">Binomio (Vehículo + Piloto)</label>
          {loadingBinomials ? (
            <p className="text-sm text-text-muted">Cargando unidades disponibles...</p>
          ) : binomials.length === 0 ? (
            <p className="text-sm text-error">No hay unidades disponibles para esta orden.</p>
          ) : (
            <select
              value={selectedBinomialId}
              onChange={(e) => setSelectedBinomialId(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3B7C]"
            >
              <option value="">Selecciona un binomio...</option>
              {binomials.map((b) => (
                <option key={b.binomialId} value={b.binomialId}>
                  {b.plate} — {b.vehicleType} ({b.capacityTon}T) — Piloto: {b.pilotName}
                  {b.hasRefrigeration ? " ❄️" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fecha programada */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#0A3B7C] mb-2">Fecha y Hora de Salida Programada</label>
          <input
            type="datetime-local"
            value={scheduledDeparture}
            onChange={(e) => setScheduledDeparture(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3B7C]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-text-muted font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={submitting}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm transition-colors",
              submitting
                ? "bg-text-muted cursor-not-allowed"
                : "bg-[#0A3B7C] hover:bg-[#083066]"
            )}
          >
            {submitting ? "Asignando..." : "Confirmar Asignación"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detalle field helper ─────────────────────────────────────
function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#0A3B7C]/50">{icon}</div>
      <div>
        <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{label}</p>
        <p className="text-[#1A202C] font-semibold">{value || "—"}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function OrdenDetallePage({ params }: PageProps<{ id: string }>) {
  const { id } = use(params)
  const router = useRouter()

  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api
      .get<{ data: OrdenDetalle }>(ENDPOINTS.LOGISTICS.ORDER_DETAIL(id))
      .then(({ data }) => setOrden(data.data))
      .catch(() => setOrden(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <Truck size={48} className="animate-bounce text-primary" />
          <p className="font-body text-lg">Cargando detalle...</p>
        </div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-subheading text-xl text-text-primary mb-4">Orden no encontrada</p>
          <button
            onClick={() => router.push("/agente-logistico/ordenes")}
            className="text-primary font-semibold hover:underline flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} /> Volver a órdenes
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = statusLabels[orden.status] ?? statusLabels["REGISTRADA"]
  const canAssign = orden.status === "REGISTRADA"

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-5xl mx-auto px-6 py-8">

        {/* Back + title */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push("/agente-logistico/ordenes")}
            className="text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-heading text-3xl font-extrabold text-text-primary">
            Detalle de Orden
          </h1>
          <span className={cn("px-4 py-1 rounded-full text-sm font-bold border", statusInfo.cls)}>
            {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card — Info de la Orden */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
            <h2 className="font-heading text-xl font-bold text-[#0A3B7C] mb-6 flex items-center gap-2">
              <Package size={20} /> Información de la Orden
            </h2>
            <div className="space-y-4">
              <DetailField icon={<Package size={18} />} label="Número de Orden" value={orden.orderNumber} />
              <DetailField
                icon={<Calendar size={18} />}
                label="Fecha de Solicitud"
                value={new Date(orden.requestedAt).toLocaleDateString("es-GT", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              />
              <DetailField icon={<MapPin size={18} />} label="Origen" value={orden.origin} />
              <DetailField icon={<MapPin size={18} />} label="Destino" value={orden.destination} />
              <DetailField icon={<Weight size={18} />} label="Peso Declarado" value={`${orden.declaredWeightTon} toneladas`} />
              <DetailField icon={<Package size={18} />} label="Tipo de Carga" value={orden.cargoType} />
              {orden.requiresRefrigeration && (
                <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                  ❄️ Requiere refrigeración
                </div>
              )}
            </div>
          </div>

          {/* Card — Info del Cliente */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
            <h2 className="font-heading text-xl font-bold text-[#0A3B7C] mb-6 flex items-center gap-2">
              <User size={20} /> Información del Cliente
            </h2>
            <div className="space-y-4">
              <DetailField icon={<User size={18} />} label="Nombre" value={orden.clientName} />
              <DetailField icon={<Phone size={18} />} label="Teléfono" value={orden.clientPhone} />
              <DetailField icon={<Mail size={18} />} label="Email" value={orden.clientEmail} />
              <DetailField icon={<Home size={18} />} label="Dirección" value={orden.clientAddress} />
            </div>
          </div>

          {/* Card — Rutas del Contrato */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
            <h2 className="font-heading text-xl font-bold text-[#0A3B7C] mb-6 flex items-center gap-2">
              <MapPin size={20} /> Rutas del Contrato
            </h2>
            {orden.contractRoutes.length === 0 ? (
              <p className="text-text-muted text-sm">No hay rutas configuradas en este contrato.</p>
            ) : (
              <div className="space-y-3">
                {orden.contractRoutes.map((cr) => (
                  <div key={cr.contractRouteId} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                    <div className="w-8 h-8 bg-[#0A3B7C]/10 rounded-lg flex items-center justify-center">
                      <MapPin size={16} className="text-[#0A3B7C]" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">
                        {cr.origin} → {cr.destination}
                      </p>
                      <p className="text-xs text-text-muted">{cr.estimatedHours}h estimadas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card — Asignación actual (si ya tiene) */}
          {orden.assignedUnit && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
              <h2 className="font-heading text-xl font-bold text-[#0A3B7C] mb-6 flex items-center gap-2">
                <Truck size={20} /> Asignación Actual
              </h2>
              <div className="space-y-4">
                <DetailField icon={<Truck size={18} />} label="Placa" value={orden.assignedUnit.plate} />
                <DetailField icon={<Package size={18} />} label="Tipo de Vehículo" value={orden.assignedUnit.vehicleType} />
                <DetailField icon={<User size={18} />} label="Piloto" value={orden.assignedUnit.pilotName} />
                {orden.scheduledPickupAt && (
                  <DetailField
                    icon={<Calendar size={18} />}
                    label="Salida Programada"
                    value={new Date(orden.scheduledPickupAt).toLocaleString("es-GT")}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA — Asignar */}
        {canAssign && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-3 bg-[#0A3B7C] hover:bg-[#083066] text-white font-bold py-4 px-10 rounded-2xl text-lg shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <Truck size={22} />
              Asignar Piloto y Vehículo
            </button>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && orden && (
        <ModalAsignacion
          orden={orden}
          onClose={() => setShowModal(false)}
          onSuccess={() => router.push("/agente-logistico/ordenes")}
        />
      )}
    </div>
  )
}
