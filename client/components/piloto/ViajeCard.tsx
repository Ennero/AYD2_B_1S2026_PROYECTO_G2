// ============================================================
// components/piloto/ViajeCard.tsx
// Tarjeta de viaje para el dashboard del piloto.
// Replica el diseño del mockup:
//   - Badge de estado arriba centrado
//   - Avatar + ID + cliente a la izquierda
//   - Fecha, Origen, Destino, Tipo, Peso en fila
//   - Botón de acción a la derecha (varía por estado)
// ============================================================

import { ViajeResumen, OrderStatus } from "@/types/pilot";
import { User, MapPin, Package, Weight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ViajeCardProps {
    viaje: ViajeResumen;
    onAbrir: () => void;
}

// -- Configuración Visual por estado ------
const statusConfig: Record<
    OrderStatus,
    { label: string; badgeCls: string; btnLabel: string; btnCls: string }
> = {
    EN_TRANSITO: {
        label: "En Tránsito",
        badgeCls: "bg-accent text-primary border border-primary/30",
        btnLabel: "Actualizar Bitácora",
        btnCls: "bg-warning hover:bg-yellow-400 text-yellow-900",
    },
    LISTA_PARA_DESPACHO: {
        label: "Listo para Despacho",
        badgeCls: "bg-warning text-yellow-900 border border-yellow-600/30",
        btnLabel: "Empezar Viaje",
        btnCls: "bg-secondary hover:bg-primary text-white",
    },
    REGISTRADA: {
        label: "Registrada",
        badgeCls: "bg-gray-200 text-text-muted border border-gray-300",
        btnLabel: "Ver Detalle",
        btnCls: "bg-primary hover:bg-primary-hover text-white",
    },
    ASIGNADA: {
        label: "Asignada",
        badgeCls: "bg-blue-100 text-blue-800 border border-blue-300",
        btnLabel: "Ver Detalle",
        btnCls: "bg-primary hover:bg-primary-hover text-white",
    },
    ENTREGADA: {
        label: "Entregada",
        badgeCls: "bg-green-100 text-green-800 border border-green-300",
        btnLabel: "Ver Detalle",
        btnCls: "bg-primary hover:bg-primary-hover text-white",
    },
    BLOQUEADA: {
        label: "Bloqueada",
        badgeCls: "bg-red-100 text-red-800 border border-red-300",
        btnLabel: "Ver Detalle",
        btnCls: "bg-text-muted cursor-not-allowed text-white opacity-70",
    },
    CANCELADA: {
        label: "Cancelada",
        badgeCls: "bg-gray-200 text-text-muted border border-gray-400",
        btnLabel: "Ver Detalle",
        btnCls: "bg-text-muted cursor-not-allowed text-white opacity-70",
    },
}

export default function ViajeCard({ viaje, onAbrir }: ViajeCardProps) {
    const cfg = statusConfig[viaje.status] ?? statusConfig["REGISTRADA"]
    
    // Formatear fecha legible
    const fechaFormateada = viaje.scheduledPickupAt
        ? new Date(viaje.scheduledPickupAt).toLocaleDateString("es-GT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    : "—"

    const pesoDisplay = viaje.declaredWeightTon
        ? `${viaje.declaredWeightTon}T`
        : "—"

    return (
        <div className="relative bg-primary rounded-2xl shadow-lg mt-4">
            {/* ── Badge de estado centrado arriba ──────────────────── */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span
                className={cn(
                    "font-bold px-6 py-1 rounded-full text-sm shadow whitespace-nowrap",
                    cfg.badgeCls
                )}
                >
                {cfg.label}
                </span>
            </div>

            {/* ── Columna izquierda: Avatar + ID + Cliente ────────── */}
            <div className="w-full md:w-1/4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-primary-hover pb-4 md:pb-0 md:pr-4 gap-2">
                {/* Avatar */}
                <div className="bg-blue-400 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-md border-2 border-white">
                    <User size={28} />
                </div>
        
                {/* ID de orden */}
                <span className="text-white font-bold text-sm tracking-wide">
                    {viaje.orderNumber}
                </span>
        
                {/* Nombre del cliente */}
                <div className="w-full bg-surface text-primary font-black py-2 px-3 rounded text-center text-sm shadow-inner">
                    {viaje.clientName ?? "Cliente"}
                </div>
            </div>

            {/* ── Columna derecha: datos de ruta + botón ──────────── */}
            <div className="w-full md:w-3/4 flex flex-wrap md:flex-nowrap justify-between items-center text-white px-2 md:px-6 pt-4 md:pt-0 gap-4 text-center">
                {/* Fecha */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <CalendarDays size={14} className="text-teal-200" />
                    <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Fecha</p>
                    <p className="font-semibold text-sm">{fechaFormateada}</p>
                </div>
        
                {/* Origen */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <MapPin size={14} className="text-teal-200" />
                    <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Origen</p>
                    <p className="font-semibold text-sm leading-tight">{viaje.origin}</p>
                </div>
        
                {/* Destino */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <MapPin size={14} className="text-teal-200" />
                    <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Destino</p>
                    <p className="font-semibold text-sm leading-tight">{viaje.destination}</p>
                </div>
        
                {/* Tipo */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <Package size={14} className="text-teal-200" />
                    <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Tipo</p>
                    <p className="font-semibold text-sm leading-tight">{viaje.cargoType ?? "—"}</p>
                </div>
        
                {/* Peso */}
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                    <Weight size={14} className="text-teal-200" />
                    <p className="text-[10px] text-teal-200 tracking-widest font-bold uppercase">Peso</p>
                    <p className="font-semibold text-lg">{pesoDisplay}</p>
                </div>
        
                {/* Botón de acción */}
                <div className="flex items-center">
                    <button
                    onClick={onAbrir}
                    className={cn(
                        "font-bold py-2 px-4 rounded text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap",
                        cfg.btnCls
                    )}
                    >
                    {cfg.btnLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}