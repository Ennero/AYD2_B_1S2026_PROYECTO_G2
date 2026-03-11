"use client"

/** Aquí implementar menú desplegable del usuario logueado (nombre, avatar, rol, cerrar sesión) */

import { LogOut, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface UserMenuProps {
  name: string
  role: string
  onLogout: () => void
}

export default function UserMenu({ name, role, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm cursor-pointer"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <User size={16} />
        </div>
        <span className="hidden lg:inline">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-black/10 py-1 z-50">
          <div className="px-4 py-2 border-b border-black/5">
            <p className="text-sm font-medium text-text-primary">{name}</p>
            <p className="text-xs text-text-muted">{role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/5 flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
