"use client"

import { useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { FileText, Search, Send, MapPin, Truck, DollarSign, Percent, ChevronRight, ShieldCheck } from "lucide-react"
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
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* HD Minimalist Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />
      
      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-16 flex flex-col max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-[#0A3B7C]">Formalización de Contrato</h1>
          <p className="text-[#64748B] mt-2 text-lg">Configura los términos operativos y financieros para el nuevo cliente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column (Main Form) */}
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
                  onChange={(e) => setClienteQuery(e.target.value)}
                  className="pl-14 py-4 bg-surface/30 border-none shadow-inner text-lg rounded-2xl"
                />
              </div>
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
                  <Input
                    label=""
                    placeholder="Ej. GT-Puerto Quetzal, GT-Tecún Umán, SV-Acajutla"
                    value={rutasAutorizadas}
                    onChange={(e) => setRutasAutorizadas(e.target.value)}
                    className="py-4 bg-surface/30 border-none shadow-inner text-lg rounded-2xl"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Truck size={18} className="text-[#53B73E]" /> Tipos de Carga Permitida
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {cargaOptions.map((opt) => {
                      const selected = isCargaSelected(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleCarga(opt)}
                          className={`p-4 text-xs font-bold rounded-2xl border-2 transition-all uppercase tracking-wider ${
                            selected 
                              ? "border-[#53B73E] bg-[#53B73E]/10 text-[#53B73E] shadow-sm" 
                              : "border-black/5 text-[#64748B] hover:border-[#0A3B7C]/40 hover:bg-surface/50"
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
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Descuento:</span>
                  <span className="font-extrabold text-xl text-[#53B73E]">{descuentoPorcentaje || "0"}%</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                className="w-full bg-[#53B73E] text-white hover:bg-[#3A8E2A] border-none shadow-xl py-6 rounded-2xl font-bold flex items-center justify-center gap-3 group" 
                size="lg"
                onClick={handleSubmit}
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
