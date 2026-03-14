/** Aquí implementar formulario de Registrar Cliente Nuevo
 *
 * Pantalla: Registrar Cliente Nuevo
 * Wireframes: Wireframe-21 (segundo y tercer cuadro)
 *
 * Secciones del formulario:
 * 1. Datos Generales — nombre, teléfono
 * 2. Datos Fiscales — razón social, dirección, NIT
 * 3. Perfil de Riesgo — capacidad de pago, seguro de aseguradora,
 *    medición de antigüedad, lavado de dinero
 *
 * Componentes sugeridos: Input, Select, Button, Card
 * Ruta sugerida: POST /api/v1/clientes
 *
 * Al completar exitosamente → redirigir a /agente-operativo/cliente-registrado
 */

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

export default function RegistrarClientePage() {
  const router = useRouter()
  const steps = useMemo(() => ["Datos Generales", "Datos Fiscales", "Perfil de Riesgo"], [])
  const [currentStep, setCurrentStep] = useState(0)
  const [successOpen, setSuccessOpen] = useState(false)

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

  function handleSubmit() {
    // TODO: integrar POST /api/v1/clientes cuando exista el endpoint.
    // Por ahora solo es UI/flujo de pasos.
    console.log("Registrar cliente:", form)
    setSuccessOpen(true)
  }

  function goBack() {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function goNext() {
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
  }

  return (
    <div className="space-y-8">
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="-mx-6 -mt-4 mb-6 h-1.5 bg-secondary" />

        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
            <UserCheck className="text-secondary" size={28} />
          </div>

          <h2 className="mt-5">Cliente Registrado</h2>
          <p className="text-text-muted text-small mt-2">
            El cliente ha sido guardado exitosamente. Se ha enviado un correo automático con sus credenciales de acceso
            al portal.
          </p>

          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => {
              router.push("/agente-operativo")
              setSuccessOpen(false)
            }}>
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      <div className="text-center">
        <h1>Registrar Cliente Nuevo</h1>
        <p className="text-text-muted mt-2">Ingresa los datos paso a paso</p>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-4xl rounded-2xl p-8 sm:p-10">
          <div className="flex justify-center">
            <Stepper current={currentStep} steps={steps} />
          </div>

          <h2 className="mt-8 text-center">{steps[currentStep]}</h2>

          <div className="mt-8">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="mt-10 flex items-center justify-between">
            <Button type="button" variant="outline" disabled={!canGoBack} onClick={goBack}>
              Atrás
            </Button>

            {!isLastStep ? (
              <Button type="button" disabled={!canGoNext} onClick={goNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit}>
                Registrar y Enviar Credenciales
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
