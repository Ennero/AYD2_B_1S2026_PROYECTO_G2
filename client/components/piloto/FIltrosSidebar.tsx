"use client"

import { useState } from "react"
import { FiltrosViaje, OrderStatus } from "@/types/pilot"
import { Search, X, ChevronDown } from "lucide-react"

interface FiltrosSidebarProps {
  filtros: FiltrosViaje
  onChange: (filtros: FiltrosViaje) => void
}

const TIPOS_MERCANCIA = ["General", "Peligrosa", "Refrigerado", "Construcción"]

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "EN_TRANSITO", label: "En Tránsito" },
  { value: "LISTA_PARA_DESPACHO", label: "Listo para Despacho" },
  { value: "ASIGNADA", label: "Asignada" },
  { value: "REGISTRADA", label: "Registrada" },
  { value: "ENTREGADA", label: "Entregada" },
  { value: "BLOQUEADA", label: "Bloqueada" },
  { value: "CANCELADA", label: "Cancelada" },
]

const inputStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(245,242,236,0.1)",
  color: "#F5F2EC",
  fontSize: "0.78rem",
  padding: "4px 0",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.52rem",
  letterSpacing: "0.28em",
  color: "#9A9489",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  display: "block",
  marginBottom: "4px",
}

export default function FiltrosSidebar({ filtros, onChange }: FiltrosSidebarProps) {
  const [local, setLocal] = useState<FiltrosViaje>(filtros)
  const [open, setOpen] = useState(false)

  function set(key: keyof FiltrosViaje, value: string) {
    setLocal(prev => ({ ...prev, [key]: value || undefined }))
  }

  function aplicar() { onChange(local); setOpen(false) }

  function limpiar() {
    const vacio: FiltrosViaje = {}
    setLocal(vacio)
    onChange(vacio)
  }

  const activos = Object.values(local).filter(Boolean).length

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {/* ── Toggle bar ── */}
      <div
        style={{
          background: "#1E1E1B",
          borderRadius: open ? "8px 8px 0 0" : "8px",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          cursor: "pointer",
          border: "1px solid rgba(245,242,236,0.06)",
          borderBottom: open ? "none" : "1px solid rgba(245,242,236,0.06)",
        }}
        onClick={() => setOpen(v => !v)}
      >
        <Search size={13} style={{ color: "#C9924B", flexShrink: 0 }} />
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, flex: 1 }}>
          Filtros
          {activos > 0 && (
            <span style={{ marginLeft: "8px", color: "#C9924B" }}>· {activos} activo{activos > 1 ? "s" : ""}</span>
          )}
        </span>
        {activos > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); limpiar() }}
            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", color: "rgba(245,242,236,0.3)", letterSpacing: "0.08em", cursor: "pointer" }}
            onMouseOver={e => (e.currentTarget.style.color = "#F5F2EC")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(245,242,236,0.3)")}
          >
            <X size={10} /> Limpiar
          </button>
        )}
        <ChevronDown size={14} style={{ color: "rgba(245,242,236,0.3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </div>

      {/* ── Expanded filter panel ── */}
      {open && (
        <div style={{
          background: "#1E1E1B",
          border: "1px solid rgba(245,242,236,0.06)",
          borderTop: "1px solid rgba(245,242,236,0.04)",
          borderRadius: "0 0 8px 8px",
          padding: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1.25rem 2rem",
          alignItems: "flex-end",
        }}>

          {/* Status */}
          <div style={{ minWidth: "160px" }}>
            <span style={labelStyle}>Estado</span>
            <select value={local.status ?? ""} onChange={e => set("status", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: "#1E1E1B", color: "#F5F2EC" }}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div style={{ minWidth: "150px" }}>
            <span style={labelStyle}>Cliente</span>
            <input type="text" value={local.clientName ?? ""} placeholder="Cementos Progreso…"
              onChange={e => set("clientName", e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")} />
          </div>

          {/* Origin */}
          <div style={{ minWidth: "120px" }}>
            <span style={labelStyle}>Origen</span>
            <input type="text" value={local.origin ?? ""} placeholder="Guatemala…"
              onChange={e => set("origin", e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")} />
          </div>

          {/* Destination */}
          <div style={{ minWidth: "120px" }}>
            <span style={labelStyle}>Destino</span>
            <input type="text" value={local.destination ?? ""} placeholder="Puerto Barrios…"
              onChange={e => set("destination", e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")} />
          </div>

          {/* Cargo type */}
          <div style={{ minWidth: "130px" }}>
            <span style={labelStyle}>Tipo de carga</span>
            <select value={local.cargoType ?? ""} onChange={e => set("cargoType", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="" style={{ background: "#1E1E1B" }}>Todos</option>
              {TIPOS_MERCANCIA.map(t => (
                <option key={t} value={t} style={{ background: "#1E1E1B", color: "#F5F2EC" }}>{t}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div style={{ minWidth: "120px" }}>
            <span style={labelStyle}>Desde</span>
            <input type="date" value={local.startDate ?? ""} onChange={e => set("startDate", e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")} />
          </div>
          <div style={{ minWidth: "120px" }}>
            <span style={labelStyle}>Hasta</span>
            <input type="date" value={local.endDate ?? ""} onChange={e => set("endDate", e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")} />
          </div>

          {/* Weight sort */}
          <div>
            <span style={labelStyle}>Peso</span>
            <div style={{ display: "flex", gap: "1rem" }}>
              {(["ASC", "DESC"] as const).map(v => (
                <button key={v} onClick={() => set("sortByWeight", local.sortByWeight === v ? "" : v)}
                  style={{
                    fontSize: "0.65rem", letterSpacing: "0.08em", cursor: "pointer",
                    fontWeight: local.sortByWeight === v ? 700 : 400,
                    color: local.sortByWeight === v ? "#C9924B" : "rgba(245,242,236,0.3)",
                    borderBottom: local.sortByWeight === v ? "1px solid #C9924B" : "1px solid transparent",
                    paddingBottom: "3px", transition: "all 0.15s",
                  }}>
                  {v === "ASC" ? "↑ Menor" : "↓ Mayor"}
                </button>
              ))}
            </div>
          </div>

          {/* Apply */}
          <div style={{ marginLeft: "auto" }}>
            <button onClick={aplicar}
              style={{
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", padding: "0.5rem 1.5rem", borderRadius: "4px",
                background: "#C9924B", color: "#0C0C0A", cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#B8813C")}
              onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}>
              Aplicar →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
