/** Aquí implementar formulario de Formalización de Contrato
 *
 * Pantalla: Formalización de Contrato
 * Wireframes: Wireframe-26 (dos cuadros)
 *
 * Secciones del formulario:
 * 1. Buscar Cliente Registrado (autocomplete/select)
 * 2. Límite de Crédito, Rutas Autorizadas
 * 3. Plazo de Pago (30 días, 45 días)
 * 4. Tipos de Carga Permitidas (carga pesada, contenedores, peligrosa)
 * 5. Aplicar Descuento: porcentaje + descripción
 *
 * Componentes sugeridos: Input, Select, Button, Card
 * Ruta sugerida: POST /api/v1/contratos
 *
 * Botón final: "Generar y Enviar Propuesta al Cliente"
 * Al completar → redirigir a /agente-operativo/contrato-generado
 */

"use client"

import { useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { FileText, Search, Send } from "lucide-react"
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
    // TODO: integrar POST /api/v1/contratos cuando exista el endpoint.
    console.log("Formalizar contrato:", {
      clienteQuery,
      limiteCredito,
      rutasAutorizadas,
      plazoPago,
      cargasPermitidas,
      descuentoPorcentaje,
      descuentoJustificacion,
    })

    setSuccessOpen(true)
  }

  return (
    <div className="space-y-8">
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="-mx-6 -mt-4 mb-6 h-1.5 bg-secondary" />

        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
            <FileText className="text-secondary" size={28} />
          </div>

          <h2 className="mt-5">Contrato Generado</h2>
          <p className="text-text-muted text-small mt-2">
            El contrato digital está en estado <span className="font-semibold">PENDIENTE</span>. El cliente debe
            ingresar a su portal para revisarlo y aceptarlo.
          </p>

          <div className="mt-6">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setSuccessOpen(false)
                router.push("/agente-operativo")
              }}
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </Modal>

      <div className="text-center">
        <h1>Formalización de Contrato</h1>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-5xl rounded-2xl p-8 sm:p-10">
          <Card variant="surface" className="rounded-2xl p-6 sm:p-7">
            <h3 className="text-lg">Buscar Cliente Registrado</h3>

            <div className="mt-4 relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Search size={18} />
              </span>
              <Input
                label=""
                placeholder="Buscar Razón Social o NIT"
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                className="pl-11 bg-white"
              />
              {/*
                TODO:
                Cuando se implemente la búsqueda interactiva, aquí irá un dropdown
                con coincidencias según clienteQuery (autocomplete/select).
              */}
            </div>
          </Card>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-base">Límite de Crédito</h3>
                <div className="mt-3 relative">
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <Search size={18} />
                  </span>
                  <Input
                    label=""
                    placeholder="10000"
                    inputMode="numeric"
                    value={limiteCredito}
                    onChange={(e) => setLimiteCredito(e.target.value)}
                    className="pr-11"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base">Plazo de Pago</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  {([15, 30, 45] as const).map((dias) => {
                    const selected = plazoPago === dias
                    return (
                      <Button
                        key={dias}
                        type="button"
                        variant={selected ? "primary" : "outline"}
                        className="rounded-full px-8"
                        onClick={() => setPlazoPago(dias)}
                      >
                        {dias} Días
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-8 lg:border-l lg:border-black/10 lg:pl-8">
              <div>
                <h3 className="text-base">Rutas Autorizadas</h3>
                <div className="mt-3">
                  <Input
                    label=""
                    placeholder="Rutas"
                    value={rutasAutorizadas}
                    onChange={(e) => setRutasAutorizadas(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base">Tipos de Carga Permitidos</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {cargaOptions.map((opt) => {
                    const selected = isCargaSelected(opt)
                    return (
                      <Button
                        key={opt}
                        type="button"
                        variant={selected ? "surface" : "outline"}
                        className="w-full rounded-xl"
                        onClick={() => toggleCarga(opt)}
                      >
                        {opt}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <Card variant="primary" className="mt-10 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="text-lg font-semibold">Aplicar Descuento</div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
                <Input
                  label=""
                  placeholder="Porcentaje %"
                  inputMode="numeric"
                  value={descuentoPorcentaje}
                  onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                  className="bg-white"
                />
                <Input
                  label=""
                  placeholder="Justificación"
                  value={descuentoJustificacion}
                  onChange={(e) => setDescuentoJustificacion(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </Card>

          <div className="mt-10 flex justify-end">
            <Button type="button" size="lg" className="w-full max-w-xl" onClick={handleSubmit}>
              Generar y Enviar Propuesta al Cliente
              <Send size={18} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
