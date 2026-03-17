"use client"

import { ViajeResumen, OrderStatus } from "@/types/pilot"
import { User, MapPin, Package, Weight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ViajeCardProps {
  viaje: ViajeResumen
  onAbrir: () => void
}

const statusConfig: Record<
  OrderStatus,
  { label: string; badgeCls: string; btnLabel: string; btnCls: string }
> = {
  EN_TRANSITO: {
    label: "En Tránsito",
    badgeCls: "bg-accent text-primary font-black border-2 border-primary/40",
    btnLabel: "Actualizar Bitácora",
    btnCls: "bg-warning text-yellow-900 font-black border-2 border-yellow-600 hover:bg-yellow-400 shadow-lg",
  },
  LISTA_PARA_DESPACHO: {
    label: "Listo para Despacho",
    badgeCls: "bg-warning text-yellow-900 font-black border-2 border-yellow-600",
    btnLabel: "Empezar Viaje",
    btnCls: "bg-white text-primary font-black border-2 border-white hover:bg-gray-100 shadow-lg",
  },
  REGISTRADA: {
    label: "Registrada",
    badgeCls: "bg-gray-100 text-gray-700 font-black border-2 border-gray-400",
    btnLabel: "Ver Detalle",
    btnCls: "bg-white text-primary font-black border-2 border-white hover:bg-gray-100 shadow-lg",
  },
  ASIGNADA: {
    label: "Asignada",
    badgeCls: "bg-blue-200 text-blue-900 font-black border-2 border-blue-400",
    btnLabel: "Ver Detalle",
    btnCls: "bg-white text-primary font-black border-2 border-white hover:bg-gray-100 shadow-lg",
  },
  ENTREGADA: {
    label: "Entregada",
    badgeCls: "bg-green-200 text-green-900 font-black border-2 border-green-500",
    btnLabel: "Ver Detalle",
    btnCls: "bg-white text-primary font-black border-2 border-white hover:bg-gray-100 shadow-lg",
  },
  BLOQUEADA: {
    label: "Bloqueada",
    badgeCls: "bg-red-200 text-red-900 font-black border-2 border-red-500",
    btnLabel: "Ver Detalle",
    btnCls: "bg-gray-400 text-white font-black border-2 border-gray-500 cursor-not-allowed opacity-70",
  },
  CANCELADA: {
    label: "Cancelada",
    badgeCls: "bg-gray-200 text-gray-700 font-black border-2 border-gray-400",
    btnLabel: "Ver Detalle",
    btnCls: "bg-gray-400 text-white font-black border-2 border-gray-500 cursor-not-allowed opacity-70",
  },
}

export default function ViajeCard({ viaje, onAbrir }: ViajeCardProps) {
  const cfg = statusConfig[viaje.status] ?? statusConfig["REGISTRADA"]

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
    <div className="relative bg-primary rounded-2xl shadow-xl mt-6 border border-primary-hover">

      {/* Badge de estado centrado arriba */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <span className={cn(
          "px-6 py-1.5 rounded-full text-sm shadow-md whitespace-nowrap",
          cfg.badgeCls
        )}>
          {cfg.label}
        </span>
      </div>

      {/* Contenedor flex horizontal */}
      <div className="flex flex-col md:flex-row items-stretch p-5 pt-7 gap-0">

        {/* Columna izquierda: Avatar + ID + Cliente */}
        <div className="w-full md:w-1/4 flex flex-col items-center justify-center
                        border-b-2 md:border-b-0 md:border-r-2 border-white/20
                        pb-4 md:pb-0 md:pr-5 gap-3">

          {/* Avatar con anillo */}
          <div className="bg-white/20 text-white rounded-full w-16 h-16 flex items-center
                          justify-center shadow-lg border-2 border-white/40 backdrop-blur-sm">
            <User size={30} className="text-white" />
          </div>

          {/* Número de orden */}
          <span className="text-white font-black text-sm tracking-widest uppercase">
            {viaje.orderNumber}
          </span>

          {/* Nombre del cliente — fondo surface para contraste */}
          <div className="w-full bg-surface text-primary font-black py-2.5 px-3
                          rounded-lg text-center text-sm shadow-inner border border-surface">
            {viaje.clientName ?? "Cliente"}
          </div>
        </div>

        {/* Columna derecha: datos de ruta + botón */}
        <div className="w-full md:w-3/4 flex flex-wrap md:flex-nowrap justify-between
                        items-center text-white px-2 md:px-6 pt-4 md:pt-0 gap-3 text-center">

          {/* Fecha */}
          <div className="flex flex-col items-center gap-1 min-w-[65px]">
            <CalendarDays size={16} className="text-accent" />
            <p className="text-[10px] text-accent tracking-widest font-black uppercase">Fecha</p>
            <p className="font-bold text-sm text-white">{fechaFormateada}</p>
          </div>

          {/* Separador vertical */}
          <div className="hidden md:block w-px h-10 bg-white/20" />

          {/* Origen */}
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            <MapPin size={16} className="text-accent" />
            <p className="text-[10px] text-accent tracking-widest font-black uppercase">Origen</p>
            <p className="font-bold text-sm leading-tight text-white">{viaje.origin}</p>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-10 bg-white/20" />

          {/* Destino */}
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            <MapPin size={16} className="text-accent" />
            <p className="text-[10px] text-accent tracking-widest font-black uppercase">Destino</p>
            <p className="font-bold text-sm leading-tight text-white">{viaje.destination}</p>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-10 bg-white/20" />

          {/* Tipo */}
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            <Package size={16} className="text-accent" />
            <p className="text-[10px] text-accent tracking-widest font-black uppercase">Tipo</p>
            <p className="font-bold text-sm leading-tight text-white">{viaje.cargoType ?? "—"}</p>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-10 bg-white/20" />

          {/* Peso */}
          <div className="flex flex-col items-center gap-1 min-w-[55px]">
            <Weight size={16} className="text-accent" />
            <p className="text-[10px] text-accent tracking-widest font-black uppercase">Peso</p>
            <p className="font-black text-xl text-white">{pesoDisplay}</p>
          </div>

          {/* Botón de acción — bien diferenciado del fondo */}
          <div className="flex items-center ml-auto">
            <button
              onClick={onAbrir}
              className={cn(
                "py-2.5 px-5 rounded-xl text-sm transition-all hover:-translate-y-0.5",
                "active:translate-y-0 whitespace-nowrap",
                cfg.btnCls
              )}
            >
              {cfg.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}