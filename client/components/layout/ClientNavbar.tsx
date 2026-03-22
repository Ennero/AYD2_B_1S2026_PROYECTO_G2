"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/hooks/useAuth"

const NAV_ITEMS = [
  { label: "Inicio", href: "/cliente" },
  { label: "Órdenes", href: "/cliente/ordenes" },
  { label: "Contratos", href: "/cliente/contratos" },
  { label: "Facturas", href: "/cliente/facturas" },
  { label: "Estado de Cuenta", href: "/cliente/estado-cuenta" },
  { label: "Contactos", href: "/cliente/contactos" },
  { label: "Mis Datos", href: "/cliente/mis-datos" },
]

export default function ClientNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="bg-[#0A3B7C] text-white shadow-lg sticky top-0 z-50">
      {/* Main bar */}
      <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/cliente" className="flex-shrink-0">
          <Image
            src="/logo-white.svg"
            alt="LogiTrans"
            width={140}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                pathname === item.href || (item.href !== "/cliente" && pathname.startsWith(item.href))
                  ? "bg-[#53B73E] text-white shadow-md"
                  : "text-white/75 hover:text-white hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side — user info + logout */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight">Cliente</p>
            <p className="text-xs text-white/60 leading-tight truncate max-w-[180px]">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#083066]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === item.href || (item.href !== "/cliente" && pathname.startsWith(item.href))
                    ? "bg-[#53B73E] text-white"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Mobile user + logout */}
          <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Cliente</p>
              <p className="text-xs text-white/60 truncate max-w-[200px]">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
