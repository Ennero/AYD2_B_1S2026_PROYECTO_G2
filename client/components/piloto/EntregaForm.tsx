"use client"

// ============================================================
// components/piloto/EntregaForm.tsx
// Formulario de cierre operativo del viaje.
// Campos:
//   - Nombre del receptor (obligatorio)
//   - Hora de recepción (obligatorio)
//   - Observaciones (opcional)
//   - Firma digital en canvas (obligatorio)
//   - Evidencia fotográfica — input file + capture (obligatorio)
//
// Al confirmar construye EntregaPayload y llama onConfirm.
// ============================================================

import { useRef, useState, useEffect } from "react"
import { EntregaPayload } from "@/types/pilot"
import { FileSignature, Camera, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface EntregaFormProps {
    loading?: boolean
    onConfirm: (payload: EntregaPayload) => void
    onCancel: () => void
}

export default function EntregaForm({
    loading = false,
    onConfirm,
    onCancel
}: EntregaFormProps) {

    // Estado del Formulario
    const [receiverName, setReceiverName] = useState("")
    const [receiverTime, setReceiverTime] = useState("")
    const [notes, setNotes] = useState("")
    const [photos, setPhotos] = useState<string[]>([])
    const [signatureOk, setSignatureOk] = useState(false)
    const [touched, setTouched] = useState(false)

    // Canvas para firma digital
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#074F57"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
    }, [])

    // Eventos del canvas (mouse + touch)
    function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ("touches" in e) {
            const touch = e.touches[0]
            return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
            }
        }
        return {
        x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
        y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
        }
    }

    function startDrawing(e: React.MouseEvent | React.TouchEvent) {
        if (!canvasRef.current) return
        isDrawing.current = true
        lastPos.current = getPos(e, canvasRef.current)
    }

    function draw(e: React.MouseEvent | React.TouchEvent) {
        if (!isDrawing.current || !canvasRef.current || !lastPos.current) return
        e.preventDefault()
        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return
    
        const pos = getPos(e, canvasRef.current)
        ctx.beginPath()
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastPos.current = pos
        setSignatureOk(true)
    }
    
    function stopDrawing() {
        isDrawing.current = false
        lastPos.current = null
    }

    function clearCanvas() {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setSignatureOk(false)
    }

    // Captura de fotos
    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files) return

        const remainingSlots = 3 - photos.length
        if (remainingSlots <= 0) {
            e.target.value = ""
            return
        }

        const selectedFiles = Array.from(files).slice(0, remainingSlots)
    
        selectedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
            if (ev.target?.result) {
            setPhotos((prev) => [...prev, ev.target!.result as string])
            }
        }
        reader.readAsDataURL(file)
        })
        // Resetear el input para permitir seleccionar la misma foto de nuevo
        e.target.value = ""
    }

    function removePhoto(index: number) {
        setPhotos((prev) => prev.filter((_, i) => i !== index))
    }
    
    // ── Validación y envío ────────────────────────────────────
    function handleConfirm() {
        setTouched(true)
        if (!receiverName.trim() || !receiverTime || !signatureOk || photos.length === 0) return
    
        const canvas = canvasRef.current
        const signatureBase64 = canvas ? canvas.toDataURL("image/png") : ""
    
        const payload: EntregaPayload = {
        receiverName:            receiverName.trim(),
        receiverSignatureBase64: signatureBase64,
        deliveryEvidenceBase64:  photos,
        notes:                   notes.trim() || undefined,
        deliveredAt:             new Date().toISOString(),
        }
    
        onConfirm(payload)
    }

    const nameError = touched && !receiverName.trim()
    const timeError = touched && !receiverTime
    const sigError  = touched && !signatureOk 
    const photoError = touched && photos.length === 0
    
    return (
        <div className="rounded-xl overflow-hidden shadow-md">
    
        {/* ── Sección: Datos del Receptor ──────────────────────── */}
        <div className="bg-surface p-6 border-b border-[#c4b1a0]">
            <h3 className="font-bold text-primary text-lg mb-4">Datos del Receptor</h3>
            <div className="flex flex-col md:flex-row gap-6">
    
            {/* Columna izquierda */}
            <div className="w-full md:w-1/2 space-y-4">
                <div>
                <label className="block text-sm font-bold text-primary mb-1">
                    Nombre Completo del Receptor <span className="text-error">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className={cn(
                    "w-full p-3 rounded-lg shadow-inner focus:outline-none focus:ring-2",
                    nameError
                        ? "border border-error focus:ring-error"
                        : "focus:ring-primary"
                    )}
                />
                {nameError && (
                    <p className="text-error text-xs mt-1">Campo obligatorio.</p>
                )}
                </div>
    
                <div>
                <label className="block text-sm font-bold text-primary mb-1">
                    Hora de Recepción <span className="text-error">*</span>
                </label>
                <input
                    type="time"
                    value={receiverTime}
                    onChange={(e) => setReceiverTime(e.target.value)}
                    className={cn(
                    "w-full p-3 rounded-lg shadow-inner focus:outline-none focus:ring-2",
                    timeError
                        ? "border border-error focus:ring-error"
                        : "focus:ring-primary"
                    )}
                />
                {timeError && (
                    <p className="text-error text-xs mt-1">Campo obligatorio.</p>
                )}
                </div>
            </div>
    
            {/* Columna derecha */}
            <div className="w-full md:w-1/2">
                <label className="block text-sm font-bold text-primary mb-1">
                Observaciones (Opcional)
                </label>
                <textarea
                rows={5}
                placeholder="Alguna novedad en la entrega..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </div>
            </div>
        </div>
    
        {/* ── Sección: Evidencia Digital ────────────────────────── */}
        <div className="bg-secondary/40 p-6">
            <h3 className="font-bold text-primary text-lg mb-5">Evidencia Digital</h3>
    
            <div className="flex flex-col md:flex-row gap-6">
    
            {/* ── Firma Digital ──────────────────────────────────── */}
            <div className="w-full md:w-1/2">
                <div
                className={cn(
                    "bg-white border-2 border-dashed rounded-xl p-4 flex flex-col items-center",
                    sigError ? "border-error" : "border-gray-300"
                )}
                >
                <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-500 w-9 h-9 rounded-full flex items-center justify-center">
                        <FileSignature size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-text-primary text-sm">
                        Firma Digital <span className="text-error">*</span>
                        </p>
                        <p className="text-xs text-text-muted">Firme con el dedo o mouse</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                    {signatureOk && (
                        <CheckCircle size={16} className="text-accent" />
                    )}
                    <button
                        onClick={clearCanvas}
                        className="text-xs text-text-muted hover:text-error flex items-center gap-1 transition-colors"
                    >
                        <X size={12} /> Limpiar
                    </button>
                    </div>
                </div>
    
                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={150}
                    className="border border-gray-200 rounded-lg w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {sigError && (
                    <p className="text-error text-xs mt-2">
                    La firma es obligatoria.
                    </p>
                )}
                </div>
            </div>
    
            {/* ── Evidencia Fotográfica ──────────────────────────── */}
            <div className="w-full md:w-1/2">
                <div
                className={cn(
                    "bg-white border-2 border-dashed rounded-xl p-4",
                    photoError ? "border-error" : "border-gray-300"
                )}
                >
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-purple-50 text-purple-500 w-9 h-9 rounded-full flex items-center justify-center">
                    <Camera size={18} />
                    </div>
                    <div>
                    <p className="font-bold text-text-primary text-sm">
                        Evidencia Fotográfica <span className="text-error">*</span>
                    </p>
                    <p className="text-xs text-text-muted">Obligatoria — máx. 3 fotos</p>
                    </div>
                </div>
    
                {/* Miniaturas de fotos seleccionadas */}
                {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                    {photos.map((src, i) => (
                        <div key={i} className="relative w-16 h-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={`Evidencia ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                            onClick={() => removePhoto(i)}
                            className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-4 h-4 flex items-center justify-center"
                        >
                            <X size={10} />
                        </button>
                        </div>
                    ))}
                    </div>
                )}
    
                {photos.length < 3 && (
                    <label className="cursor-pointer flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors w-full">
                    <Camera size={16} />
                    {photos.length === 0 ? "Capturar Foto" : "Agregar otra foto"}
                    {/* capture="environment" abre la cámara trasera en móvil */}
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={handlePhotoChange}
                    />
                    </label>
                )}

                {photoError && (
                    <p className="text-error text-xs mt-2">
                    Debes adjuntar al menos una foto de evidencia.
                    </p>
                )}
                </div>
            </div>
            </div>
    
            {/* ── Botonera final ─────────────────────────────────── */}
            <div className="mt-8 flex justify-end gap-4 border-t border-gray-300/50 pt-6">
            <button
                onClick={onCancel}
                disabled={loading}
                className="bg-white border border-gray-300 text-text-muted font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={handleConfirm}
                disabled={loading}
                className={cn(
                "font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 text-white",
                loading
                    ? "bg-primary/60 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-hover hover:-translate-y-0.5"
                )}
            >
                {loading ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Confirmando...
                </>
                ) : (
                <>
                    <CheckCircle size={18} />
                    Confirmar Entrega
                </>
                )}
            </button>
            </div>
        </div>
        </div>
    )
}