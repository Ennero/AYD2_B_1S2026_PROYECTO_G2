"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  MapPin,
  Weight,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils/cn"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface CargoType {
  cargoTypeId: number
  cargoName: string
  requiresRefrigeration: boolean
}

interface ActiveContract {
  contractId: number
  contractNumber: string
  startDate: string
  endDate: string
  creditLimit: number
  currencyCode: "GTQ" | "USD" | "HNL"
  paymentTermDays: number
}

interface OrderForm {
  cargoTypeId: number | null
  pickupAddress: string
  deliveryAddress: string
  declaredWeightTon: string
  cargoDescription: string
}

const MAX_DECLARED_WEIGHT_TON = 40

/* ─── Step indicator ─────────────────────────────────────────────────────── */

function StepIndicator({ current }: { current: 1 | 2 }) {
  const steps = ["Datos Operativos", "Revisión y Confirmación"]
  return (
    <div className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
      {steps.map((label, i) => {
        const n = i + 1
        const active = n === current
        const done = n < current
        return (
          <div
            key={n}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-center text-sm font-bold transition-all",
              active
                ? "bg-primary text-white shadow-md"
                : done
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : "border-2 border-gray-200 text-text-muted"
            )}
          >
            {done ? <CheckCircle size={14} className="inline mr-1.5 -mt-0.5" /> : null}
            {n}. {label}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Field wrapper ──────────────────────────────────────────────────────── */

function Field({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? "md:col-span-2" : ""}>
      <label className="block text-sm font-bold text-text-primary mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-colors"

/* ─── Step 1 ─────────────────────────────────────────────────────────────── */

function Step1({
  form,
  activeContract,
  cargoTypes,
  loadingCatalogs,
  onUpdate,
  onNext,
}: {
  form: OrderForm
  activeContract: ActiveContract | null
  cargoTypes: CargoType[]
  loadingCatalogs: boolean
  onUpdate: (f: Partial<OrderForm>) => void
  onNext: () => void
}) {
  const validate = () => {
    if (!activeContract) return toast.error("No tienes contrato vigente"), false
    if (!form.cargoTypeId) return toast.error("Selecciona el tipo de mercancía"), false
    if (!form.pickupAddress.trim()) return toast.error("Ingresa la dirección de origen"), false
    if (!form.deliveryAddress.trim()) return toast.error("Ingresa la dirección de destino"), false
    if (!form.declaredWeightTon || Number(form.declaredWeightTon) <= 0)
      return toast.error("Ingresa un peso estimado válido"), false
    if (Number(form.declaredWeightTon) > MAX_DECLARED_WEIGHT_TON)
      return toast.error(`El peso máximo permitido es ${MAX_DECLARED_WEIGHT_TON} toneladas`), false
    return true
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-text-primary">Detalles de la Solicitud</h3>

      {loadingCatalogs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("h-12 bg-gray-100 rounded-xl", i === 4 && "md:col-span-2")} />
          ))}
        </div>
      ) : (
        <>
          {!activeContract && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                No tienes contratos vigentes. Contacta a tu agente operativo para activar uno.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 text-sm text-secondary">
              {activeContract ? (
                <span>
                  Contrato aplicado automáticamente: <strong>{activeContract.contractNumber}</strong> · Vence: {activeContract.endDate} · Pago: {activeContract.paymentTermDays} días
                </span>
              ) : (
                <span>No hay contrato vigente disponible para crear órdenes.</span>
              )}
            </div>

            {/* Tipo de mercancía */}
            <Field label="Tipo de Mercancía">
              <select
                value={form.cargoTypeId ?? ""}
                onChange={(e) => onUpdate({ cargoTypeId: e.target.value ? Number(e.target.value) : null })}
                className={inputCls}
                disabled={!activeContract || cargoTypes.length === 0}
              >
                <option value="">Selecciona tipo de mercancía…</option>
                {cargoTypes.map((ct) => (
                  <option key={ct.cargoTypeId} value={ct.cargoTypeId}>
                    {ct.cargoName}{ct.requiresRefrigeration ? " ❄️" : ""}
                  </option>
                ))}
              </select>
            </Field>

            {activeContract && cargoTypes.length === 0 && (
              <div className="md:col-span-2 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Tu contrato vigente no tiene tipos de mercancía autorizados. Contacta a tu agente operativo.
                </span>
              </div>
            )}

            {/* Origen */}
            <Field label="Origen (Planta / Bodega)">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={form.pickupAddress}
                  onChange={(e) => onUpdate({ pickupAddress: e.target.value })}
                  placeholder="Ej. Planta 3 Sanarate"
                  className={cn(inputCls, "pl-8")}
                />
              </div>
            </Field>

            {/* Destino */}
            <Field label="Destino (Planta / Bodega)">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={form.deliveryAddress}
                  onChange={(e) => onUpdate({ deliveryAddress: e.target.value })}
                  placeholder="Ej. Bodega Central Xela"
                  className={cn(inputCls, "pl-8")}
                />
              </div>
            </Field>

            {/* Info nota */}
            <div className="md:col-span-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-primary">
              El cliente define libremente el origen y destino. El agente logístico asignará
              la ruta y tarifa operativa según el catálogo vigente.
            </div>

            {/* Peso */}
            <Field label="Peso Estimado (Toneladas)">
              <div className="relative">
                <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  min="0.01"
                  max={MAX_DECLARED_WEIGHT_TON}
                  step="0.01"
                  value={form.declaredWeightTon}
                  onChange={(e) => onUpdate({ declaredWeightTon: e.target.value })}
                  placeholder="Ej. 32.5"
                  className={cn(inputCls, "pl-8")}
                />
              </div>
            </Field>

            {/* Descripción */}
            <Field label="Descripción de Carga (opcional)">
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-text-muted" />
                <textarea
                  value={form.cargoDescription}
                  onChange={(e) => onUpdate({ cargoDescription: e.target.value })}
                  placeholder="Ej. Sacos de cemento de 50 kg c/u"
                  rows={2}
                  className={cn(inputCls, "pl-8 resize-none")}
                />
              </div>
            </Field>
          </div>
        </>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={() => validate() && onNext()}
          disabled={!activeContract || loadingCatalogs || cargoTypes.length === 0}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-8 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Siguiente <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────────────────────── */

function Step2({
  form,
  activeContract,
  cargoTypes,
  submitting,
  onBack,
  onSubmit,
}: {
  form: OrderForm
  activeContract: ActiveContract | null
  cargoTypes: CargoType[]
  submitting: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  const cargoType = cargoTypes.find((ct) => ct.cargoTypeId === form.cargoTypeId)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-extrabold text-text-primary">Revisión y Confirmación</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Resumen de ruta */}
        <div className="bg-[#e8d5c4]/40 border border-[#d4bca9] rounded-2xl p-6 space-y-4">
          <h4 className="font-bold text-primary border-b border-[#d4bca9] pb-2">
            Resumen de la Solicitud
          </h4>
          <div className="space-y-2.5 text-sm">
            <Row label="Contrato" value={activeContract?.contractNumber ?? "—"} />
            <Row label="Mercancía" value={cargoType?.cargoName ?? "—"} />
            <Row label="Origen" value={form.pickupAddress} />
            <Row label="Destino" value={form.deliveryAddress} />
            <Row label="Peso estimado" value={`${form.declaredWeightTon} ton`} />
            {form.cargoDescription && (
              <Row label="Descripción" value={form.cargoDescription} />
            )}
          </div>
        </div>

        {/* Estimación financiera */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-primary border-b border-gray-100 pb-2">
            Condiciones del Contrato
          </h4>
          <div className="space-y-2.5 text-sm">
            <Row label="Plazo de pago" value={`${activeContract?.paymentTermDays ?? "—"} días`} />
            <Row
              label="Límite de crédito"
              value={
                activeContract
                  ? new Intl.NumberFormat("es-GT", {
                      style: "currency",
                      currency: activeContract.currencyCode,
                      minimumFractionDigits: 2,
                    }).format(activeContract.creditLimit)
                  : "—"
              }
            />
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-text-muted">
              El costo del servicio será calculado por el agente logístico al asignar la
              ruta y la unidad de transporte.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 border border-gray-200 text-text-muted hover:text-text-primary hover:bg-gray-50 font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer text-sm"
        >
          <ArrowLeft size={15} /> Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-2 bg-secondary hover:bg-accent text-[#1b1308] hover:text-[#1b1308] font-bold py-2.5 px-8 rounded-xl shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          Crear Orden
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-text-muted min-w-[110px] shrink-0">{label}:</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function NuevoServicioPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [activeContract, setActiveContract] = useState<ActiveContract | null>(null)
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<OrderForm>({
    cargoTypeId: null,
    pickupAddress: "",
    deliveryAddress: "",
    declaredWeightTon: "",
    cargoDescription: "",
  })

  const update = (partial: Partial<OrderForm>) =>
    setForm((prev) => ({ ...prev, ...partial }))

  useEffect(() => {
    const load = async () => {
      try {
        const cRes = await api.get<{ data: ActiveContract[] }>(ENDPOINTS.CLIENT.ACTIVE_CONTRACTS)
        const latestContract = cRes.data.data[0] ?? null
        setActiveContract(latestContract)

        if (latestContract) {
          const ctRes = await api.get<{ data: CargoType[] }>(ENDPOINTS.CLIENT.CARGO_TYPES)
          setCargoTypes(ctRes.data.data)
        } else {
          setCargoTypes([])
        }
      } catch {
        // api client shows toast
      } finally {
        setLoadingCatalogs(false)
      }
    }
    void load()
  }, [])

  const handleSubmit = async () => {
    if (!form.cargoTypeId) {
      toast.error("Selecciona el tipo de mercancía")
      return
    }

    const declaredWeightTon = Number(form.declaredWeightTon)
    if (!declaredWeightTon || declaredWeightTon <= 0) {
      toast.error("Ingresa un peso estimado válido")
      return
    }
    if (declaredWeightTon > MAX_DECLARED_WEIGHT_TON) {
      toast.error(`El peso máximo permitido es ${MAX_DECLARED_WEIGHT_TON} toneladas`)
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post<{ data: { orderNumber: string } }>(
        ENDPOINTS.CLIENT.ORDERS,
        {
          cargoTypeId: form.cargoTypeId,
          pickupAddress: form.pickupAddress,
          deliveryAddress: form.deliveryAddress,
          declaredWeightTon,
          ...(form.cargoDescription ? { cargoDescription: form.cargoDescription } : {}),
        }
      )
      toast.success(`Orden ${res.data.data.orderNumber} creada correctamente`)
      router.push("/cliente")
    } catch {
      // api client shows toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/cliente"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Cancelar y Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Generar Orden de Servicio
          </h1>
        </div>
      </div>

      {/* Wizard card */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-8">
        <StepIndicator current={step} />

        {step === 1 && (
          <Step1
            form={form}
            activeContract={activeContract}
            cargoTypes={cargoTypes}
            loadingCatalogs={loadingCatalogs}
            onUpdate={update}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            form={form}
            activeContract={activeContract}
            cargoTypes={cargoTypes}
            submitting={submitting}
            onBack={() => setStep(1)}
            onSubmit={() => void handleSubmit()}
          />
        )}
      </div>
    </div>
  )
}
