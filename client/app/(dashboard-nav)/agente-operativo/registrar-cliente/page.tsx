"use client"

import Stepper from "@/components/shared/Stepper"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import Select from "@/components/ui/Select"
import { useMemo, useState } from "react"
import { UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"

type FormState = {
  nombre: string
  telefono: string
  correo: string
  razonSocial: string
  direccion: string
  nit: string
  capacidadPago: string
  riesgoMercancia: string
  riesgoAduanas: string
  lavadoDinero: string
}

type RiskLevel = "BAJO" | "MEDIO" | "ALTO" | "CRITICO"

type CreateClientResponse = {
  message: string
  data: {
    clientId: string
    clientCode: string
    legalName: string
    nit: string
    primaryContactEmail: string
  }
}

export default function RegistrarClientePage() {
  const router = useRouter()
  const steps = useMemo(() => ["Datos Generales", "Datos Fiscales", "Perfil de Riesgo"], [])
  const [currentStep, setCurrentStep] = useState(0)
  const [successOpen, setSuccessOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState<FormState>({
    nombre: "",
    telefono: "",
    correo: "",
    razonSocial: "",
    direccion: "",
    nit: "",
    capacidadPago: "",
    riesgoMercancia: "",
    riesgoAduanas: "",
    lavadoDinero: "",
  })

  const canGoBack = currentStep > 0
  const canGoNext = currentStep < steps.length - 1
  const isLastStep = currentStep === steps.length - 1

  const riskOptions = useMemo(
    () => [
      { value: "bajo", label: "Bajo" },
      { value: "medio", label: "Medio" },
      { value: "alto", label: "Alto" },
    ],
    []
  )

  const capacidadPagoOptions = useMemo(
    () => [
      { value: "baja", label: "Baja" },
      { value: "media", label: "Media" },
      { value: "alta", label: "Alta" },
    ],
    []
  )

  function toRiskLevel(value: string): RiskLevel {
    const normalized = value.toLowerCase()
    if (normalized === "bajo") return "BAJO"
    if (normalized === "alto") return "ALTO"
    return "MEDIO"
  }

  function paymentCapacityToRisk(value: string): RiskLevel {
    const normalized = value.toLowerCase()
    if (normalized === "alta") return "BAJO"
    if (normalized === "baja") return "ALTO"
    return "MEDIO"
  }

  async function handleSubmit() {
    const nitSanitized = form.nit.replace(/\D/g, "")

    if (!form.nombre || !form.correo || !form.razonSocial || !form.direccion) {
      toast.error("Completa los campos obligatorios para registrar el cliente.")
      return
    }

    if (!/^\d{13}$/.test(nitSanitized)) {
      toast.error("El NIT debe tener exactamente 13 dígitos.")
      return
    }

    if (!form.capacidadPago || !form.riesgoMercancia || !form.riesgoAduanas || !form.lavadoDinero) {
      toast.error("Completa el perfil de riesgo antes de continuar.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.post<CreateClientResponse>(ENDPOINTS.CLIENTES.CREATE, {
        legalName: form.razonSocial,
        nit: nitSanitized,
        taxAddress: form.direccion,
        primaryContactName: form.nombre,
        primaryContactEmail: form.correo,
        primaryContactPhone: form.telefono || undefined,
        paymentRisk: paymentCapacityToRisk(form.capacidadPago),
        cargoRisk: toRiskLevel(form.riesgoMercancia),
        customsRisk: toRiskLevel(form.riesgoAduanas),
        amlRisk: toRiskLevel(form.lavadoDinero),
      })

      setSuccessOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  function goBack() {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function goNext() {
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
  }

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* HD Minimalist Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />
      
      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-16 flex flex-col items-center">
        
        <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
          <div className="-mx-6 -mt-4 mb-6 h-1.5 bg-[#53B73E]" />

          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#53B73E]/15 flex items-center justify-center">
              <UserCheck className="text-[#53B73E]" size={28} />
            </div>

            <h2 className="mt-5 text-[#0A3B7C]">Cliente Registrado</h2>
            <p className="text-text-muted text-small mt-2">
              El cliente ha sido guardado exitosamente. Se ha enviado un correo automático con sus credenciales de acceso
              al portal.
            </p>

            <div className="mt-6">
              <Button type="button" className="w-full bg-[#0A3B7C] text-white hover:bg-[#083066]" onClick={() => {
                router.push("/agente-operativo")
                setSuccessOpen(false)
              }}>
                Aceptar
              </Button>
            </div>
          </div>
        </Modal>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#0A3B7C]">Registrar Cliente Nuevo</h1>
          <p className="text-[#64748B] text-lg mt-2">Ingresa los datos paso a paso</p>
        </div>

        <div className="w-full max-w-4xl">
          <Card className="rounded-3xl p-8 sm:p-12 shadow-xl bg-white/90 backdrop-blur-md border-white/20">
            <div className="flex justify-center mb-10">
              <Stepper current={currentStep} steps={steps} />
            </div>

            <h2 className="text-2xl font-heading font-bold text-[#0A3B7C] border-b border-black/5 pb-4 mb-8">
              {currentStep + 1}. {steps[currentStep]}
            </h2>

            <div className="mt-8">
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Nombre"
                    placeholder="Ej. Henry Contreras"
                    value={form.nombre}
                    onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                  />
                  <Input
                    label="Teléfono"
                    placeholder="Ej. 5555-5555"
                    value={form.telefono}
                    onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Correo"
                      type="email"
                      placeholder="ejemplo@gmail.com"
                      value={form.correo}
                      onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Razón Social"
                    placeholder="Ej. Logitrans S.A."
                    value={form.razonSocial}
                    onChange={(e) => setForm((s) => ({ ...s, razonSocial: e.target.value }))}
                  />
                  <Input
                    label="Dirección"
                    placeholder="Ej. Zona 10, Ciudad"
                    value={form.direccion}
                    onChange={(e) => setForm((s) => ({ ...s, direccion: e.target.value }))}
                  />
                  <Input
                    label="NIT"
                    placeholder="Ej. 1234567"
                    value={form.nit}
                    onChange={(e) => setForm((s) => ({ ...s, nit: e.target.value }))}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Select
                    label="Capacidad de Pago"
                    placeholder="Selecciona una opción"
                    options={capacidadPagoOptions}
                    value={form.capacidadPago}
                    onChange={(e) => setForm((s) => ({ ...s, capacidadPago: e.target.value }))}
                  />
                  <Select
                    label="Riesgo de Mercancía"
                    placeholder="Selecciona una opción"
                    options={riskOptions}
                    value={form.riesgoMercancia}
                    onChange={(e) => setForm((s) => ({ ...s, riesgoMercancia: e.target.value }))}
                  />
                  <Select
                    label="Riesgo en Aduanas"
                    placeholder="Selecciona una opción"
                    options={riskOptions}
                    value={form.riesgoAduanas}
                    onChange={(e) => setForm((s) => ({ ...s, riesgoAduanas: e.target.value }))}
                  />
                  <Select
                    label="Lavado de Dinero"
                    placeholder="Selecciona una opción"
                    options={riskOptions}
                    value={form.lavadoDinero}
                    onChange={(e) => setForm((s) => ({ ...s, lavadoDinero: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-black/5 pt-8">
              <Button type="button" variant="outline" disabled={!canGoBack} onClick={goBack} className="border-black/10 hover:bg-black/5 px-8">
                Atrás
              </Button>

              {!isLastStep ? (
                <Button type="button" onClick={goNext} className="bg-[#0A3B7C] text-white hover:bg-[#083066] px-10">
                  Siguiente
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="bg-[#53B73E] text-white hover:bg-[#3A8E2A] px-10">
                  Registrar Cliente
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
