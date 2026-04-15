"use client"

import Link from "next/link"
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

/* ─────────────────────────────────────────────────────────────────────────
   Desktop collapsible sidebar
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
        "hidden lg:flex flex-col h-screen transition-all duration-300 shadow-xl shrink-0 z-40",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ background: "#0C0C0A", color: "#F5F2EC" }}
    >
      {/* Header */}
      {collapsed ? (
        <div
          className="flex flex-col items-center justify-center gap-1 py-2 shrink-0"
          style={{
            minHeight: "68px",
            borderBottom: "1px solid rgba(245,242,236,0.07)",
            background: "rgba(30,30,27,0.6)",
          }}
        >
          <Link href="/cliente" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 900, fontSize: "1rem", letterSpacing: "0.08em", color: "#F5F2EC" }}>LT</span>
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded transition-colors cursor-pointer"
            style={{ color: "rgba(245,242,236,0.5)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#F5F2EC")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(245,242,236,0.5)")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-4 relative shrink-0"
          style={{
            minHeight: "68px",
            borderBottom: "1px solid rgba(245,242,236,0.07)",
            background: "rgba(30,30,27,0.6)",
          }}
        >
          <div className="flex-1 flex justify-center">
            <Link href="/cliente" style={{ textDecoration: "none" }}>
              <span style={{ fontWeight: 900, fontSize: "0.88rem", letterSpacing: "0.32em", color: "#F5F2EC" }}>LOGITRANS</span>
            </Link>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors cursor-pointer"
            style={{ color: "rgba(245,242,236,0.5)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#F5F2EC")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(245,242,236,0.5)")}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Role badge */}
      {!collapsed && (
        <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(245,242,236,0.07)" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.32em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
            Portal Cliente
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(245,242,236,0.75)", fontWeight: 600, marginTop: "2px" }} className="truncate">
            {user?.fullName ?? "Cliente"}
          </p>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center"
              )}
              style={
                active
                  ? {
                      background: "rgba(201,146,75,0.15)",
                      color: "#C9924B",
                      borderLeft: collapsed ? "none" : "2px solid #C9924B",
                    }
                  : { color: "rgba(245,242,236,0.55)" }
              }
              onMouseOver={(e) => {
                if (!active) e.currentTarget.style.color = "#F5F2EC"
              }}
              onMouseOut={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(245,242,236,0.55)"
              }}
            >
              <item.icon size={19} className={cn("shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Status + logout */}
      <div style={{ borderTop: "1px solid rgba(245,242,236,0.07)" }} className="shrink-0">
        {!collapsed && (
          <div className="px-4 py-3 space-y-2" style={{ background: "rgba(30,30,27,0.4)" }}>
            {mounted && (
              <div className="flex items-center gap-2" style={{ fontSize: "0.7rem", color: "#9A9489" }}>
                <ClockIcon size={12} style={{ color: "#C9924B" }} />
                <span>{time.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</span>
                <span style={{ color: "rgba(154,148,137,0.6)", marginLeft: "2px" }}>
                  {time.toLocaleDateString("es-GT", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded"
              style={{ background: "rgba(245,242,236,0.04)", border: "1px solid rgba(245,242,236,0.06)" }}
            >
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#C9924B" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#C9924B" }} />
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "rgba(245,242,236,0.7)" }}>Sistema En Línea</span>
            </div>
          </div>
        )}
        <div className="p-3" style={{ borderTop: "1px solid rgba(245,242,236,0.05)" }}>
          <button
            onClick={() => void logout()}
            title="Cerrar sesión"
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-lg text-sm w-full cursor-pointer transition-colors",
              collapsed && "justify-center"
            )}
            style={{ color: "rgba(245,242,236,0.4)" }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#F5F2EC"
              e.currentTarget.style.background = "rgba(245,242,236,0.05)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "rgba(245,242,236,0.4)"
              e.currentTarget.style.background = "transparent"
            }}
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
───────────────────────────────────────────────────────────────────────── */
export function ClientMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Sticky top bar — mobile only */}
      <header
        className="lg:hidden flex items-center justify-between h-14 px-4 shadow-md shrink-0"
        style={{ background: "#0C0C0A", color: "#F5F2EC", borderBottom: "1px solid rgba(245,242,236,0.07)" }}
      >
        <Link href="/cliente" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: "0.88rem", letterSpacing: "0.32em", color: "#F5F2EC" }}>LOGITRANS</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: "rgba(245,242,236,0.7)" }}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#0C0C0A", color: "#F5F2EC" }}
      >
        <div
          className="flex items-center justify-between px-5 shrink-0"
          style={{
            minHeight: "64px",
            borderBottom: "1px solid rgba(245,242,236,0.07)",
            background: "rgba(30,30,27,0.6)",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: "0.88rem", letterSpacing: "0.32em", color: "#F5F2EC" }}>LOGITRANS</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: "rgba(245,242,236,0.6)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(245,242,236,0.07)" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.32em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
            Portal Cliente
          </p>
          <p style={{ fontSize: "0.85rem", color: "rgba(245,242,236,0.85)", fontWeight: 600, marginTop: "2px" }} className="truncate">
            {user?.fullName ?? "Cliente"}
          </p>
          <p style={{ fontSize: "0.72rem", color: "rgba(245,242,236,0.4)" }} className="truncate">
            {user?.email ?? ""}
          </p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  active
                    ? { background: "rgba(201,146,75,0.15)", color: "#C9924B", borderLeft: "2px solid #C9924B" }
                    : { color: "rgba(245,242,236,0.55)" }
                }
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 shrink-0" style={{ borderTop: "1px solid rgba(245,242,236,0.07)" }}>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full cursor-pointer transition-colors"
            style={{ color: "rgba(245,242,236,0.4)" }}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  )
}
