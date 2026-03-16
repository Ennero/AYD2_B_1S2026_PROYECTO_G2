"use client"

// ============================================================
// components/piloto/BitacoraTimeline.tsx
// Timeline vertical de eventos del viaje.
// Cada evento muestra: tipo, hora y descripción.
// Los eventos nuevos (isNew) se animan con fade-in.
// ============================================================

import { LogEvento, EventType } from "@/types/pilot"

import {
    LogOut,
    MapPin,
    Landmark,
    AlertTriangle,
    Flag,
    MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { log } from "console"

interface BitacoraTimelineProps {
    logs: LogEvento[]
    // IDs de logs recién agregados en esta sesión (para animarlos)
    newLogIds?: Set<string>
}

// -- Icono y color por tipo de evento ---
const eventConfig: Record<
    EventType,
    { icon: React.ReactNode; label: string, dotCls: string }
> = {
    SALIDA: {
        icon: <LogOut size={14} />,
        label: "Salida",
        dotCls: "bg-primary",
    },
    PUNTO_CONTROL: {
        icon: <MapPin size={14} />,
        label: "Punto de Control",
        dotCls: "bg-secondary",
    },
    ADUANA: {
        icon: <Landmark size={14} />,
        label: "Aduana",
        dotCls: "bg-blue-500",
    },
    INCIDENTE: {
        icon: <AlertTriangle size={14} />,
        label: "Incidente",
        dotCls: "bg-error",
    },
    LLEGADA: {
        icon: <Flag size={14} />,
        label: "Llegada",
        dotCls: "bg-accent",
    },
    OTRO: {
        icon: <MoreHorizontal size={14} />,
        label: "Otro",
        dotCls: "bg-text-muted",
    },
}

export default function BitacoraTimeLine({
    logs,
    newLogIds = new Set(),
}: BitacoraTimelineProps) {
    if (logs.length === 0) {
        return (
            <p className="text-text-muted text-sm italic text-center py-6">
                No hay eventos registrados aún.
            </p>
        )
    }

    return (
        <div className="relative border-l-2 border-primary ml-4 space-y-6">
            {logs.map((log) => {
                const cfg = eventConfig[log.eventType] ?? eventConfig["OTRO"]
                const isNew = newLogIds.has(log.logId)
        
                const horaDisplay = new Date(log.eventTime).toLocaleString("es-GT", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                })

                return (
                    <div
                        key={log.logId}
                        className={cn(
                        "relative pl-6 transition-all duration-500",
                        isNew && "animate-fade-in"
                        )}
                    >
                        {/* ── Punto en la línea ──────────────────────────── */}
                        <div
                        className={cn(
                            "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow",
                            cfg.dotCls
                        )}
                        />
            
                        {/* ── Tarjeta del evento ─────────────────────────── */}
                        <div
                        className={cn(
                            "bg-white p-4 rounded-lg shadow-sm",
                            isNew && "border-l-4 border-secondary"
                        )}
                        >
                        {/* Encabezado: tipo + hora */}
                        <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 font-bold text-text-primary text-sm">
                            {cfg.icon}
                            {cfg.label}
                            </span>
                            <span className="text-xs text-text-muted">{horaDisplay}</span>
                        </div>
            
                        {/* Descripción */}
                        <p className="text-text-primary text-sm leading-relaxed">
                            {log.description}
                        </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}