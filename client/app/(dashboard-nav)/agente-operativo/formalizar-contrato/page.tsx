"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { FileText, Search, Send, MapPin, Truck, DollarSign, Percent, ChevronRight, ShieldCheck, Loader2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"

type PlazoPago = 15 | 30 | 45

export interface Client {
  clientId: number
  legalName: string
  commercialName: string
  nit: string
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
  const [plazoPago, setPlazoPago] = useState<PlazoPago>(30)
  const [cargoTypes, setCargoTypes] = useState<CargoTypeItem[]>([])
  const [cargasPermitidas, setCargasPermitidas] = useState<number[]>([])
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState("")
  const [descuentoJustificacion, setDescuentoJustificacion] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Cargar catálogos desde DB: rutas y tipos de carga válidos.
  useEffect(() => {
    let mounted = true

    async function loadCatalogs() {
      setCatalogLoading(true)
      try {
        const [routesResponse, cargoTypesResponse] = await Promise.all([
          api.get<{ data: RouteItem[] }>(ENDPOINTS.OPERATIONS.ROUTES),
          api.get<{ data: CargoTypeItem[] }>(ENDPOINTS.OPERATIONS.CARGO_TYPES),
        ])

        if (!mounted) return

        const routesData = routesResponse.data.data ?? []
        const cargoTypesData = cargoTypesResponse.data.data ?? []

        setRoutesCatalog(routesData)
        setCargoTypes(cargoTypesData)

        if (cargoTypesData.length > 0) {
          setCargasPermitidas([cargoTypesData[0].cargoTypeId])
        }
      } catch {
        if (mounted) {
          toast.error("No se pudo cargar el catálogo de rutas y tipos de carga.")
        }
      } finally {
        if (mounted) {
          setCatalogLoading(false)
        }
      }
    }

    loadCatalogs()
    return () => {
      mounted = false
    }
  }, [])

