"use client"

// ============================================================
// components/piloto/RegistrarEventoModal.tsx
// Modal para que el piloto registre un nuevo evento
// en la bitácora durante el viaje.
//
// Campos: tipo de evento (select) + descripción (textarea)
// Al confirmar llama onConfirm({ eventType, description })
// ============================================================

import { useState } from "react"
import { EventType, RegistrarLogPayload } from "@/types/pilot"
import { X, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { s } from "framer-motion/client"

interface RegistrarEventoModalProps {
    open: boolean
    loading?: boolean
    onConfirm: (payload: RegistrarLogPayload) => void
    onClose: () => void
}

// Opciones del select mapeadas al enum ROUTE_EVENT_TYPE
const TIPOS_EVENTO: { value: EventType; label: string }[] = [
    { value: "SALIDA", label: "Salida" },
    { value: "PUNTO_CONTROL", label: "Punto de Control" },
    { value: "ADUANA", label: "Aduana" },
    { value: "INCIDENTE", label: "Incidente" },
    { value: "LLEGADA", label: "Llegada" },
    { value: "OTRO", label: "Otro" },
]

export default function RegistrarEventoModal({
    open,
    loading = false,
    onConfirm,
    onClose
}: RegistrarEventoModalProps) {
    const [eventType, setEventType] = useState<EventType>("PUNTO_CONTROL")
    const [description, setDescription] = useState("")
    const [touched, setTouched] = useState(false)

    if (!open) return null

    const descError = touched && description.trim().length < 5

    function handleConfirm() {
        setTouched(true)
        if (description.trim().length < 5) return

        onConfirm({ eventType, description: description.trim() })

        // Resetar para la próxima vez
        setEventType("PUNTO_CONTROL")
        setDescription("")
        setTouched(false)
    }

    function handleClose() {
        setEventType("PUNTO_CONTROL")
        setDescription("")
        setTouched(false)
        onClose()
    }

    return (
        // ------ Overlay ----------------
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                        <ClipboardList size={18} className="text-white" />
                        </div>
                        <div>
                        <h3 className="font-bold text-text-primary">Registrar Evento</h3>
                        <p className="text-xs text-text-muted">Bitácora de ruta</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-text-muted hover:text-error transition-colors p-1 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Body ───────────────────────────────────────────── */}
                <div className="p-6 space-y-5">
        
                    {/* Tipo de evento */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-1.5">
                        Tipo de Evento
                        </label>
                        <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-white"
                        >
                        {TIPOS_EVENTO.map((t) => (
                            <option key={t.value} value={t.value}>
                            {t.label}
                            </option>
                        ))}
                        </select>
                    </div>
            
                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-1.5">
                        Descripción{" "}
                        <span className="text-error">*</span>
                        </label>
                        <textarea
                        rows={4}
                        placeholder="Ej. Paso por control km 85, sin novedades."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => setTouched(true)}
                        className={cn(
                            "w-full p-3 rounded-lg border focus:outline-none focus:ring-2 resize-none text-text-primary",
                            descError
                            ? "border-error focus:ring-error"
                            : "border-gray-200 focus:ring-primary"
                        )}
                        />
                        {descError && (
                        <p className="text-error text-xs mt-1">
                            La descripción debe tener al menos 5 caracteres.
                        </p>
                        )}
                    </div>
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-text-muted font-bold hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                        "px-6 py-2.5 rounded-lg font-bold text-white transition-all flex items-center gap-2",
                        loading
                            ? "bg-primary/60 cursor-not-allowed"
                            : "bg-primary hover:bg-primary-hover hover:-translate-y-0.5"
                        )}
                    >
                        {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Registrando...
                        </>
                        ) : (
                        "Registrar Evento"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}