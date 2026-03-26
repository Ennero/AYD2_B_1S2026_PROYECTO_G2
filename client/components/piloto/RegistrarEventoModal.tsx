"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { EventType, RegistrarLogPayload } from "@/types/pilot"
import { X, ClipboardList } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

interface RegistrarEventoModalProps {
  open: boolean
  loading?: boolean
  onConfirm: (payload: RegistrarLogPayload) => void
  onClose: () => void
}

const TIPOS_EVENTO: { value: EventType; label: string }[] = [
  { value: "PUNTO_CONTROL", label: "Punto de Control" },
  { value: "ADUANA", label: "Aduana" },
  { value: "INCIDENTE", label: "Incidente" },
  { value: "OTRO", label: "Otro" },
]

export default function RegistrarEventoModal({
  open,
  loading = false,
  onConfirm,
  onClose,
}: RegistrarEventoModalProps) {
  const [eventType, setEventType] = useState<EventType>("PUNTO_CONTROL")
  const [description, setDescription] = useState("")
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  if (!open) return null

  const descError = touched && description.trim().length < 5

  function handleConfirm() {
    setTouched(true)
    if (description.trim().length < 5) return
    onConfirm({
      eventType,
      description: description.trim(),
      imageBase64: imageBase64 ?? undefined,
    })
    setEventType("PUNTO_CONTROL")
    setDescription("")
    setImageBase64(null)
    setTouched(false)
  }

  function handleClose() {
    setEventType("PUNTO_CONTROL")
    setDescription("")
    setImageBase64(null)
    setTouched(false)
    onClose()
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") setImageBase64(result)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={() => { if (!loading) handleClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{
          background: "#ffffff", borderRadius: "6px",
          width: "100%", maxWidth: "440px", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(12,12,10,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: "3px", background: "#C9924B" }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ClipboardList size={15} style={{ color: "#C9924B" }} />
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
                Registrar Evento
              </h3>
              <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "1px" }}>Bitácora de ruta</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              width: "30px", height: "30px", borderRadius: "4px", display: "flex",
              alignItems: "center", justifyContent: "center", background: "rgba(12,12,10,0.04)",
              border: "1px solid rgba(12,12,10,0.08)", color: "#9A9489", cursor: "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.08)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Tipo de evento */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "0.4rem", letterSpacing: "0.01em" }}>
              Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              style={{
                width: "100%", padding: "0.6rem 0.75rem", borderRadius: "4px",
                border: "1px solid rgba(12,12,10,0.15)", background: "#F5F2EC",
                fontSize: "0.82rem", color: "#0C0C0A", outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "#C9924B")}
              onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.15)")}
            >
              {TIPOS_EVENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "0.4rem", letterSpacing: "0.01em" }}>
              Descripción <span style={{ color: "#E53E3E" }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Ej. Paso por control km 85, sin novedades."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.6rem 0.75rem", borderRadius: "4px",
                border: `1px solid ${descError ? "#E53E3E" : "rgba(12,12,10,0.15)"}`,
                background: "#F5F2EC", fontSize: "0.82rem", color: "#0C0C0A",
                outline: "none", resize: "none", fontFamily: "inherit",
              }}
              onFocus={e => (e.target.style.borderColor = descError ? "#E53E3E" : "#C9924B")}
              onBlur={(e) => {
                setTouched(true)
                e.target.style.borderColor = descError ? "#E53E3E" : "rgba(12,12,10,0.15)"
              }}
            />
            {descError && (
              <p style={{ fontSize: "0.68rem", color: "#E53E3E", marginTop: "4px" }}>
                La descripción debe tener al menos 5 caracteres.
              </p>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "0.4rem", letterSpacing: "0.01em" }}>
              Imagen del evento (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: "100%", padding: "0.5rem 0.75rem", borderRadius: "4px",
                border: "1px solid rgba(12,12,10,0.15)", background: "#F5F2EC",
                fontSize: "0.78rem", color: "#0C0C0A", outline: "none",
              }}
            />
            {imageBase64 && (
              <p style={{ fontSize: "0.68rem", color: "#C9924B", marginTop: "4px" }}>
                Imagen lista para enviar.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: "0.75rem",
          padding: "1rem 1.5rem", borderTop: "1px solid rgba(12,12,10,0.07)",
        }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: "0.55rem 1.1rem", background: "transparent",
              border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#6B6260",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: "0.55rem 1.25rem",
              background: loading ? "rgba(201,146,75,0.5)" : "#C9924B",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "background 0.15s",
            }}
            onMouseOver={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#b5833f" }}
            onMouseOut={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#C9924B" }}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Registrando…
              </>
            ) : (
              "Registrar Evento"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