  // Búsqueda de clientes con debounce.
  useEffect(() => {
    if (clienteQuery.length < 3) {
      setClients([])
      return
    }

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

  const selectedRoutes = routesCatalog.filter((route) => selectedRouteIds.includes(route.routeId))

  const filteredRoutes = routesCatalog.filter((route) => {
    const matchesQuery = `${route.routeCode} ${route.origin} ${route.destination}`
      .toLowerCase()
      .includes(routeQuery.toLowerCase())

    return matchesQuery && !selectedRouteIds.includes(route.routeId)
  })

  function toggleCarga(id: number) {
    setCargasPermitidas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function addRoute(routeId: number) {
    setSelectedRouteIds((prev) => (prev.includes(routeId) ? prev : [...prev, routeId]))
    setRouteQuery("")
  }

  function removeRoute(routeId: number) {
    setSelectedRouteIds((prev) => prev.filter((id) => id !== routeId))
  }

  async function handleSubmit() {
    if (!selectedClient) return toast.error("Debe seleccionar un cliente")
    if (!limiteCredito) return toast.error("Debe definir un límite de crédito")

    const parsedCreditLimit = Number.parseFloat(limiteCredito.replace(/,/g, ""))
    if (!Number.isFinite(parsedCreditLimit) || parsedCreditLimit <= 0) {
      return toast.error("El límite de crédito debe ser un número mayor a 0")
    }

    if (selectedRouteIds.length === 0) {
      return toast.error("Debe seleccionar al menos una ruta autorizada")
    }

    if (cargasPermitidas.length === 0) {
      return toast.error("Debe seleccionar al menos un tipo de carga permitido")
    }

    setLoading(true)
    try {
      const payload = {
        clientId: selectedClient.clientId,
        creditLimit: parsedCreditLimit,
        paymentTermDays: plazoPago,
        discountPercentage: Number.parseFloat(descuentoPorcentaje) || 0,
        routeIds: selectedRouteIds,
        cargoTypeIds: cargasPermitidas,
      }

      await api.post(ENDPOINTS.CONTRATOS.CREATE, payload)
      setSuccessOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />

      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-16 flex flex-col max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-[#0A3B7C]">Formalización de Contrato</h1>
          <p className="text-[#64748B] mt-2 text-lg">Configura los términos operativos y financieros para el nuevo cliente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <Card className="p-10 rounded-3xl shadow-xl bg-white/95 backdrop-blur-md border-black/5">
              <h2 className="text-2xl font-heading font-bold text-[#0A3B7C] flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <Search className="text-[#53B73E]" size={28} />
                1. Selección de Cliente
              </h2>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#64748B]">
                  <Search size={22} />
                </span>
                <Input
                  label=""
                  placeholder="Buscar Razón Social o NIT del cliente registrado"
                  value={clienteQuery}
                  onChange={(e) => {
                    setClienteQuery(e.target.value)
                    if (selectedClient) setSelectedClient(null)
                  }}
                  className="pl-14 py-4 bg-surface/30 border-none shadow-inner text-lg rounded-2xl"
                />

                {searching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-[#0A3B7C]" size={20} />
                  </div>
                )}
              </div>

              {clients.length > 0 && !selectedClient && (
                <div className="mt-4 bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  {clients.map((c) => (
                    <button
                      key={c.clientId}
                      className="w-full text-left p-4 hover:bg-[#0A3B7C]/5 flex items-center justify-between group transition-colors"
                      onClick={() => {
                        setSelectedClient(c)
                        setClienteQuery(c.legalName)
                        setClients([])
                      }}
                    >
                      <div>
                        <div className="font-bold text-[#0A3B7C]">{c.legalName}</div>
                        <div className="text-xs text-[#64748B]">NIT: {c.nit}</div>
                      </div>
                      <ChevronRight size={18} className="text-[#64748B] group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div className="mt-4 p-4 bg-[#53B73E]/10 rounded-2xl border border-[#53B73E]/20 flex items-center justify-between animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#53B73E] rounded-lg">
                      <Check size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#53B73E] uppercase tracking-wider">Cliente Seleccionado</div>
                      <div className="font-bold text-[#0A3B7C]">{selectedClient.legalName}</div>
                    </div>
                  </div>
                  <button
                    className="text-[#64748B] hover:text-[#E53E3E] p-2"
                    onClick={() => {
                      setSelectedClient(null)
                      setClienteQuery("")
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <p className="text-sm text-[#64748B] mt-4 ml-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#53B73E]"></span>
                El cliente debe estar previamente dado de alta en la plataforma.
              </p>
            </Card>

            <Card className="p-10 rounded-3xl shadow-xl bg-white/95 backdrop-blur-md border-black/5">
              <h2 className="text-2xl font-heading font-bold text-[#0A3B7C] flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <DollarSign className="text-[#53B73E]" size={28} />
                2. Condiciones Financieras
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1">Límite de Crédito (GTQ)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[#0A3B7C] font-bold text-xl">
                      Q
                    </span>
                    <Input
                      label=""
                      placeholder="10,000.00"
                      inputMode="numeric"
                      value={limiteCredito}
                      onChange={(e) => setLimiteCredito(e.target.value)}
                      className="pl-12 py-4 text-xl font-bold bg-surface/30 border-none shadow-inner rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1">Plazo de Pago</label>
                  <div className="flex bg-surface/40 p-1.5 rounded-2xl border border-black/5">
                    {([15, 30, 45] as const).map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => setPlazoPago(dias)}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                          plazoPago === dias ? "bg-white text-[#0A3B7C] shadow-md border-black/5" : "text-[#64748B] hover:text-[#0A3B7C] hover:bg-white/50"
                        }`}
                      >
                        {dias} Días
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-10 rounded-3xl shadow-xl bg-white/95 backdrop-blur-md border-black/5">
              <h2 className="text-2xl font-heading font-bold text-[#0A3B7C] flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <MapPin className="text-[#53B73E]" size={28} />
                3. Alcance Operativo
              </h2>
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1">Rutas Autorizadas</label>
                  <div className="relative">
                    <Input
                      label=""
                      placeholder={catalogLoading ? "Cargando rutas..." : "Buscar por código, origen o destino"}
                      value={routeQuery}
                      onChange={(e) => setRouteQuery(e.target.value)}
                      className="py-4 bg-surface/30 border-none shadow-inner text-lg rounded-2xl"
                      disabled={catalogLoading}
                    />
                    {catalogLoading && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-[#0A3B7C]" size={20} />
                      </div>
                    )}
                  </div>

                  {routeQuery.trim().length > 0 && filteredRoutes.length > 0 && (
                    <div className="bg-white border border-black/5 rounded-2xl shadow-xl max-h-52 overflow-auto">
                      {filteredRoutes.map((route) => (
                        <button
                          key={route.routeId}
                          type="button"
                          className="w-full text-left p-3 hover:bg-[#0A3B7C]/5 transition-colors"
                          onClick={() => addRoute(route.routeId)}
                        >
                          <div className="font-bold text-[#0A3B7C]">{route.routeCode}</div>
                          <div className="text-sm text-[#64748B]">
                            {route.origin} - {route.destination}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRoutes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedRoutes.map((route) => (
                        <button
                          key={route.routeId}
                          type="button"
                          onClick={() => removeRoute(route.routeId)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0A3B7C]/10 text-[#0A3B7C] font-semibold"
                        >
                          <span>{route.routeCode}</span>
                          <X size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Truck size={18} className="text-[#53B73E]" /> Tipos de Carga Permitida
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {cargoTypes.map((opt) => {
                      const selected = cargasPermitidas.includes(opt.cargoTypeId)
                      return (
                        <button
                          key={opt.cargoTypeId}
                          type="button"
                          onClick={() => toggleCarga(opt.cargoTypeId)}
                          className={`p-4 text-xs font-bold rounded-2xl border-2 transition-all uppercase tracking-wider ${
                            selected
                              ? "border-[#53B73E] bg-[#53B73E]/10 text-[#53B73E] shadow-sm"
                              : "border-black/5 text-[#64748B] hover:border-[#0A3B7C]/40 hover:bg-surface/50"
                          }`}
                        >
                          {opt.cargoName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-10">
            <Card className="bg-[#f0f4f8] border-none shadow-md p-10 rounded-3xl">
              <h2 className="text-2xl font-heading font-bold text-[#0A3B7C] flex items-center gap-3 mb-6">
                <Percent className="text-[#53B73E]" size={28} />
                Descuentos
              </h2>
              <p className="text-sm text-[#64748B] mb-8 font-medium leading-relaxed">
                Aplica beneficios contractuales especiales por volumen de carga o fidelidad.
              </p>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1">Porcentaje (%)</label>
                  <Input
                    label=""
                    placeholder="0.00"
                    inputMode="numeric"
                    value={descuentoPorcentaje}
                    onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                    className="bg-white py-4 font-bold text-xl rounded-2xl border-none shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1">Justificación</label>
                  <textarea
                    className="w-full bg-white border-none rounded-2xl p-6 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 min-h-[140px] shadow-inner"
                    placeholder="Motivo del descuento especial..."
                    value={descuentoJustificacion}
                    onChange={(e) => setDescuentoJustificacion(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </Card>

            <Card className="bg-[#0A3B7C] text-white p-10 border-none shadow-2xl rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

              <h3 className="font-heading font-extrabold text-2xl mb-8 flex items-center gap-3 !text-white">
                <FileText size={28} className="text-[#53B73E]" />
                Resumen Final
              </h3>

              <div className="space-y-6 text-base mb-10 border-b border-white/10 pb-8">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Límite:</span>
                  <span className="font-extrabold text-xl text-white">Q {limiteCredito || "0"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Plazo:</span>
                  <span className="font-extrabold text-xl text-white">{plazoPago} Días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Rutas:</span>
                  <span className="font-extrabold text-xl text-white">{selectedRoutes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Descuento:</span>
                  <span className="font-extrabold text-xl text-[#53B73E]">{descuentoPorcentaje || "0"}%</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-[#53B73E] text-white hover:bg-[#3A8E2A] border-none shadow-xl py-6 rounded-2xl font-bold flex items-center justify-center gap-3 group"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
              >
                Generar Propuesta
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Card>
          </div>
        </div>

        <Modal open={successOpen} onClose={() => setSuccessOpen(false)}>
          <div className="py-10 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-[#53B73E]/15 flex flex-col items-center justify-center mb-8">
              <ShieldCheck className="text-[#53B73E]" size={48} />
            </div>

            <h2 className="text-3xl font-heading font-extrabold text-[#0A3B7C]">¡Contrato Formalizado!</h2>
            <p className="text-[#64748B] mt-5 max-w-sm mx-auto text-lg leading-relaxed">
              El contrato comercial ha sido generado y se encuentra en estado <span className="font-extrabold text-[#0A3B7C]">PENDIENTE DE FIRMA</span>.
            </p>

            <div className="mt-12">
              <Button
                className="w-full sm:w-auto min-w-[240px] bg-[#0A3B7C] text-white hover:bg-[#083066] font-bold py-4 rounded-2xl"
                onClick={() => {
                  setSuccessOpen(false)
                  router.push("/agente-operativo")
                }}
              >
                Cerrar y Regresar al Panel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
