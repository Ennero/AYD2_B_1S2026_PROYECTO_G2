"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import type { NavItem } from "@/types"

/** Configuración de navegación por rol con sidebar */
const SIDEBAR_CONFIG: Record<string, { title: string; items: NavItem[] }> = {
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
}

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Detectar rol activo por la URL
  const activeRole = Object.keys(SIDEBAR_CONFIG).find((role) => pathname.startsWith(`/${role}`))
  const config = activeRole ? SIDEBAR_CONFIG[activeRole] : null

  return (
    <aside
      className={cn(
        "bg-primary text-white min-h-screen flex flex-col transition-all duration-300 shadow-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <Link href={config?.items[0]?.href || "/"}>
            <span className="font-heading text-lg font-bold tracking-tight">LOGITRANS</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && config && (
        <div className="px-4 py-3 border-b border-white/10">
          <span className="text-xs text-white/60 uppercase tracking-wider">{config.title}</span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {config?.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            title={collapsed ? item.label : undefined}
          >
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer — logout */}
      <div className="p-4 border-t border-white/10">
        <button
          className={cn(
            "flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm cursor-pointer",
            collapsed && "justify-center"
          )}
          title="Cerrar sesión"
        >
          <LogOut size={20} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
