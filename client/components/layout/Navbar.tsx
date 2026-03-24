"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/hooks/useAuth"
import type { NavItem } from "@/types"

/** Configuración de navegación por rol */
const NAV_CONFIG: Record<string, { title: string; items: NavItem[] }> = {
  "agente-operativo": {
    title: "Agente Operativo",
    items: [
      { label: "Inicio", href: "/agente-operativo" },
      { label: "Registrar Cliente", href: "/agente-operativo/registrar-cliente" },
      { label: "Formalizar Contrato", href: "/agente-operativo/formalizar-contrato" },
      { label: "Gestionar Usuarios", href: "/agente-operativo/usuarios" },
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
  gerencia: {
    title: "Gerencia Operativa",
    items: [
      { label: "Operaciones y KPIs", href: "/gerencia" },
      { label: "Rentabilidad", href: "/gerencia/rentabilidad" },
      { label: "Alertas y Proyecciones", href: "/gerencia/alertas" },
    ],
  },
}

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuth()

  // Detectar rol activo por la URL
  const activeRole = Object.keys(NAV_CONFIG).find((role) => pathname.startsWith(`/${role}`))
  const config = activeRole ? NAV_CONFIG[activeRole] : null

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={config?.items[0]?.href || "/"} className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LogiTrans" width={200} height={60} className="h-12 w-auto" priority />
          </Link>

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center gap-1">
            {config?.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side — user info + role */}
          <div className="hidden md:flex items-center gap-4">
            {config && (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {config.title}
              </span>
            )}
            {/** Aquí implementar UserMenu con nombre del usuario logueado */}
            <button
              onClick={() => void logout()}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-hover border-t border-white/10 px-4 py-3 space-y-1">
          {config?.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => void logout()}
            className="w-full text-left px-4 py-2 text-white/80 hover:text-white text-sm cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
