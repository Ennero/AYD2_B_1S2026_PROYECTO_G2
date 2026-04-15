"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"
import { ArrowLeft, Check, Loader2, Map, PackageOpen, Pencil, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"

const EASE = [0.16, 1, 0.3, 1] as const

type RouteItem = {
  routeId: number
  routeCode: string
  origin: string
  destination: string
  distanceKm: number
  estimatedHours: number
  isInternational: boolean
}

type CargoTypeItem = {
  cargoTypeId: number
  cargoName: string
  requiresRefrigeration: boolean
}

export default function GestionCatalogosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Data
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [cargoTypes, setCargoTypes] = useState<CargoTypeItem[]>([])

  // Route Form
  const [newRoute, setNewRoute] = useState("")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [distanceKm, setDistanceKm] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [isInternational, setIsInternational] = useState(false)
  const [submittingRoute, setSubmittingRoute] = useState(false)
  const [showRouteErrors, setShowRouteErrors] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null)
  const [editRouteCode, setEditRouteCode] = useState("")
  const [editRouteOrigin, setEditRouteOrigin] = useState("")
  const [editRouteDestination, setEditRouteDestination] = useState("")
  const [editRouteDistanceKm, setEditRouteDistanceKm] = useState("")
  const [editRouteEstimatedHours, setEditRouteEstimatedHours] = useState("")
  const [editRouteInternational, setEditRouteInternational] = useState(false)
  const [submittingRouteEditId, setSubmittingRouteEditId] = useState<number | null>(null)
  const [deletingRouteId, setDeletingRouteId] = useState<number | null>(null)

  // Cargo Form
  const [newCargoName, setNewCargoName] = useState("")
  const [requiresRef, setRequiresRef] = useState(false)
  const [submittingCargo, setSubmittingCargo] = useState(false)
  const [showCargoErrors, setShowCargoErrors] = useState(false)
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null)
  const [editCargoName, setEditCargoName] = useState("")
  const [editRequiresRef, setEditRequiresRef] = useState(false)
  const [submittingCargoEditId, setSubmittingCargoEditId] = useState<number | null>(null)
  const [deletingCargoId, setDeletingCargoId] = useState<number | null>(null)

  async function fetchCatalogs() {
    try {
      const [rRes, cRes] = await Promise.all([
        api.get<any>(ENDPOINTS.OPERATIONS.ROUTES),
        api.get<any>(ENDPOINTS.OPERATIONS.CARGO_TYPES),
      ])
      setRoutes(rRes.data?.data || [])
      setCargoTypes(cRes.data?.data || [])
    } catch {
      toast.error("No se pudieron cargar los catálogos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCatalogs()
  }, [])

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault()
    setShowRouteErrors(true)

    if (!newRoute || !origin || !destination || !distanceKm || !estimatedHours) {
      toast.error("Por favor, complete todos los campos obligatorios de la ruta")
      return
    }

    setSubmittingRoute(true)
    try {
      await api.post(ENDPOINTS.OPERATIONS.ROUTES, {
        routeCode: newRoute,
        origin,
        destination,
        distanceKm: Number(distanceKm),
        estimatedHours: Number(estimatedHours),
        isInternational
      })
      toast.success("Ruta añadida exitosamente")
      setNewRoute("")
      setOrigin("")
      setDestination("")
      setDistanceKm("")
      setEstimatedHours("")
      setIsInternational(false)
      setShowRouteErrors(false)
      fetchCatalogs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Hubo un error al agregar la ruta (posible duplicada)")
    } finally {
      setSubmittingRoute(false)
    }
  }

  async function handleCreateCargo(e: React.FormEvent) {
    e.preventDefault()
    setShowCargoErrors(true)

    if (!newCargoName) {
      toast.error("Por favor, ingrese el nombre del tipo de carga")
      return
    }

    setSubmittingCargo(true)
    try {
      await api.post(ENDPOINTS.OPERATIONS.CARGO_TYPES, {
        cargoName: newCargoName,
        requiresRefrigeration: requiresRef,
      })
      toast.success("Tipo de carga añadida exitosamente")
      setNewCargoName("")
      setRequiresRef(false)
      setShowCargoErrors(false)
      fetchCatalogs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Hubo un error al agregar el tipo de carga (posible duplicada)")
    } finally {
      setSubmittingCargo(false)
    }
  }

  function startRouteEdition(route: RouteItem) {
    setEditingRouteId(route.routeId)
    setEditRouteCode(route.routeCode)
    setEditRouteOrigin(route.origin)
    setEditRouteDestination(route.destination)
    setEditRouteDistanceKm(String(route.distanceKm))
    setEditRouteEstimatedHours(String(route.estimatedHours))
    setEditRouteInternational(route.isInternational)
  }

  function cancelRouteEdition() {
    setEditingRouteId(null)
    setEditRouteCode("")
    setEditRouteOrigin("")
    setEditRouteDestination("")
    setEditRouteDistanceKm("")
    setEditRouteEstimatedHours("")
    setEditRouteInternational(false)
  }

  async function handleUpdateRoute(routeId: number) {
    if (
      !editRouteCode.trim() ||
      !editRouteOrigin.trim() ||
      !editRouteDestination.trim() ||
      !editRouteDistanceKm.trim() ||
      !editRouteEstimatedHours.trim()
    ) {
      toast.error("Todos los campos de la ruta son obligatorios")
      return
    }

    const normalizedDistance = Number(editRouteDistanceKm)
    const normalizedHours = Number(editRouteEstimatedHours)
    if (!Number.isFinite(normalizedDistance) || normalizedDistance <= 0) {
      toast.error("La distancia debe ser mayor a 0")
      return
    }

    if (!Number.isFinite(normalizedHours) || normalizedHours <= 0) {
      toast.error("Las horas estimadas deben ser mayores a 0")
      return
    }

    setSubmittingRouteEditId(routeId)
    try {
      await api.put(ENDPOINTS.OPERATIONS.ROUTE(routeId), {
        routeCode: editRouteCode,
        origin: editRouteOrigin,
        destination: editRouteDestination,
        distanceKm: normalizedDistance,
        estimatedHours: normalizedHours,
        isInternational: editRouteInternational,
      })
      toast.success("Ruta actualizada")
      cancelRouteEdition()
      await fetchCatalogs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || "No se pudo actualizar la ruta")
    } finally {
      setSubmittingRouteEditId(null)
    }
  }

  async function handleDeleteRoute(route: RouteItem) {
    const confirmed = window.confirm(`¿Desactivar la ruta ${route.routeCode}?`)
    if (!confirmed) return

    setDeletingRouteId(route.routeId)
    try {
      await api.delete(ENDPOINTS.OPERATIONS.ROUTE(route.routeId))
      toast.success("Ruta desactivada")
      if (editingRouteId === route.routeId) {
        cancelRouteEdition()
      }
      await fetchCatalogs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || "No se pudo desactivar la ruta")
    } finally {
      setDeletingRouteId(null)
    }
  }

  function startCargoEdition(cargo: CargoTypeItem) {
    setEditingCargoId(cargo.cargoTypeId)
    setEditCargoName(cargo.cargoName)
    setEditRequiresRef(cargo.requiresRefrigeration)
  }

  function cancelCargoEdition() {
    setEditingCargoId(null)
    setEditCargoName("")
    setEditRequiresRef(false)
  }

  async function handleUpdateCargo(cargoTypeId: number) {
    if (!editCargoName.trim()) {
      toast.error("El nombre del tipo de carga es obligatorio")
      return
    }

    setSubmittingCargoEditId(cargoTypeId)
    try {
      await api.put(ENDPOINTS.OPERATIONS.CARGO_TYPE(cargoTypeId), {
        cargoName: editCargoName,
        requiresRefrigeration: editRequiresRef,
      })
      toast.success("Tipo de carga actualizado")
      cancelCargoEdition()
      await fetchCatalogs()
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el tipo de carga")
    } finally {
      setSubmittingCargoEditId(null)
    }
  }

  async function handleDeleteCargo(cargo: CargoTypeItem) {
    const confirmed = window.confirm(`¿Eliminar el tipo de carga ${cargo.cargoName}?`)
    if (!confirmed) return

    setDeletingCargoId(cargo.cargoTypeId)
    try {
      await api.delete(ENDPOINTS.OPERATIONS.CARGO_TYPE(cargo.cargoTypeId))
      toast.success("Tipo de carga eliminado")
      if (editingCargoId === cargo.cargoTypeId) {
        cancelCargoEdition()
      }
      await fetchCatalogs()
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el tipo de carga")
    } finally {
      setDeletingCargoId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Ghost letters */}
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem, 30vw, 28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>GC</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">
        {/* Back Link */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          onClick={() => router.push("/agente-operativo")}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2rem", cursor: "pointer", background: "none", border: "none" }}
          onMouseOver={e => (e.currentTarget.style.color = "#0C0C0A")}
          onMouseOut={e => (e.currentTarget.style.color = "#9A9489")}
        >
          <ArrowLeft size={11} /> Agente Operativo
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Agente Operativo
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Gestión de Catálogos.
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Agrega nuevas rutas y tipos de cargas para mantener actualizadas las opciones de asignación logística.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <Loader2 className="animate-spin mx-auto text-[#C9924B]" size={24} style={{ marginBottom: "1rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Cargando catálogos...
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
          >
            {/* Rutas Column */}
            <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <Map size={18} style={{ color: "#C9924B" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0C0C0A", textTransform: "uppercase" }}>
                  Rutas Autorizadas
                </span>
              </div>
              
              <div style={{ padding: "1.75rem" }}>
                <form onSubmit={handleCreateRoute} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Código de Ruta</label>
                    <input
                      type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)}
                      placeholder="Ej. GUA-ZAC"
                      className={`w-full bg-[#FAF9F6] border ${showRouteErrors && !newRoute ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`}
                      disabled={submittingRoute}
                    />
                    {showRouteErrors && !newRoute && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Campo requerido</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Origen</label>
                      <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ej. Guatemala" className={`w-full bg-[#FAF9F6] border ${showRouteErrors && !origin ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`} disabled={submittingRoute} />
                      {showRouteErrors && !origin && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Requerido</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Destino</label>
                      <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ej. Zacapa" className={`w-full bg-[#FAF9F6] border ${showRouteErrors && !destination ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`} disabled={submittingRoute} />
                      {showRouteErrors && !destination && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Requerido</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Distancia (KM)</label>
                      <input type="number" step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="Ej. 150.5" className={`w-full bg-[#FAF9F6] border ${showRouteErrors && !distanceKm ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`} disabled={submittingRoute} />
                      {showRouteErrors && !distanceKm && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Requerido</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Horas Est.</label>
                      <input type="number" step="0.1" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="Ej. 3.5" className={`w-full bg-[#FAF9F6] border ${showRouteErrors && !estimatedHours ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`} disabled={submittingRoute} />
                      {showRouteErrors && !estimatedHours && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Requerido</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#84817A]">
                      <input type="checkbox" checked={isInternational} onChange={(e) => setIsInternational(e.target.checked)} className="accent-[#C9924B] w-4 h-4 cursor-pointer" disabled={submittingRoute} />
                      <span className="text-xs uppercase font-bold tracking-wider color-[#6B6260]">Internacional</span>
                    </label>
                    <button
                      type="submit"
                      disabled={submittingRoute}
                      style={{
                        padding: "0.5rem 1.25rem", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", cursor: submittingRoute ? "not-allowed" : "pointer",
                        background: submittingRoute ? "#9A9489" : "#0C0C0A", color: "#F5F2EC", border: "none", transition: "background 0.15s",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                      onMouseOver={e => { if (!submittingRoute) e.currentTarget.style.background = "#C9924B" }}
                      onMouseOut={e => { if (!submittingRoute) e.currentTarget.style.background = "#0C0C0A" }}
                    >
                      {submittingRoute ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Agregar
                    </button>
                  </div>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                  <AnimatePresence>
                    {routes.map((route, i) => (
                      <motion.div key={route.routeId}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        style={{ border: "1px solid rgba(12,12,10,0.06)", borderRadius: "4px", padding: "0.75rem 1rem", background: "#FAF9F6" }}
                      >
                        {editingRouteId === route.routeId ? (
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <input
                              type="text"
                              value={editRouteCode}
                              onChange={(e) => setEditRouteCode(e.target.value)}
                              className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                              disabled={submittingRouteEditId === route.routeId}
                              placeholder="Código de ruta"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editRouteOrigin}
                                onChange={(e) => setEditRouteOrigin(e.target.value)}
                                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                                disabled={submittingRouteEditId === route.routeId}
                                placeholder="Origen"
                              />
                              <input
                                type="text"
                                value={editRouteDestination}
                                onChange={(e) => setEditRouteDestination(e.target.value)}
                                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                                disabled={submittingRouteEditId === route.routeId}
                                placeholder="Destino"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={editRouteDistanceKm}
                                onChange={(e) => setEditRouteDistanceKm(e.target.value)}
                                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                                disabled={submittingRouteEditId === route.routeId}
                                placeholder="Distancia KM"
                              />
                              <input
                                type="number"
                                step="0.1"
                                value={editRouteEstimatedHours}
                                onChange={(e) => setEditRouteEstimatedHours(e.target.value)}
                                className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                                disabled={submittingRouteEditId === route.routeId}
                                placeholder="Horas"
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#6B6260] uppercase font-bold tracking-wider">
                              <input
                                type="checkbox"
                                checked={editRouteInternational}
                                onChange={(e) => setEditRouteInternational(e.target.checked)}
                                className="accent-[#C9924B] w-4 h-4 cursor-pointer"
                                disabled={submittingRouteEditId === route.routeId}
                              />
                              Internacional
                            </label>
                            <div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={cancelRouteEdition}
                                disabled={submittingRouteEditId === route.routeId}
                                style={{ border: "1px solid rgba(12,12,10,0.12)", padding: "0.35rem 0.55rem", borderRadius: "4px", background: "transparent", color: "#6B6260", cursor: "pointer" }}
                              >
                                <X size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRoute(route.routeId)}
                                disabled={submittingRouteEditId === route.routeId}
                                style={{ border: "none", padding: "0.35rem 0.55rem", borderRadius: "4px", background: "#0C0C0A", color: "#F5F2EC", cursor: "pointer" }}
                              >
                                {submittingRouteEditId === route.routeId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0C0C0A" }}>{route.routeCode}</span>
                                {route.isInternational && (
                                  <span style={{ fontSize: "0.5rem", letterSpacing: "0.1em", background: "rgba(201,146,75,0.1)", color: "#C9924B", padding: "2px 6px", borderRadius: "2px", fontWeight: 700, textTransform: "uppercase" }}>Internacional</span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <button
                                  type="button"
                                  onClick={() => startRouteEdition(route)}
                                  disabled={deletingRouteId === route.routeId}
                                  style={{ border: "1px solid rgba(12,12,10,0.12)", padding: "0.3rem 0.5rem", borderRadius: "4px", background: "transparent", color: "#6B6260", cursor: "pointer" }}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoute(route)}
                                  disabled={deletingRouteId === route.routeId}
                                  style={{ border: "1px solid rgba(189,58,58,0.25)", padding: "0.3rem 0.5rem", borderRadius: "4px", background: "transparent", color: "#BD3A3A", cursor: "pointer" }}
                                >
                                  {deletingRouteId === route.routeId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "#6B6260" }}>
                              {route.origin} → {route.destination}
                            </p>
                            <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "4px" }}>
                              {route.distanceKm} km · {route.estimatedHours} horas
                            </p>
                          </>
                        )}
                      </motion.div>
                    ))}
                    {routes.length === 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#9A9489", textAlign: "center", padding: "1rem 0" }}>No hay rutas registradas.</p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Cargas Column */}
            <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <PackageOpen size={18} style={{ color: "#C9924B" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0C0C0A", textTransform: "uppercase" }}>
                  Tipos de Carga Permitida
                </span>
              </div>
              
              <div style={{ padding: "1.75rem" }}>
                <form onSubmit={handleCreateCargo} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#9A9489] ml-1">Nombre de la Carga</label>
                    <input
                      type="text" value={newCargoName} onChange={(e) => setNewCargoName(e.target.value)}
                      placeholder="Ej. Perecederos"
                      className={`w-full bg-[#FAF9F6] border ${showCargoErrors && !newCargoName ? "border-red-500" : "border-[#E5E0D8]"} p-3 text-sm focus:outline-none focus:border-[#C9924B] transition-all`}
                      disabled={submittingCargo}
                    />
                    {showCargoErrors && !newCargoName && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Campo requerido</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#84817A]">
                      <input type="checkbox" checked={requiresRef} onChange={(e) => setRequiresRef(e.target.checked)} className="accent-[#C9924B] w-4 h-4 cursor-pointer" disabled={submittingCargo} />
                      <span className="text-xs uppercase font-bold tracking-wider color-[#6B6260]">Requiere Refrigeración</span>
                    </label>
                    <button
                      type="submit"
                      disabled={submittingCargo}
                      style={{
                        padding: "0.5rem 1.25rem", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", cursor: submittingCargo ? "not-allowed" : "pointer",
                        background: submittingCargo ? "#9A9489" : "#0C0C0A", color: "#F5F2EC", border: "none", transition: "background 0.15s",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                      onMouseOver={e => { if (!submittingCargo) e.currentTarget.style.background = "#C9924B" }}
                      onMouseOut={e => { if (!submittingCargo) e.currentTarget.style.background = "#0C0C0A" }}
                    >
                      {submittingCargo ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Agregar
                    </button>
                  </div>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                  <AnimatePresence>
                    {cargoTypes.map((cargo, i) => (
                      <motion.div key={cargo.cargoTypeId}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        style={{ border: "1px solid rgba(12,12,10,0.06)", borderRadius: "4px", padding: "0.75rem 1rem", background: "#FAF9F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        {editingCargoId === cargo.cargoTypeId ? (
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <input
                              type="text"
                              value={editCargoName}
                              onChange={(e) => setEditCargoName(e.target.value)}
                              className="w-full bg-[#FFFFFF] border border-[#E5E0D8] p-2 text-sm focus:outline-none focus:border-[#C9924B] transition-all"
                              disabled={submittingCargoEditId === cargo.cargoTypeId}
                            />
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#6B6260] uppercase font-bold tracking-wider">
                              <input
                                type="checkbox"
                                checked={editRequiresRef}
                                onChange={(e) => setEditRequiresRef(e.target.checked)}
                                className="accent-[#C9924B] w-4 h-4 cursor-pointer"
                                disabled={submittingCargoEditId === cargo.cargoTypeId}
                              />
                              Requiere Refrigeración
                            </label>
                            <div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={cancelCargoEdition}
                                disabled={submittingCargoEditId === cargo.cargoTypeId}
                                style={{ border: "1px solid rgba(12,12,10,0.12)", padding: "0.35rem 0.55rem", borderRadius: "4px", background: "transparent", color: "#6B6260", cursor: "pointer" }}
                              >
                                <X size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCargo(cargo.cargoTypeId)}
                                disabled={submittingCargoEditId === cargo.cargoTypeId}
                                style={{ border: "none", padding: "0.35rem 0.55rem", borderRadius: "4px", background: "#0C0C0A", color: "#F5F2EC", cursor: "pointer" }}
                              >
                                {submittingCargoEditId === cargo.cargoTypeId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>{cargo.cargoName}</span>
                              {cargo.requiresRefrigeration && (
                                <span style={{ fontSize: "0.5rem", letterSpacing: "0.1em", background: "rgba(91,154,225,0.1)", color: "#3A7BD5", padding: "3px 8px", borderRadius: "2px", fontWeight: 700, textTransform: "uppercase" }}>Refrigerada</span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                onClick={() => startCargoEdition(cargo)}
                                disabled={deletingCargoId === cargo.cargoTypeId}
                                style={{ border: "1px solid rgba(12,12,10,0.12)", padding: "0.3rem 0.5rem", borderRadius: "4px", background: "transparent", color: "#6B6260", cursor: "pointer" }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCargo(cargo)}
                                disabled={deletingCargoId === cargo.cargoTypeId}
                                style={{ border: "1px solid rgba(189,58,58,0.25)", padding: "0.3rem 0.5rem", borderRadius: "4px", background: "transparent", color: "#BD3A3A", cursor: "pointer" }}
                              >
                                {deletingCargoId === cargo.cargoTypeId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                    {cargoTypes.length === 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#9A9489", textAlign: "center", padding: "1rem 0" }}>No hay cargas registradas.</p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
