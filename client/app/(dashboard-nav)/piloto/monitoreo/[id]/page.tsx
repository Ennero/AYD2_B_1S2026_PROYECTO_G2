"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { toast } from "sonner"
import { motion } from "framer-motion"

import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { ViajeDetalle, LogEvento, RegistrarLogPayload, EntregaPayload } from "@/types/pilot"

import BitacoraTimeline from "@/components/piloto/BitacoraTimeline"
import RegistrarEventoModal from "@/components/piloto/RegistrarEventoModal"
import EntregaForm from "@/components/piloto/EntregaForm"

import { ArrowLeft, ArrowRight, MapPin, Clock, User, Plus, Flag, AlertCircle } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.52rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
      {children}
    </p>
  )
}

export default function MonitoreoPage() {
  const params  = useParams()
  const router  = useRouter()
  const orderId = params.id as string

  const [viaje, setViaje]             = useState<ViajeDetalle | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [startingTrip, setStartingTrip] = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [savingLog, setSavingLog]     = useState(false)
  const [showEntrega, setShowEntrega] = useState(false)
  const [savingEntrega, setSavingEntrega] = useState(false)
  const [newLogIds, setNewLogIds]     = useState<Set<string>>(new Set())
  const [previewMedia, setPreviewMedia] = useState<string | null>(null)
  const entregaRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchDetalle() }, [orderId])

  async function fetchDetalle() {
    setLoading(true)
    try {
      const r = await api.get<{ message: string; data: ViajeDetalle }>(ENDPOINTS.VIAJES.GET(orderId))
      const d = (r.data as any)?.data ?? (r.data as any)
      setViaje(d)
    } catch { setError("No se pudo cargar el viaje.") }
    finally { setLoading(false) }
  }

  async function handleEmpezarViaje() {
    if (!viaje) return
    setStartingTrip(true)
    try {
      await api.patch(ENDPOINTS.VIAJES.START(orderId), { status: "EN_TRANSITO" })
      toast.success("¡Viaje iniciado!")
      await fetchDetalle()
    } finally { setStartingTrip(false) }
  }

  async function handleRegistrarEvento(payload: RegistrarLogPayload) {
    setSavingLog(true)
    try {
      const r = await api.post<{ message: string; data: LogEvento }>(
        ENDPOINTS.VIAJES.ADD_LOG(orderId),
        payload as unknown as Record<string, unknown>
      )
      const d = (r.data as any)?.data ?? r.data
      const nuevoLog: LogEvento = {
        logId: d.logId,
        eventType: payload.eventType,
        eventTime: d.eventTime,
        description: payload.description,
        imagePath: d.imagePath ?? null,
      }
      setViaje(prev => prev ? { ...prev, logs: [...(prev.logs ?? []), nuevoLog] } : prev)
      setNewLogIds(prev => new Set(prev).add(d.logId))
      setModalOpen(false)
      setTimeout(() => setNewLogIds(prev => { const n = new Set(prev); n.delete(d.logId); return n }), 2000)
    } finally { setSavingLog(false) }
  }

  async function handleConfirmarEntrega(payload: EntregaPayload) {
    setSavingEntrega(true)
    try {
      await api.patch(ENDPOINTS.VIAJES.DELIVER(orderId), payload as unknown as Record<string, unknown>)
      await Swal.fire({
        title: "¡Misión Cumplida!",
        html: `La orden ha sido marcada como <strong>ENTREGADA</strong>.<br/>El borrador de factura fue creado para Finanzas.`,
        icon: "success",
        confirmButtonColor: "#C9924B",
        confirmButtonText: "Volver al menú",
        allowOutsideClick: false,
      })
      router.push("/piloto")
    } finally { setSavingEntrega(false) }
  }

  function handleMostrarEntrega() {
    setShowEntrega(true)
    setTimeout(() => entregaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F2EC" }}>
      <p style={{ fontSize: "0.68rem", letterSpacing: "0.24em", color: "#9A9489", textTransform: "uppercase" }}>
        Cargando viaje…
      </p>
    </div>
  )

  /* ── Error ── */
  if (error || !viaje) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F5F2EC" }}>
      <AlertCircle size={32} style={{ color: "#E53E3E" }} />
      <p style={{ fontSize: "0.82rem", color: "#6B6260" }}>{error ?? "Viaje no encontrado."}</p>
      <button onClick={() => router.back()}
        style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.5rem 1.5rem", background: "#0C0C0A", color: "#F5F2EC", borderRadius: "4px", cursor: "pointer" }}>
        Volver
      </button>
    </div>
  )

  const esPendiente = viaje.status === "LISTA_PARA_DESPACHO"
  const enTransito  = viaje.status === "EN_TRANSITO"
  const puedeOperar = esPendiente || enTransito

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>

      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-10">

        {/* ── Back link ── */}
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", letterSpacing: "0.1em", color: "#9A9489", textTransform: "uppercase", fontWeight: 600, marginBottom: "2rem", cursor: "pointer", background: "none", border: "none" }}
          onMouseOver={e => (e.currentTarget.style.color = "#0C0C0A")}
          onMouseOut={e => (e.currentTarget.style.color = "#9A9489")}
        >
          <ArrowLeft size={14} /> Mis Viajes
        </motion.button>

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Monitoreo de Ruta
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              {viaje.orderNumber}.
            </motion.h1>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1rem", transformOrigin: "left" }} />
        </motion.div>

        {/* ── Route card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ background: "#0C0C0A", borderRadius: "8px", padding: "1.75rem 2rem", marginBottom: "1.25rem" }}>

          {/* Origin → Destination large */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <Label>Origen</Label>
              <p style={{ fontWeight: 900, fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", letterSpacing: "-0.02em", color: "#F5F2EC", lineHeight: 1.1 }}>
                {viaje.origin}
              </p>
            </div>
            <ArrowRight size={20} style={{ color: "#C9924B", marginTop: "14px", flexShrink: 0 }} />
            <div>
              <Label>Destino</Label>
              <p style={{ fontWeight: 900, fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", letterSpacing: "-0.02em", color: "#F5F2EC", lineHeight: 1.1 }}>
                {viaje.destination}
              </p>
            </div>
          </div>

          {/* Info row */}
          <div style={{ height: "1px", background: "rgba(245,242,236,0.07)", marginBottom: "1.25rem" }} />
          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
            {[
              { icon: <User size={12} />, label: "Piloto", value: viaje.pilotName },
              { icon: <MapPin size={12} />, label: "Cliente", value: viaje.clientName },
              { icon: <Clock size={12} />, label: "Tiempo estimado", value: `${viaje.estimatedHours} h` },
              { icon: null, label: "Peso declarado", value: `${viaje.declaredWeightTon} TON` },
              { icon: null, label: "Tipo de carga", value: viaje.cargoType },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.52rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                  {item.icon && <span style={{ color: "#C9924B" }}>{item.icon}</span>}
                  {item.label}
                </div>
                <p style={{ fontWeight: 600, fontSize: "0.82rem", color: "#F5F2EC" }}>{item.value ?? "—"}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Action banner ── */}
        {puedeOperar && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
            style={{
              background: enTransito ? "rgba(201,146,75,0.08)" : "#ffffff",
              border: enTransito ? "1px solid rgba(201,146,75,0.25)" : "1px solid rgba(12,12,10,0.08)",
              borderRadius: "8px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.25rem",
            }}>

            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: enTransito ? "#C9924B" : "#0C0C0A", marginBottom: "2px" }}>
                {esPendiente ? "Listo para iniciar" : "Viaje en curso"}
              </p>
              <p style={{ fontSize: "0.72rem", color: "#9A9489" }}>
                {esPendiente
                  ? "Confirma el inicio del trayecto cuando salgas del predio."
                  : "Registra los eventos del trayecto y finaliza al llegar a destino."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {esPendiente && (
                <button onClick={handleEmpezarViaje} disabled={startingTrip}
                  style={{
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.6rem 1.5rem", borderRadius: "4px", cursor: startingTrip ? "not-allowed" : "pointer",
                    background: startingTrip ? "rgba(201,146,75,0.4)" : "#C9924B", color: "#0C0C0A",
                    display: "flex", alignItems: "center", gap: "6px", transition: "background 0.15s",
                  }}
                  onMouseOver={e => { if (!startingTrip) e.currentTarget.style.background = "#B8813C" }}
                  onMouseOut={e => { if (!startingTrip) e.currentTarget.style.background = "#C9924B" }}>
                  {startingTrip ? (
                    <><span className="w-3 h-3 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" /> Iniciando…</>
                  ) : (
                    <>Empezar Viaje <ArrowRight size={13} /></>
                  )}
                </button>
              )}

              {enTransito && (
                <>
                  <button onClick={() => setModalOpen(true)}
                    style={{
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "0.6rem 1.25rem", borderRadius: "4px", cursor: "pointer",
                      background: "transparent", color: "#0C0C0A",
                      border: "1px solid rgba(12,12,10,0.15)",
                      display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(12,12,10,0.05)" }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent" }}>
                    <Plus size={13} /> Registrar Evento
                  </button>

                  <button onClick={handleMostrarEntrega} disabled={showEntrega}
                    style={{
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "0.6rem 1.25rem", borderRadius: "4px", cursor: showEntrega ? "default" : "pointer",
                      background: showEntrega ? "rgba(12,12,10,0.06)" : "#0C0C0A",
                      color: showEntrega ? "#9A9489" : "#F5F2EC",
                      display: "flex", alignItems: "center", gap: "5px", transition: "background 0.15s",
                    }}
                    onMouseOver={e => { if (!showEntrega) e.currentTarget.style.background = "#C9924B" }}
                    onMouseOut={e => { if (!showEntrega) e.currentTarget.style.background = "#0C0C0A" }}>
                    <Flag size={13} /> Llegué a Destino
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Bitácora ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "8px", overflow: "hidden", marginBottom: "1.5rem" }}>

          {/* Header */}
          <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
                Registro de eventos
              </p>
              <p style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", color: "#0C0C0A", marginTop: "1px" }}>
                Bitácora
              </p>
            </div>
            {enTransito && (
              <button onClick={() => setModalOpen(true)}
                style={{
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.45rem 1rem", borderRadius: "4px", cursor: "pointer",
                  background: "rgba(201,146,75,0.1)", color: "#C9924B",
                  border: "1px solid rgba(201,146,75,0.25)",
                  display: "flex", alignItems: "center", gap: "5px",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(201,146,75,0.18)")}
                onMouseOut={e => (e.currentTarget.style.background = "rgba(201,146,75,0.1)")}>
                <Plus size={11} /> Agregar
              </button>
            )}
          </div>

          {/* Timeline */}
          <div style={{ padding: "1.5rem" }}>
            <BitacoraTimeline logs={viaje.logs ?? []} newLogIds={newLogIds} />
          </div>
        </motion.div>

        {(viaje.receiverSignaturePath || (viaje.deliveryEvidencePaths?.length ?? 0) > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff",
              border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "8px",
              padding: "1.2rem 1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                color: "#C9924B",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: "0.6rem",
              }}
            >
              Evidencia de cierre
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {viaje.receiverSignaturePath && (
                <button
                  onClick={() => setPreviewMedia(viaje.receiverSignaturePath ?? null)}
                  style={{
                    padding: "0.45rem 0.8rem",
                    borderRadius: "4px",
                    border: "1px solid rgba(12,12,10,0.18)",
                    background: "#fff",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Ver Firma
                </button>
              )}

              {(viaje.deliveryEvidencePaths ?? []).map((path, idx) => (
                <button
                  key={`${path}-${idx}`}
                  onClick={() => setPreviewMedia(path)}
                  style={{
                    padding: "0.45rem 0.8rem",
                    borderRadius: "4px",
                    border: "1px solid rgba(12,12,10,0.18)",
                    background: "#fff",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Ver Evidencia {idx + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Entrega form ── */}
        {showEntrega && (
          <motion.div ref={entregaRef}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
                Confirmación de entrega
              </span>
            </div>
            <EntregaForm loading={savingEntrega} onConfirm={handleConfirmarEntrega} onCancel={() => setShowEntrega(false)} />
          </motion.div>
        )}

        <div style={{ height: "4rem" }} />
      </div>

      <RegistrarEventoModal open={modalOpen} loading={savingLog} onConfirm={handleRegistrarEvento} onClose={() => setModalOpen(false)} />

      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12,12,10,0.65)",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewMedia}
            alt="Evidencia del viaje"
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: "min(92vw, 900px)",
              maxHeight: "85vh",
              borderRadius: "8px",
              border: "1px solid rgba(245,242,236,0.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              background: "#fff",
            }}
          />
        </div>
      )}
    </div>
  )
}
