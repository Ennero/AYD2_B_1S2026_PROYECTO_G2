"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, X, Search } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"

const EASE = [0.16, 1, 0.3, 1] as const

type CargaReal = {
  id: string
  codigo: string
  unitId: string | null
  pilotName: string
  vehicleModel: string
  plateNumber: string
  fecha: string
  origen: string
  destino: string
  estado: "PENDIENTE" | "FORMALIZADO"
  peso: string
  estibaValida: boolean
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.52rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
      {children}
    </p>
  )
}

export default function FormalizarCargasPage() {
  const [allCargas, setAllCargas] = useState<CargaReal[]>([])
  const [loading, setLoading] = useState(true)
  const [piloto, setPiloto]           = useState("")
  const [placa, setPlaca]             = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin]       = useState("")
  const [orden, setOrden]             = useState<"asc" | "desc">("desc")

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const r = await api.get<{ message: string; data: CargaReal[] }>("/api/operations/cargas")
        if (r.ok) setAllCargas(r.data.data)
      } catch { toast.error("Error cargando las órdenes") }
      finally { setLoading(false) }
    })()
  }, [])

  const cargas = useMemo(() => {
    let f = [...allCargas]
    if (piloto.trim()) {
      const term = piloto.trim().toLowerCase()
      filtered = filtered.filter(c =>
        c.pilotName.toLowerCase().includes(term) ||
        c.codigo.toLowerCase().includes(term) ||
        c.vehicleModel.toLowerCase().includes(term) ||
        c.plateNumber.toLowerCase().includes(term) ||
        c.origen.toLowerCase().includes(term) ||
        c.destino.toLowerCase().includes(term)
      )
    }
    if (placa.trim())   f = f.filter(c => c.plateNumber.toLowerCase().includes(placa.trim().toLowerCase()))
    if (fechaInicio)    f = f.filter(c => c.fecha >= fechaInicio)
    if (fechaFin)       f = f.filter(c => c.fecha <= fechaFin)
    f.sort((a, b) => orden === "asc" ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha))
    return f
  }, [allCargas, piloto, placa, fechaInicio, fechaFin, orden])

  const clearFilters = () => { setPiloto(""); setPlaca(""); setFechaInicio(""); setFechaFin(""); setOrden("desc") }

  const handleFormalizar = async (id: string, carga: CargaReal) => {
    const w = Number(carga.peso)
    if (!carga.unitId || !Number.isFinite(w) || w <= 0 || !carga.estibaValida) {
      toast.error("Debes tener unit_id asignado, peso > 0 y estiba válida")
      return
    }
    try {
      const r = await api.patch(`/api/operations/cargas/${id}/formalizar`, { loadedWeightTon: w, stowageConfirmed: true })
      if (r.ok) {
        setAllCargas(prev => prev.map(c => c.id === id ? { ...c, estado: "FORMALIZADO" as const } : c))
        toast.success(`Carga ${carga.codigo} formalizada`)
      }
    } catch { /* handled by api client */ }
  }

  const patch = (id: string, field: keyof CargaReal, value: any) =>
    setAllCargas(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>

      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Encargado de Patio
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Cargas a Formalizar.
            </motion.h1>
          </div>
        </motion.div>

        {/* ── Filter bar — dark pill ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{
            background: "#1E1E1B",
            borderRadius: "8px",
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0 2rem",
          }}>

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: "140px" }}>
            <Search size={12} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "#6B6260", pointerEvents: "none" }} />
            <input type="text" value={piloto} placeholder="Buscar…" onChange={e => setPiloto(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(245,242,236,0.1)", color: "#F5F2EC", fontSize: "0.78rem", padding: "4px 0 4px 20px", outline: "none", width: "100%" }}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")}
            />
          </div>

          {/* Placa */}
          <div style={{ width: "110px" }}>
            <input type="text" value={placa} placeholder="Placa" onChange={e => setPlaca(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(245,242,236,0.1)", color: "#F5F2EC", fontSize: "0.78rem", padding: "4px 0", outline: "none", width: "100%" }}
              onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
              onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")}
            />
          </div>

          {/* Dates */}
          {[{ v: fechaInicio, s: setFechaInicio, p: "Desde" }, { v: fechaFin, s: setFechaFin, p: "Hasta" }].map(f => (
            <div key={f.p} style={{ width: "130px" }}>
              <input type="date" value={f.v} onChange={e => f.s(e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(245,242,236,0.1)", color: f.v ? "#F5F2EC" : "#6B6260", fontSize: "0.78rem", padding: "4px 0", outline: "none", width: "100%", colorScheme: "dark" }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")}
              />
            </div>
          ))}

          {/* Order */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {(["asc", "desc"] as const).map(v => (
              <button key={v} onClick={() => setOrden(v)}
                style={{ fontSize: "0.65rem", letterSpacing: "0.08em", cursor: "pointer", fontWeight: orden === v ? 700 : 400, color: orden === v ? "#C9924B" : "rgba(245,242,236,0.3)", transition: "color 0.15s" }}>
                {v === "asc" ? "↑ ASC" : "↓ DESC"}
              </button>
            ))}
          </div>

          {/* Clear */}
          <button onClick={clearFilters}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", color: "rgba(245,242,236,0.25)", cursor: "pointer", letterSpacing: "0.08em", transition: "color 0.15s" }}
            onMouseOver={e => (e.currentTarget.style.color = "#F5F2EC")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(245,242,236,0.25)")}>
            <X size={10} /> Limpiar
          </button>
        </motion.div>

        {/* Results count */}
        {!loading && (
          <p style={{ fontSize: "0.58rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", marginBottom: "1rem" }}>
            {cargas.length} {cargas.length === 1 ? "resultado" : "resultados"}
          </p>
        )}

        {loading && (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: "0.68rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase" }}>
            Cargando órdenes…
          </p>
        )}

        {!loading && cargas.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 0", fontSize: "0.68rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase" }}>
            Sin cargas para los filtros aplicados.
          </motion.p>
        )}

        {/* ── Cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cargas.map((carga, i) => {
            const done = carga.estado === "FORMALIZADO"
            const canDispatch = !done && Boolean(carga.unitId)

            return (
              <motion.div key={carga.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.55, ease: EASE }}
                style={{
                  background: "#ffffff",
                  border: `1px solid ${done ? "rgba(201,146,75,0.2)" : "rgba(12,12,10,0.07)"}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                }}>

                {/* Top accent line */}
                <div style={{ height: "2px", background: done ? "#C9924B" : "rgba(12,12,10,0.06)" }} />

                {/* Main content */}
                <div style={{ padding: "1.25rem 1.5rem" }}>

                  {/* Row 1: info */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap" }}>

                    {/* Código */}
                    <div style={{ flexShrink: 0 }}>
                      <Label>Código</Label>
                      <span style={{ fontWeight: 900, fontSize: "0.88rem", letterSpacing: "0.05em", color: done ? "#9A9489" : "#0C0C0A" }}>
                        {carga.codigo}
                      </span>
                    </div>

                    {/* Info columns */}
                    {[
                      { label: "Unidad", value: carga.vehicleModel, sub: carga.plateNumber },
                      { label: "Fecha", value: carga.fecha },
                      { label: "Origen", value: carga.origen },
                      { label: "Destino", value: carga.destino },
                    ].map(col => (
                      <div key={col.label} style={{ minWidth: "80px" }}>
                        <Label>{col.label}</Label>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0C0C0A", lineHeight: 1.2 }}>{col.value}</p>
                        {col.sub && <p style={{ fontSize: "0.62rem", color: "#9A9489", marginTop: "1px" }}>{col.sub}</p>}
                      </div>
                    ))}

                    {/* Status — right */}
                    <div style={{ marginLeft: "auto", alignSelf: "center", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                        color: done ? "#C9924B" : "rgba(12,12,10,0.3)",
                      }}>
                        {done ? "Formalizado" : "Pendiente"}
                      </span>
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 text-center sm:text-left mb-4 sm:mb-0">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Unidad Asignada</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.vehicleModel}</p>
                      <p className="text-xs text-white/70 break-all">Placa: {carga.plateNumber}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Piloto</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.pilotName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Fecha</p>
                      <p className="font-bold text-lg whitespace-nowrap">{carga.fecha}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Origen</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.origen}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Destino</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.destino}</p>
                    </div>
                  </div>

                  {/* Action Row - Inputs and buttons */}
                  <div className="lg:col-span-12 flex flex-wrap items-center justify-center lg:justify-end gap-x-6 gap-y-4 pt-4 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">ID de orden:</span>
                      <input 
                        type="text" 
                        value={carga.id}
                        readOnly
                        className="w-48 px-3 py-1.5 text-center text-text-primary font-bold rounded bg-white shadow-inner disabled:opacity-80"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Peso en Báscula:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={carga.peso}
                          onChange={(e) => updateCargaField(carga.id, 'peso', e.target.value)}
                          disabled={isFormalizado}
                          className="w-20 px-3 py-1.5 text-center text-text-primary font-bold rounded bg-white shadow-inner disabled:opacity-80"
                        />
                        <span style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#9A9489", fontWeight: 700 }}>TON</span>
                      </div>
                    </div>

                    {/* Estiba */}
                    <div>
                      <Label>Estiba</Label>
                      <button type="button" disabled={done}
                        onClick={() => patch(carga.id, "estibaValida", !carga.estibaValida)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", cursor: done ? "default" : "pointer", padding: "2px 0" }}>
                        {carga.estibaValida
                          ? <CheckCircle2 size={16} style={{ color: "#C9924B" }} />
                          : <Circle size={16} style={{ color: "rgba(12,12,10,0.2)" }} />
                        }
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: carga.estibaValida ? "#C9924B" : "rgba(12,12,10,0.3)" }}>
                          {carga.estibaValida ? "Confirmada" : "Sin confirmar"}
                        </span>
                      </button>
                    </div>

                    {/* CTA */}
                    <div style={{ marginLeft: "auto" }}>
                      {done ? (
                        <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9489" }}>
                          Despachado
                        </span>
                      ) : (
                        <button disabled={!canDispatch} onClick={() => handleFormalizar(carga.id, carga)}
                          style={{
                            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "0.5rem 1.25rem", borderRadius: "4px",
                            cursor: canDispatch ? "pointer" : "not-allowed",
                            background: canDispatch ? "#0C0C0A" : "transparent",
                            color: canDispatch ? "#F5F2EC" : "rgba(12,12,10,0.2)",
                            border: canDispatch ? "none" : "1px solid rgba(12,12,10,0.1)",
                            transition: "background 0.2s",
                          }}
                          onMouseOver={e => { if (canDispatch) e.currentTarget.style.background = "#C9924B" }}
                          onMouseOut={e => { if (canDispatch) e.currentTarget.style.background = "#0C0C0A" }}>
                          Listo para Despacho →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div style={{ height: "4rem" }} />
      </div>
    </div>
  )
}
