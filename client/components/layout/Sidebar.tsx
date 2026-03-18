"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, ChevronLeft, ChevronRight, Clock as ClockIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/hooks/useAuth"
import type { NavItem } from "@/types"

/** Configuración completa de navegación por rol con sidebar */
const SIDEBAR_CONFIG: Record<string, { title: string; items: NavItem[] }> = {
  "agente-operativo": {
    title: "Agente Operativo",
    items: [
      { label: "Inicio", href: "/agente-operativo" },
      { label: "Registrar Cliente", href: "/agente-operativo/registrar-cliente" },
      { label: "Formalizar Contrato", href: "/agente-operativo/formalizar-contrato" },
    ],
  },
  piloto: {
    title: "Piloto",
    items: [
      { label: "Mis Viajes", href: "/piloto" },
    ],
  },
  "agente-logistico": {
    title: "Agente Logístico",
    items: [
      { label: "Inicio", href: "/agente-logistico" },
      { label: "Asignación de Rutas", href: "/agente-logistico/asignacion-rutas" },
      { label: "Órdenes de Servicio", href: "/agente-logistico/ordenes" },
    ],
  },
  "encargado-patio": {
    title: "Encargado de Patio",
    items: [
      { label: "Inicio", href: "/encargado-patio" },
      { label: "Formalizar Cargas", href: "/encargado-patio/cargas" },
    ],
  },
  "certificador-fel": {
    title: "Certificador FEL",
    items: [
      { label: "Portal", href: "/certificador-fel" },
      { label: "Bandeja de Aprobación", href: "/certificador-fel/bandeja" },
    ],
  },
  finances: {
    title: "Agente Financiero",
    items: [
      { label: "Inicio", href: "/finances" },
      { label: "Bandeja de Facturacion", href: "/finances/facturacion" },
      { label: "Conciliar Pagos", href: "/finances/pagos" },
      { label: "Tarifario Base", href: "/finances/tarifario" },
    ],
  },
}

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const { logout } = useAuth()

  // Prevent hydration mismatch for the Clock
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Detectar rol activo por la URL
  const activeRole = Object.keys(SIDEBAR_CONFIG).find((role) => pathname.startsWith(`/${role}`))
  const config = activeRole ? SIDEBAR_CONFIG[activeRole] : null

  return (
    <aside
      className={cn(
        "bg-[#0A3B7C] text-white min-h-screen flex flex-col transition-all duration-300 shadow-xl relative z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between min-h-[80px] bg-[#083066] relative">
        <div className="flex-1 flex justify-center">
          <Link href={config?.items[0]?.href || "/"}>
            {collapsed ? (
              <Image src="/logo-icon.svg" alt="LogiTrans" width={40} height={44} className="h-11 w-auto" priority />
            ) : (
              <Image src="/logo-white.svg" alt="LogiTrans" width={160} height={48} className="h-12 w-auto" priority />
            )}
          </Link>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-white/10 absolute right-2 top-1/2 -translate-y-1/2"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && config && (
        <div className="px-5 py-4 border-b border-white/10 bg-black/10">
          <span className="text-xs text-white/70 uppercase tracking-widest font-semibold">{config.title}</span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        {config?.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === item.href
                ? "bg-[#53B73E] text-white shadow-md shadow-[#53B73E]/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            title={collapsed ? item.label : undefined}
          >
            {collapsed && (
               <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 mx-auto">
                 {item.label.charAt(0)}
               </div>
            )}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Status & Time */}
      <div className="border-t border-white/10">
        {!collapsed ? (
          <div className="px-5 py-4 space-y-3 bg-black/10">
            {mounted && (
              <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
                <ClockIcon size={16} className="text-[#53B73E]" />
                <span>
                  {time.toLocaleTimeString('es-GT', { 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
                <span className="text-xs text-white/50 ml-1">
                  {time.toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 bg-[#083066] p-2 rounded-lg border border-white/5">
              <span className="relative flex h-3 w-3 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#53B73E]"></span>
              </span>
              <span className="text-sm font-medium text-white/90">Sistema En Línea</span>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-4 bg-black/10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#53B73E]"></span>
            </span>
          </div>
        )}

        {/* Footer — logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => void logout()}
            className={cn(
              "flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-lg transition-colors text-sm w-full cursor-pointer",
              collapsed && "justify-center"
            )}
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
