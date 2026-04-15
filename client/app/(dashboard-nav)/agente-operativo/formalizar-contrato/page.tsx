"use client"

import { useState, useEffect } from "react"
import Input from "@/components/ui/Input"
import {
  Search, MapPin, Truck, DollarSign, Percent,
  ShieldCheck, Loader2, Check, X, ArrowLeft, Calendar,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"
import { motion } from "framer-motion"

const EASE = [0.16, 1, 0.3, 1] as const

export interface Client {
  clientId: number
  legalName: string
  nit: string
  countryCode: "GT" | "SV" | "HN"
  currencyCode: "GTQ" | "USD" | "HNL"
}

const CURRENCY_SYMBOL: Record<Client["currencyCode"], string> = {
  GTQ: "Q",
  USD: "$",
  HNL: "L",
}

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

type VehicleTypeItem = {
  vehicleTypeId: number
  typeCode: string
  typeName: string
  minCapacityTon: number
  maxCapacityTon: number | null
  /** Tarifa global de referencia en USD (del tarifario base) */
  ratePerKm: number
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "0.52rem",
  letterSpacing: "0.3em",
  color: "#9A9489",
  textTransform: "uppercase",
  fontWeight: 700,
}

export default function FormalizarContratoPage() {
  const router = useRouter()
  const [clienteQuery, setClienteQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searching, setSearching] = useState(false)

  const [limiteCredito, setLimiteCredito] = useState("")
  const [routeQuery, setRouteQuery] = useState("")
  const [routesCatalog, setRoutesCatalog] = useState<RouteItem[]>([])
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([])
  /** Plazo de pago en días — campo libre, sin opciones fijas */
  const [plazoPago, setPlazoPago] = useState("30")
  const [cargoTypes, setCargoTypes] = useState<CargoTypeItem[]>([])
  const [cargasPermitidas, setCargasPermitidas] = useState<number[]>([])
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState("")
  const [descuentoJustificacion, setDescuentoJustificacion] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)

  /** Tipos de vehículo disponibles (cargados al inicio) */
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeItem[]>([])
  /**
   * Tarifas por tipo de vehículo en la moneda del contrato.
   * Clave: vehicleTypeId | Valor: string del input del agente
   */
  const [vehicleRates, setVehicleRates] = useState<Record<number, string>>({})

  const selectedCurrency = selectedClient?.currencyCode ?? "GTQ"
  const selectedCurrencySymbol = CURRENCY_SYMBOL[selectedCurrency]

  // Load catalogs from DB
  useEffect(() => {
    let mounted = true
    async function loadCatalogs() {
      setCatalogLoading(true)
      try {
        const [routesResponse, cargoTypesResponse, vehicleTypesResponse] = await Promise.all([
          api.get<{ data: RouteItem[] }>(ENDPOINTS.OPERATIONS.ROUTES),
          api.get<{ data: CargoTypeItem[] }>(ENDPOINTS.OPERATIONS.CARGO_TYPES),
          api.get<{ data: VehicleTypeItem[] }>(ENDPOINTS.OPERATIONS.VEHICLE_TYPES),
        ])
        if (!mounted) return
        const routesData = routesResponse.data.data ?? []
        const cargoTypesData = cargoTypesResponse.data.data ?? []
        const vehicleTypesData = vehicleTypesResponse.data.data ?? []
        setRoutesCatalog(routesData)
        setCargoTypes(cargoTypesData)
        setVehicleTypes(vehicleTypesData)
        // Inicializar inputs de tarifas vacíos (el agente ingresa la tarifa en su moneda)
        setVehicleRates(
          vehicleTypesData.reduce<Record<number, string>>((acc, vt) => {
            acc[vt.vehicleTypeId] = ""
            return acc
          }, {})
        )
        if (cargoTypesData.length > 0) {
          setCargasPermitidas([cargoTypesData[0].cargoTypeId])
        }
      } catch {
        if (mounted) toast.error("No se pudo cargar el catálogo de rutas y tipos de carga.")
      } finally {
        if (mounted) setCatalogLoading(false)
      }
    }
    loadCatalogs()
    return () => { mounted = false }
  }, [])

  // Client search with debounce
  useEffect(() => {
    if (clienteQuery.length < 3) { setClients([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await api.get<{ data: Client[] }>(`${ENDPOINTS.CLIENTES.LIST}?search=${clienteQuery}`)
        setClients(response.data.data)
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [clienteQuery])

  const selectedRoutes = routesCatalog.filter(r => selectedRouteIds.includes(r.routeId))
  const filteredRoutes = routesCatalog.filter(r => {
    const q = `${r.routeCode} ${r.origin} ${r.destination}`.toLowerCase()
    return q.includes(routeQuery.toLowerCase()) && !selectedRouteIds.includes(r.routeId)
  })

  function toggleCarga(id: number) {
    setCargasPermitidas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function addRoute(routeId: number) {
    setSelectedRouteIds(prev => prev.includes(routeId) ? prev : [...prev, routeId])
    setRouteQuery("")
  }

  function removeRoute(routeId: number) {
    setSelectedRouteIds(prev => prev.filter(id => id !== routeId))
  }

  async function handleSubmit() {
    if (!selectedClient) return toast.error("Debe seleccionar un cliente")
    if (!limiteCredito) return toast.error("Debe definir un límite de crédito")
    const parsedCreditLimit = Number.parseFloat(limiteCredito.replace(/,/g, ""))
    if (!Number.isFinite(parsedCreditLimit) || parsedCreditLimit <= 0) {
      return toast.error("El límite de crédito debe ser un número mayor a 0")
    }

    const parsedPlazoPago = Number.parseInt(plazoPago, 10)
    if (!Number.isInteger(parsedPlazoPago) || parsedPlazoPago <= 0) {
      return toast.error("El plazo de pago debe ser un número entero mayor a 0")
    }

    if (selectedRouteIds.length === 0) return toast.error("Debe seleccionar al menos una ruta autorizada")
    if (cargasPermitidas.length === 0) return toast.error("Debe seleccionar al menos un tipo de carga permitido")

    // Construir tarifas — solo incluir vehículos con tarifa ingresada
    const rates = vehicleTypes
      .filter(vt => {
        const val = vehicleRates[vt.vehicleTypeId]?.trim()
        return val && Number.parseFloat(val) > 0
      })
      .map(vt => ({
        vehicleTypeId: vt.vehicleTypeId,
        baseRatePerKm: Number.parseFloat(vehicleRates[vt.vehicleTypeId]),
        discountPercentage: 0,
      }))

    setLoading(true)
    try {
      await api.post(ENDPOINTS.CONTRATOS.CREATE, {
        clientId: selectedClient.clientId,
        creditLimit: parsedCreditLimit,
        paymentTermDays: parsedPlazoPago,
        discountPercentage: Number.parseFloat(descuentoPorcentaje) || 0,
        routeIds: selectedRouteIds,
        cargoTypeIds: cargasPermitidas,
        rates,
      })
      setSuccessOpen(true)
    } catch {
      // api client handles toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Success overlay */}
      {successOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,12,10,0.72)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ background: "#ffffff", borderRadius: "6px", padding: "3rem 2.5rem", maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(201,146,75,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <ShieldCheck size={22} style={{ color: "#C9924B" }} />
            </div>
            <p style={{ fontSize: "0.52rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
              Contrato formalizado
            </p>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A", marginBottom: "0.75rem" }}>
              Propuesta generada.
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#6B6260", lineHeight: 1.6, marginBottom: "2rem" }}>
              El contrato ha sido generado y se encuentra en estado{" "}
              <strong style={{ color: "#0C0C0A" }}>PENDIENTE DE FIRMA</strong>.
            </p>
            <button
              onClick={() => { setSuccessOpen(false); router.push("/agente-operativo") }}
              style={{
                width: "100%", padding: "0.65rem 1.5rem", borderRadius: "4px",
                background: "#0C0C0A", color: "#F5F2EC",
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", transition: "background 0.15s", border: "none",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#C9924B")}
              onMouseOut={e => (e.currentTarget.style.background = "#0C0C0A")}
            >
              Volver al panel →
            </button>
          </motion.div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-14">

        {/* Back */}
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
            Contrato Comercial
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Formalizar Contrato.
            </motion.h1>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px", alignItems: "start" }}>

          {/* ── Main column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* 1. Client search */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
              style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <Search size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                <span style={sectionLabelStyle}>01 · Selección de Cliente</span>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text" placeholder="Buscar por razón social o NIT…"
                    value={clienteQuery}
                    onChange={e => { setClienteQuery(e.target.value); if (selectedClient) setSelectedClient(null) }}
                    style={{
                      width: "100%", background: "#1E1E1B",
                      border: "1px solid rgba(245,242,236,0.08)", borderRadius: "4px",
                      padding: "0.6rem 2.5rem 0.6rem 0.85rem", color: "#F5F2EC",
                      fontSize: "0.82rem", outline: "none", transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,146,75,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(245,242,236,0.08)")}
                  />
                  <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9A9489", display: "flex" }}>
                    {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  </div>
                </div>

                {clients.length > 0 && !selectedClient && (
                  <div style={{ marginTop: "4px", background: "#1E1E1B", border: "1px solid rgba(245,242,236,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                    {clients.map((c, idx) => (
                      <button key={c.clientId}
                        onClick={() => { setSelectedClient(c); setClienteQuery(c.legalName); setClients([]) }}
                        style={{
                          width: "100%", textAlign: "left", padding: "0.7rem 1rem",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer", background: "transparent", border: "none",
                          borderBottom: idx < clients.length - 1 ? "1px solid rgba(245,242,236,0.05)" : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(201,146,75,0.08)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F5F2EC" }}>{c.legalName}</div>
                          <div style={{ fontSize: "0.62rem", color: "#9A9489", marginTop: "2px" }}>NIT: {c.nit}</div>
                        </div>
                        <span style={{ fontSize: "0.65rem", color: "#C9924B" }}>→</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div style={{ marginTop: "8px", background: "rgba(201,146,75,0.06)", border: "1px solid rgba(201,146,75,0.2)", borderRadius: "4px", padding: "0.7rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#C9924B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={11} style={{ color: "#0C0C0A" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>Cliente seleccionado</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>{selectedClient.legalName}</div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClienteQuery("") }}
                      style={{ color: "#9A9489", cursor: "pointer", background: "none", border: "none", display: "flex", padding: "2px" }}
                      onMouseOver={e => (e.currentTarget.style.color = "#E53E3E")}
                      onMouseOut={e => (e.currentTarget.style.color = "#9A9489")}>
                      <X size={15} />
                    </button>
                  </div>
                )}

                <p style={{ fontSize: "0.58rem", color: "#9A9489", marginTop: "8px" }}>
                  El cliente debe estar previamente registrado en la plataforma.
                </p>
              </div>
            </motion.div>

            {/* 2. Financial conditions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6, ease: EASE }}
              style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <DollarSign size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                <span style={sectionLabelStyle}>02 · Condiciones Financieras</span>
              </div>

              <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {/* Límite de crédito en la moneda del cliente */}
                <div>
                  <span style={{ ...sectionLabelStyle, display: "block", marginBottom: "8px" }}>
                    Límite de Crédito ({selectedCurrency})
                  </span>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.82rem", fontWeight: 700, color: "#9A9489", pointerEvents: "none" }}>{selectedCurrencySymbol}</span>
                    <Input label="" placeholder="10,000.00" inputMode="numeric"
                      value={limiteCredito} onChange={e => setLimiteCredito(e.target.value)}
                      className="pl-8" />
                  </div>
                </div>

                {/* Plazo de pago — campo libre, cualquier número de días */}
                <div>
                  <span style={{ ...sectionLabelStyle, display: "block", marginBottom: "8px" }}>
                    Plazo de Pago (días)
                  </span>
                  <div style={{ position: "relative" }}>
                    <Calendar size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="ej. 30"
                      value={plazoPago}
                      onChange={e => setPlazoPago(e.target.value)}
                      style={{
                        width: "100%", paddingLeft: "2.2rem", paddingRight: "0.75rem",
                        paddingTop: "0.6rem", paddingBottom: "0.6rem",
                        background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.12)",
                        borderRadius: "4px", color: "#0C0C0A",
                        fontSize: "0.85rem", fontWeight: 700, outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#C9924B")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
                    />
                  </div>
                  <p style={{ fontSize: "0.55rem", color: "#9A9489", marginTop: "5px" }}>
                    Ingrese cualquier valor en días (ej. 15, 30, 45, 60, 90…)
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 3. Tarifas por tipo de vehículo — en la moneda del contrato */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.6, ease: EASE }}
              style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <Truck size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                <span style={sectionLabelStyle}>03 · Tarifas por Tipo de Vehículo ({selectedCurrency})</span>
              </div>

              <div style={{ padding: "1.5rem" }}>
                {catalogLoading ? (
                  <p style={{ fontSize: "0.65rem", color: "#9A9489" }}>Cargando tipos de vehículo…</p>
                ) : vehicleTypes.length === 0 ? (
                  <p style={{ fontSize: "0.65rem", color: "#9A9489" }}>No hay tipos de vehículo registrados.</p>
                ) : (
                  <>
                    <p style={{ fontSize: "0.62rem", color: "#9A9489", marginBottom: "1rem", lineHeight: 1.6 }}>
                      Defina la tarifa por km para cada tipo de vehículo en{" "}
                      <strong style={{ color: "#0C0C0A" }}>{selectedCurrency}</strong>.
                      Los campos vacíos no se incluyen en el contrato.
                      La columna <em>Ref. USD</em> muestra la tarifa base global como referencia.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {vehicleTypes.map(vt => (
                        <div key={vt.vehicleTypeId} style={{
                          background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.07)",
                          borderRadius: "4px", padding: "0.9rem 1rem",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                            <div>
                              <p style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>{vt.typeCode}</p>
                              <p style={{ fontSize: "0.82rem", fontWeight: 900, color: "#0C0C0A", lineHeight: 1.2 }}>{vt.typeName}</p>
                              <p style={{ fontSize: "0.58rem", color: "#9A9489", marginTop: "2px" }}>
                                {vt.maxCapacityTon ? `${vt.minCapacityTon}–${vt.maxCapacityTon} ton` : `${vt.minCapacityTon}+ ton`}
                              </p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: "0.48rem", color: "#9A9489", letterSpacing: "0.15em", textTransform: "uppercase" }}>Ref. USD</p>
                              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9A9489" }}>${Number(vt.ratePerKm).toFixed(2)}/km</p>
                            </div>
                          </div>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", fontWeight: 700, color: "#9A9489", pointerEvents: "none" }}>
                              {selectedCurrencySymbol}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00 /km"
                              value={vehicleRates[vt.vehicleTypeId] ?? ""}
                              onChange={e => setVehicleRates(prev => ({ ...prev, [vt.vehicleTypeId]: e.target.value }))}
                              style={{
                                width: "100%", paddingLeft: "1.6rem", paddingRight: "0.6rem",
                                paddingTop: "0.45rem", paddingBottom: "0.45rem",
                                background: "#ffffff", border: "1px solid rgba(12,12,10,0.12)",
                                borderRadius: "4px", color: "#0C0C0A",
                                fontSize: "0.82rem", fontWeight: 700, outline: "none",
                                transition: "border-color 0.15s",
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = "#C9924B")}
                              onBlur={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* 3. Operational scope */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.49, duration: 0.6, ease: EASE }}
              style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                <span style={sectionLabelStyle}>04 · Alcance Operativo</span>
              </div>

              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Route search */}
                <div>
                  <span style={{ ...sectionLabelStyle, display: "block", marginBottom: "8px" }}>Rutas Autorizadas del Contrato</span>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder={catalogLoading ? "Cargando rutas…" : "Buscar por código, origen o destino"}
                      value={routeQuery}
                      onChange={e => setRouteQuery(e.target.value)}
                      disabled={catalogLoading}
                      style={{
                        width: "100%", background: "#1E1E1B",
                        border: "1px solid rgba(245,242,236,0.08)", borderRadius: "4px",
                        padding: "0.6rem 2.5rem 0.6rem 0.85rem", color: "#F5F2EC",
                        fontSize: "0.82rem", outline: "none", transition: "border-color 0.15s",
                        opacity: catalogLoading ? 0.5 : 1,
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,146,75,0.4)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(245,242,236,0.08)")}
                    />
                    <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9A9489", display: "flex" }}>
                      {catalogLoading && <Loader2 size={13} className="animate-spin" />}
                    </div>
                  </div>

                  {routeQuery.trim().length > 0 && filteredRoutes.length > 0 && (
                    <div style={{ marginTop: "4px", background: "#1E1E1B", border: "1px solid rgba(245,242,236,0.08)", borderRadius: "4px", overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
                      {filteredRoutes.map((route, idx) => (
                        <button key={route.routeId} type="button" onClick={() => addRoute(route.routeId)}
                          style={{
                            width: "100%", textAlign: "left", padding: "0.65rem 1rem",
                            cursor: "pointer", background: "transparent", border: "none",
                            borderBottom: idx < filteredRoutes.length - 1 ? "1px solid rgba(245,242,236,0.05)" : "none",
                            transition: "background 0.1s",
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = "rgba(201,146,75,0.08)")}
                          onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F5F2EC" }}>{route.routeCode}</div>
                          <div style={{ fontSize: "0.62rem", color: "#9A9489", marginTop: "2px" }}>{route.origin} → {route.destination}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRoutes.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                      {selectedRoutes.map(route => (
                        <button key={route.routeId} type="button" onClick={() => removeRoute(route.routeId)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "0.3rem 0.7rem", borderRadius: "4px",
                            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em",
                            background: "#0C0C0A", color: "#F5F2EC", border: "none",
                            cursor: "pointer", transition: "background 0.15s",
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = "#E53E3E")}
                          onMouseOut={e => (e.currentTarget.style.background = "#0C0C0A")}
                          title="Quitar ruta"
                        >
                          {route.routeCode} <X size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cargo types */}
                <div>
                  <span style={{ ...sectionLabelStyle, display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <Truck size={11} /> Tipos de Carga Permitida
                  </span>
                  {catalogLoading ? (
                    <p style={{ fontSize: "0.65rem", color: "#9A9489" }}>Cargando tipos de carga…</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {cargoTypes.map((opt) => {
                        const sel = cargasPermitidas.includes(opt.cargoTypeId)
                        return (
                          <button key={opt.cargoTypeId} type="button" onClick={() => toggleCarga(opt.cargoTypeId)}
                            style={{
                              padding: "0.4rem 0.9rem", borderRadius: "4px",
                              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                              textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
                              background: sel ? "#0C0C0A" : "transparent",
                              color: sel ? "#F5F2EC" : "#9A9489",
                              border: `1px solid ${sel ? "transparent" : "rgba(12,12,10,0.12)"}`,
                            }}
                            onMouseOver={e => { if (!sel) { e.currentTarget.style.color = "#0C0C0A"; e.currentTarget.style.borderColor = "rgba(12,12,10,0.3)" } }}
                            onMouseOut={e => { if (!sel) { e.currentTarget.style.color = "#9A9489"; e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)" } }}
                          >
                            {opt.cargoName}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "1.5rem" }}>

            {/* Discounts */}
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
              style={{ background: "#1E1E1B", border: "1px solid rgba(245,242,236,0.06)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(245,242,236,0.06)", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <Percent size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                <span style={{ ...sectionLabelStyle, color: "#9A9489" }}>Descuentos</span>
              </div>

              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>Porcentaje (%)</span>
                  <input type="text" inputMode="numeric" placeholder="0.00"
                    value={descuentoPorcentaje} onChange={e => setDescuentoPorcentaje(e.target.value)}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(245,242,236,0.1)", color: "#F5F2EC", fontSize: "0.82rem", padding: "4px 0", outline: "none", transition: "border-color 0.15s" }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")}
                  />
                </div>
                <div>
                  <span style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>Justificación</span>
                  <textarea placeholder="Motivo del descuento especial…"
                    value={descuentoJustificacion} onChange={e => setDescuentoJustificacion(e.target.value)}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(245,242,236,0.1)", color: "#F5F2EC", fontSize: "0.78rem", padding: "4px 0", outline: "none", resize: "vertical", minHeight: "80px", lineHeight: 1.6, transition: "border-color 0.15s" }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "#C9924B")}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(245,242,236,0.1)")}
                  />
                </div>
              </div>
            </motion.div>

            {/* Summary + submit */}
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.58, duration: 0.6, ease: EASE }}
              style={{ background: "#0C0C0A", border: "1px solid rgba(245,242,236,0.06)", borderRadius: "6px", overflow: "hidden" }}>

              <div style={{ borderBottom: "1px solid rgba(245,242,236,0.06)", padding: "1.1rem 1.5rem" }}>
                <span style={{ fontSize: "0.52rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
                  Resumen del Contrato
                </span>
              </div>

              <div style={{ padding: "1.5rem" }}>
                {[
                  { label: "Cliente", value: selectedClient?.legalName ?? "—" },
                  { label: "Moneda", value: selectedCurrency },
                  { label: "Límite", value: limiteCredito ? `${selectedCurrencySymbol} ${limiteCredito}` : "—" },
                  { label: "Plazo", value: plazoPago ? `${plazoPago} días` : "—" },
                  { label: "Rutas", value: selectedRouteIds.length ? `${selectedRouteIds.length} ruta${selectedRouteIds.length > 1 ? "s" : ""}` : "—" },
                  { label: "Tarifas", value: Object.values(vehicleRates).filter(v => v && Number(v) > 0).length ? `${Object.values(vehicleRates).filter(v => v && Number(v) > 0).length} tipo${Object.values(vehicleRates).filter(v => v && Number(v) > 0).length > 1 ? "s" : ""}` : "—" },
                  { label: "Descuento", value: descuentoPorcentaje ? `${descuentoPorcentaje}%` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                    <span style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "rgba(245,242,236,0.35)", textTransform: "uppercase", fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F5F2EC", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>{value}</span>
                  </div>
                ))}

                <div style={{ height: "1px", background: "rgba(245,242,236,0.06)", margin: "1.25rem 0" }} />

                <button onClick={handleSubmit} disabled={loading}
                  style={{
                    width: "100%", padding: "0.7rem", borderRadius: "4px",
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "#3A3A37" : "#C9924B", color: "#0C0C0A",
                    border: "none", transition: "background 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#B8813C" }}
                  onMouseOut={e => { if (!loading) e.currentTarget.style.background = "#C9924B" }}
                >
                  {loading ? <Loader2 size={11} className="animate-spin" /> : null}
                  Generar Propuesta →
                </button>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  )
}
