"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/hooks/useAuth"
import type { NavItem } from "@/types"

const SIDEBAR_CONFIG: Record<string, { title: string; items: NavItem[] }> = {
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
    items: [{ label: "Mis Viajes", href: "/piloto" }],
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
      { label: "Bandeja de Facturación", href: "/finances/facturacion" },
      { label: "Conciliar Pagos", href: "/finances/pagos" },
      { label: "Tarifario Base", href: "/finances/tarifario" },
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

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const { logout } = useAuth()

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const activeRole = Object.keys(SIDEBAR_CONFIG).find((role) =>
    pathname.startsWith(`/${role}`)
  )
  const config = activeRole ? SIDEBAR_CONFIG[activeRole] : null

  return (
    <aside
      className={cn(
        "min-h-screen flex flex-col transition-all duration-300 relative z-50 select-none",
        collapsed ? "w-18" : "w-56"
      )}
      style={{
        background: "#0C0C0A",
        borderRight: "1px solid rgba(245,242,236,0.06)",
      }}
    >

      {/* ── Brand header ── */}
      <div
        className="flex items-center justify-between px-5 relative"
        style={{ height: "64px", borderBottom: "1px solid rgba(245,242,236,0.06)" }}
      >
        {!collapsed && (
          <Link href={config?.items[0]?.href || "/"} style={{ textDecoration: "none" }}>
            <span style={{
              fontWeight: 900,
              fontSize: "0.78rem",
              letterSpacing: "0.32em",
              color: "#F5F2EC",
            }}>
              LOGITRANS
            </span>
          </Link>
        )}

        {collapsed && (
          <Link href={config?.items[0]?.href || "/"} style={{ textDecoration: "none", margin: "0 auto" }}>
            <span style={{ fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.1em", color: "#F5F2EC" }}>
              LT
            </span>
          </Link>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{ color: "rgba(245,242,236,0.3)", cursor: "pointer", padding: "4px", lineHeight: 0 }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#F5F2EC")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(245,242,236,0.3)")}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Role label ── */}
      {config && (
        <div
          style={{
            padding: collapsed ? "20px 0 16px" : "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom: "1px solid rgba(245,242,236,0.06)",
          }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              style={{ color: "rgba(245,242,236,0.3)", cursor: "pointer", lineHeight: 0 }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#C9924B")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(245,242,236,0.3)")}
              title="Expandir"
            >
              <ChevronRight size={15} />
            </button>
          ) : (
            <span style={{
              fontSize: "0.55rem",
              letterSpacing: "0.34em",
              color: "#C9924B",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>
              {config.title}
            </span>
          )}
        </div>
      )}

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? "20px 0" : "20px 0" }}>
        {config?.items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${activeRole}` && pathname.startsWith(item.href))

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "40px",
                  margin: "2px 12px",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  background: active ? "rgba(201,146,75,0.15)" : "transparent",
                  color: active ? "#C9924B" : "rgba(245,242,236,0.3)",
                  textDecoration: "none",
                  letterSpacing: "0.04em",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseOver={(e) => {
                  if (!active) e.currentTarget.style.color = "#F5F2EC"
                }}
                onMouseOut={(e) => {
                  if (!active) e.currentTarget.style.color = "rgba(245,242,236,0.3)"
                }}
              >
                {item.label.charAt(0)}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "9px 20px",
                textDecoration: "none",
                transition: "color 0.15s",
                color: active ? "#C9924B" : "rgba(245,242,236,0.38)",
                position: "relative",
              }}
              onMouseOver={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(245,242,236,0.75)"
              }}
              onMouseOut={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(245,242,236,0.38)"
              }}
            >
              {/* Active indicator — thin left rule */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: "2px",
                    background: "#C9924B",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <span style={{
                fontSize: "0.82rem",
                fontWeight: active ? 700 : 400,
                letterSpacing: active ? "0.01em" : "0",
                lineHeight: 1.2,
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid rgba(245,242,236,0.06)" }}>

        {/* Clock + status — single minimal line */}
        {!collapsed && mounted && (
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderBottom: "1px solid rgba(245,242,236,0.06)",
            }}
          >
            {/* Live dot */}
            <span className="relative flex" style={{ width: "6px", height: "6px", flexShrink: 0 }}>
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: "#C9924B" }}
              />
              <span className="relative inline-flex rounded-full" style={{ width: "6px", height: "6px", background: "#C9924B" }} />
            </span>
            <span style={{ fontSize: "0.68rem", color: "rgba(245,242,236,0.28)", letterSpacing: "0.04em" }}>
              {time.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {time.toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
            </span>
          </div>
        )}

        {/* Collapsed: just dot */}
        {collapsed && (
          <div style={{ padding: "12px 0", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(245,242,236,0.06)" }}>
            <span className="relative flex" style={{ width: "5px", height: "5px" }}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: "#C9924B" }} />
              <span className="relative inline-flex rounded-full" style={{ width: "5px", height: "5px", background: "#C9924B" }} />
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => void logout()}
          title="Cerrar sesión"
          className={cn("flex items-center w-full cursor-pointer transition-colors", collapsed ? "justify-center py-4 px-0" : "gap-3 px-5 py-4")}
          style={{ color: "rgba(245,242,236,0.22)", background: "transparent" }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#F5F2EC")}
          onMouseOut={(e) => (e.currentTarget.style.color = "rgba(245,242,236,0.22)")}
        >
          <LogOut size={15} />
          {!collapsed && (
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>Cerrar sesión</span>
          )}
        </button>
      </div>
    </aside>
  )
}
