"use client"

// ============================================================
// app/(dashboard-nav)/piloto/monitoreo/[id]/page.tsx
// Vista de monitoreo activo del viaje.
// Orquesta: info del viaje + bitácora + entrega.
//
// Flujo:
//   1. Carga detalle: GET /api/pilot/orders/{id}
//   2. Si LISTA_PARA_DESPACHO → botón "Empezar Viaje"
//        → PATCH /api/pilot/orders/{id}/status { EN_TRANSITO }
//   3. Botón "+ Registrar Evento" abre RegistrarEventoModal
//        → POST /api/pilot/orders/{id}/logs
//   4. Botón "Finalizar Viaje" muestra EntregaForm
//        → PATCH /api/pilot/orders/{id}/deliver
//        → Swal "¡Misión Cumplida!" → router.push("/piloto")
// ============================================================

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { toast } from "sonner"

import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import {
  ViajeDetalle,
  LogEvento,
  RegistrarLogPayload,
  EntregaPayload,
} from "@/types/pilot"

import BitacoraTimeline from "@/components/piloto/BitacoraTimeline"
import RegistrarEventoModal from "@/components/piloto/RegistrarEventoModal"
import EntregaForm from "@/components/piloto/EntregaForm"

import {
  ArrowLeft,
  Truck,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Navigation,
  ClipboardList,
  Flag,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function MonitoreoPage() {
  const params  = useParams()
  const router  = useRouter()
  const orderId = params.id as string

  // ── Estado principal ──────────────────────────────────────
  const [viaje, setViaje]               = useState<ViajeDetalle | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // ── Estado de operaciones ─────────────────────────────────
  const [startingTrip, setStartingTrip]         = useState(false)
  const [modalOpen, setModalOpen]               = useState(false)
  const [savingLog, setSavingLog]               = useState(false)
  const [showEntrega, setShowEntrega]           = useState(false)
  const [savingEntrega, setSavingEntrega]       = useState(false)

  // IDs de logs nuevos para animar en la timeline
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set())

  // Ref para hacer scroll automático al EntregaForm
  const entregaRef = useRef<HTMLDivElement>(null)

  // ── Fetch inicial ─────────────────────────────────────────
  useEffect(() => {
    fetchDetalle()
  }, [orderId])

  async function fetchDetalle() {
    setLoading(true)
    try {
      const response = await api.get<{ message: string; data: ViajeDetalle }>(ENDPOINTS.VIAJES.GET(orderId))
      const viajeData = (response.data as any)?.data ?? (response.data as any)
      setViaje(viajeData)
    } catch {
      setError("No se pudo cargar el viaje.")
    } finally {
      setLoading(false)
    }
  }

  // ── 1. Empezar viaje ──────────────────────────────────────
  async function handleEmpezarViaje() {
    if (!viaje) return
    setStartingTrip(true)
    try {
      await api.patch(ENDPOINTS.VIAJES.START(orderId), { status: "EN_TRANSITO" })
      toast.success("¡Viaje iniciado! Estado cambiado a En Tránsito.")
      // Refrescar para obtener DISPATCHED_AT y estado actualizado
      await fetchDetalle()
    } finally {
      setStartingTrip(false)
    }
  }

  // ── 2. Registrar evento en bitácora ───────────────────────
  async function handleRegistrarEvento(payload: RegistrarLogPayload) {
    setSavingLog(true)
    try {
      const response = await api.post<{ message: string; data: LogEvento }>(
      ENDPOINTS.VIAJES.ADD_LOG(orderId),
      payload as unknown as Record<string, unknown>
    )
    const logData = (response.data as any)?.data ?? response.data
    const nuevoLog: LogEvento = {
      logId:       logData.logId,
      eventType:   payload.eventType,
      eventTime:   logData.eventTime,
      description: payload.description,
    }

    setViaje((prev) =>
      prev ? { ...prev, logs: [...(prev.logs ?? []), nuevoLog] } : prev
    )
    setNewLogIds((prev) => new Set(prev).add(logData.logId))
    setModalOpen(false)

    setTimeout(() => {
      setNewLogIds((prev) => {
        const next = new Set(prev)
        next.delete(logData.logId)
        return next
      })
    }, 2000)
    } finally {
      setSavingLog(false)
    }
  }

  // ── 3. Confirmar entrega ──────────────────────────────────
  async function handleConfirmarEntrega(payload: EntregaPayload) {
    setSavingEntrega(true)
    try {
      await api.patch(
      ENDPOINTS.VIAJES.DELIVER(orderId),
      payload as unknown as Record<string, unknown>
    )

      await Swal.fire({
        title: "¡Misión Cumplida!",
        html: `La orden ha sido marcada como <strong>ENTREGADA</strong>.<br/>
              El borrador de factura fue creado automáticamente para Finanzas.`,
        icon: "success",
        confirmButtonColor: "#074F57",
        confirmButtonText: "Volver al Menú",
        allowOutsideClick: false,
      })

      router.push("/piloto")
    } finally {
      setSavingEntrega(false)
    }
  }

  // ── Scroll al EntregaForm al mostrarlo ────────────────────
  function handleMostrarEntrega() {
    setShowEntrega(true)
    setTimeout(() => {
      entregaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  // ── Estados de la UI ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <Truck size={48} className="animate-bounce text-primary" />
          <p className="font-body text-lg">Cargando monitoreo...</p>
        </div>
      </div>
    )
  }

  if (error || !viaje) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-error">
          <AlertCircle size={48} />
          <p className="font-body text-lg">{error ?? "Viaje no encontrado."}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white font-bold py-2 px-6 rounded hover:bg-primary-hover"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const esPendiente   = viaje.status === "LISTA_PARA_DESPACHO"
  const enTransito    = viaje.status === "EN_TRANSITO"
  const puedeOperar   = esPendiente || enTransito

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-5xl mx-auto px-6 py-8">

        {/* ── Breadcrumb ────────────────────────────────────── */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors"
        >
          <ArrowLeft size={18} />
          Volver al Dashboard
        </button>

        {/* ── Encabezado ────────────────────────────────────── */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-text-primary">Monitoreo de Ruta</h1>
          <p className="text-text-muted font-body">
            Orden:{" "}
            <span className="font-bold text-primary">{viaje.orderNumber}</span>
          </p>
        </div>

        {/* ── Resumen del viaje ─────────────────────────────── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
            Información del viaje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <ResumenItem icon={<MapPin size={15} />}  label="Origen"          value={viaje.origin} />
            <ResumenItem icon={<MapPin size={15} />}  label="Destino"         value={viaje.destination} />
            <ResumenItem icon={<User size={15} />}    label="Piloto Asignado" value={viaje.pilotName} />
            <ResumenItem icon={<Clock size={15} />}   label="Tiempo Estimado" value={`${viaje.estimatedHours} h`} />
          </div>
        </div>

        {/* ── Banner de acción según estado ─────────────────── */}
        {puedeOperar && (
          <div
            className={cn(
              "p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shadow-sm",
              esPendiente
                ? "bg-blue-50 border border-blue-200"
                : "bg-yellow-50 border border-yellow-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Navigation
                size={20}
                className={esPendiente ? "text-blue-600" : "text-yellow-600"}
              />
              <div>
                <p
                  className={cn(
                    "font-bold",
                    esPendiente ? "text-blue-800" : "text-yellow-800"
                  )}
                >
                  {esPendiente ? "Listo para Iniciar" : "Viaje en Curso"}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    esPendiente ? "text-blue-700" : "text-yellow-700"
                  )}
                >
                  {esPendiente
                    ? "Confirma el inicio del trayecto cuando salgas del predio."
                    : "Registre los eventos del trayecto en la bitácora."}
                </p>
              </div>
            </div>

            {esPendiente ? (
              <button
                onClick={handleEmpezarViaje}
                disabled={startingTrip}
                className={cn(
                  "font-bold py-2 px-6 rounded-lg shadow transition-all text-white whitespace-nowrap",
                  startingTrip
                    ? "bg-primary/60 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-hover"
                )}
              >
                {startingTrip ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Iniciando...
                  </span>
                ) : (
                  "Empezar Viaje → EN_TRANSITO"
                )}
              </button>
            ) : (
              <button
                onClick={handleMostrarEntrega}
                disabled={showEntrega}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors whitespace-nowrap"
              >
                <span className="flex items-center gap-2">
                  <Flag size={16} />
                  Llegué a Destino · Finalizar
                </span>
              </button>
            )}
          </div>
        )}

        {/* ── Bitácora de Eventos ───────────────────────────── */}
        <div className="bg-secondary/40 p-6 rounded-xl shadow-md mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <ClipboardList size={20} />
              Bitácora de Eventos
            </h2>

            {/* Solo mostrar el botón si el viaje está en tránsito */}
            {enTransito && (
              <div className="flex flex-col items-end gap-1">
                <div className="inline-flex items-center gap-1 bg-white/80 text-primary border border-teal-200 rounded-full px-3 py-1 text-xs font-bold">
                  POST /api/pilot/orders/{"{id}"}/logs
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-primary-hover transition-colors shadow"
                >
                  + Registrar Evento
                </button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <BitacoraTimeline logs={viaje.logs ?? []} newLogIds={newLogIds} />
          </div>
        </div>

        {/* ── Formulario de Entrega (se muestra al finalizar) ── */}
        {showEntrega && (
          <div ref={entregaRef} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-white text-primary border border-teal-200 rounded-full px-3 py-1 text-xs font-bold mb-4">
              PATCH /api/pilot/orders/{"{id}"}/deliver
            </div>
            <EntregaForm
              loading={savingEntrega}
              onConfirm={handleConfirmarEntrega}
              onCancel={() => setShowEntrega(false)}
            />
          </div>
        )}
      </main>

      {/* ── Modal Registrar Evento ────────────────────────────── */}
      <RegistrarEventoModal
        open={modalOpen}
        loading={savingLog}
        onConfirm={handleRegistrarEvento}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

// ── Subcomponente info del resumen ────────────────────────
function ResumenItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="font-semibold text-text-primary">{value}</p>
    </div>
  )
}