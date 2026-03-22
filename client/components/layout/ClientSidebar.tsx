"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  FileText,
  Receipt,
  BarChart2,
  Users,
  UserCircle2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock as ClockIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/hooks/useAuth"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/cliente", icon: Home },
  { label: "Órdenes", href: "/cliente/ordenes", icon: Package },
  { label: "Contratos", href: "/cliente/contratos", icon: FileText },
  { label: "Facturas", href: "/cliente/facturas", icon: Receipt },
  { label: "Estado de Cuenta", href: "/cliente/estado-cuenta", icon: BarChart2 },
  { label: "Contactos", href: "/cliente/contactos", icon: Users },
  { label: "Mis Datos", href: "/cliente/mis-datos", icon: UserCircle2 },
]

function isActive(href: string, pathname: string) {
  if (href === "/cliente") return pathname === "/cliente"
  return pathname.startsWith(href)
}

/* ── Shared drawer state (used by both header and drawer) ────────────────── */
// We lift drawer state into a context-like global signal via a simple module-level
// event so both components can share it without a context provider.
// On each render cycle the components reconcile their own local state.

/* ─────────────────────────────────────────────────────────────────────────
   Desktop collapsible sidebar
   Rendered as a sibling flex item to the main content column.
───────────────────────────────────────────────────────────────────────── */
export default function ClientSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-primary text-white h-screen transition-all duration-300 shadow-xl shrink-0 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      {collapsed ? (
        /* Collapsed: logo icon + expand button stacked, no overlap */
        <div className="flex flex-col items-center justify-center gap-1 py-2 h-17 bg-primary-hover border-b border-white/10 shrink-0">
          <Link href="/cliente">
            <Image src="/logo-icon.svg" alt="LogiTrans" width={32} height={36} className="h-8 w-auto" priority />
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        /* Expanded: logo centered, collapse button absolute on the right */
        <div className="flex items-center justify-between px-4 h-17 bg-primary-hover border-b border-white/10 shrink-0 relative">
          <div className="flex-1 flex justify-center">
            <Link href="/cliente">
              <Image src="/logo-white.svg" alt="LogiTrans" width={148} height={44} className="h-11 w-auto" priority />
            </Link>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Role badge */}
      {!collapsed && (
        <div className="px-5 py-3 border-b border-white/10 bg-black/10 shrink-0">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Portal Cliente</p>
          <p className="text-xs text-white/80 font-semibold truncate mt-0.5">{user?.fullName ?? "Cliente"}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#53B73E] text-white shadow-md shadow-[#53B73E]/20"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Status + logout */}
      <div className="border-t border-white/10 shrink-0">
        {!collapsed && (
          <div className="px-5 py-3 bg-black/10 space-y-2">
            {mounted && (
              <div className="flex items-center gap-2 text-xs text-white/70">
                <ClockIcon size={13} className="text-[#53B73E]" />
                <span>
                  {time.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-white/40 ml-1">
                  {time.toLocaleDateString("es-GT", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-primary-hover px-2 py-1.5 rounded-lg border border-white/5">
              <span className="relative flex h-2.5 w-2.5 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#53B73E]" />
              </span>
              <span className="text-xs font-medium text-white/80">Sistema En Línea</span>
            </div>
          </div>
        )}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => void logout()}
            title="Cerrar sesión"
            className={cn(
              "flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/10 p-2.5 rounded-xl transition-colors text-sm w-full cursor-pointer",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Mobile header bar + drawer overlay
   Rendered INSIDE the main content column so it stacks vertically.
───────────────────────────────────────────────────────────────────────── */
export function ClientMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Sticky top bar — visible only on mobile */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-primary text-white shadow-md shrink-0">
        <Link href="/cliente">
          <Image src="/logo-white.svg" alt="LogiTrans" width={120} height={36} className="h-8 w-auto" priority />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-72 bg-primary text-white z-50 flex flex-col shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 bg-primary-hover border-b border-white/10 shrink-0">
          <Image src="/logo-white.svg" alt="LogiTrans" width={128} height={38} className="h-9 w-auto" />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/10 bg-black/10 shrink-0">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Portal Cliente</p>
          <p className="text-sm text-white/85 font-semibold mt-0.5 truncate">{user?.fullName ?? "Cliente"}</p>
          <p className="text-xs text-white/45 truncate">{user?.email ?? ""}</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#53B73E] text-white shadow-md"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => void logout()}
            className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-colors text-sm w-full cursor-pointer"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  )
}
