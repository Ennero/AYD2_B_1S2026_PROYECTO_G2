"use client"

import { useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { FileText, Search, Send, MapPin, Truck, DollarSign, Percent } from "lucide-react"
import { useRouter } from "next/navigation"

type PlazoPago = 15 | 30 | 45

const cargaOptions = ["Carga General", "Perecederos", "Construcción", "Peligrosa"] as const
type CargaOption = (typeof cargaOptions)[number]

export default function FormalizarContratoPage() {
  const router = useRouter()
  const [clienteQuery, setClienteQuery] = useState("")
  const [limiteCredito, setLimiteCredito] = useState("")
  const [rutasAutorizadas, setRutasAutorizadas] = useState("")
  const [plazoPago, setPlazoPago] = useState<PlazoPago>(30)
  const [cargasPermitidas, setCargasPermitidas] = useState<CargaOption[]>(["Carga General"])
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState("")
  const [descuentoJustificacion, setDescuentoJustificacion] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)

  const isCargaSelected = useMemo(() => {
    const selected = new Set(cargasPermitidas)
    return (opt: CargaOption) => selected.has(opt)
  }, [cargasPermitidas])

  function toggleCarga(opt: CargaOption) {
    setCargasPermitidas((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }

  function handleSubmit() {
    setSuccessOpen(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary">Formalización de Contrato</h1>
        <p className="text-text-muted mt-2">Configura los términos operativos y financieros para el nuevo cliente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Form) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold text-primary flex items-center gap-2 mb-6">
              <Search className="text-secondary" size={20} />
              1. Selección de Cliente
            </h2>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Search size={18} />
              </span>
              <Input
                label=""
                placeholder="Buscar Razón Social o NIT"
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                className="pl-11 bg-surface border-none shadow-inner"
              />
            </div>
            <p className="text-xs text-text-muted mt-2 ml-2">El cliente debe estar dado de alta en la plataforma.</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold text-primary flex items-center gap-2 mb-6">
              <DollarSign className="text-secondary" size={20} />
              2. Condiciones Financieras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Límite de Crédito (GTQ)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    Q
                  </span>
                  <Input
                    label=""
                    placeholder="10,000.00"
                    inputMode="numeric"
                    value={limiteCredito}
                    onChange={(e) => setLimiteCredito(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Plazo de Pago</label>
                <div className="flex bg-surface p-1 rounded-xl">
                  {([15, 30, 45] as const).map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => setPlazoPago(dias)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plazoPago === dias ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {dias} Días
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold text-primary flex items-center gap-2 mb-6">
              <MapPin className="text-secondary" size={20} />
              3. Alcance Operativo
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Rutas Autorizadas</label>
                <Input
                  label=""
                  placeholder="Ej. GT-Xela, GT-Peten"
                  value={rutasAutorizadas}
                  onChange={(e) => setRutasAutorizadas(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Truck size={16} className="text-text-muted" /> Tipos de Carga Permitidos
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {cargaOptions.map((opt) => {
                    const selected = isCargaSelected(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleCarga(opt)}
                        className={`p-3 text-sm font-medium rounded-xl border text-center transition-all ${
                          selected 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-black/10 text-text-muted hover:border-black/20 hover:bg-surface"
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column (Sidebar form & Submit) */}
        <div className="space-y-6">
          <Card className="bg-surface border-none shadow-sm p-6">
            <h2 className="text-lg font-heading font-semibold text-primary flex items-center gap-2 mb-4">
              <Percent className="text-secondary" size={20} />
              Descuentos
            </h2>
            <p className="text-xs text-text-muted mb-4">Aplica beneficios especiales sujetos a volumen de carga.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Porcentaje (%)</label>
                <Input
                  label=""
                  placeholder="0.00"
                  inputMode="numeric"
                  value={descuentoPorcentaje}
                  onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Justificación</label>
                <textarea 
                  className="w-full bg-white border border-black/10 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                  placeholder="Ej. Cliente VIP, alto volumen..."
                  value={descuentoJustificacion}
                  onChange={(e) => setDescuentoJustificacion(e.target.value)}
                ></textarea>
              </div>
            </div>
          </Card>

          <Card className="bg-primary text-white p-6 border-none shadow-lg">
            <h3 className="font-heading font-semibold text-lg mb-2">Resumen Final</h3>
            <ul className="space-y-2 text-sm text-white/80 mb-6">
              <li className="flex justify-between"><span>Límite:</span> <span className="font-medium text-white">Q {limiteCredito || "0"}</span></li>
              <li className="flex justify-between"><span>Plazo:</span> <span className="font-medium text-white">{plazoPago} Días</span></li>
              <li className="flex justify-between"><span>Descuento:</span> <span className="font-medium text-white">{descuentoPorcentaje || "0"}%</span></li>
            </ul>
            
            <Button 
              type="button" 
              className="w-full bg-accent text-primary hover:bg-accent/90" 
              size="lg"
              onClick={handleSubmit}
            >
              Generar Propuesta
              <Send size={18} className="ml-2" />
            </Button>
          </Card>
        </div>

      </div>

      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)}>
        <div className="py-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-accent/20 flex flex-col items-center justify-center mb-6">
            <FileText className="text-accent" size={36} />
          </div>

          <h2 className="text-2xl font-heading font-bold text-primary">¡Contrato Generado!</h2>
          <p className="text-text-muted mt-3 max-w-sm mx-auto">
            El contrato digital está en estado <span className="font-semibold text-primary">PENDIENTE</span>. 
            Se ha enviado una notificación al cliente para su revisión.
          </p>

          <div className="mt-8">
            <Button
              className="w-full sm:w-auto min-w-[200px]"
              onClick={() => {
                setSuccessOpen(false)
                router.push("/agente-operativo")
              }}
            >
              Cerrar y Volver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
