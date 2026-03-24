"use client"

import Input from "@/components/ui/Input"
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
  contrasenaAcceso: string
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
    clientId: number
    clientCode: string
    legalName: string
    nit: string
    primaryContactEmail: string
  }
}

export default function RegistrarClientePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [successOpen, setSuccessOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState<FormState>({
    nombre: "",
    telefono: "",
    correo: "",
    contrasenaAcceso: "",
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
      { value: "bajo", label: "Baja" },
      { value: "medio", label: "Media" },
      { value: "alto", label: "Alta" },
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

  function generateSecurePassword(length = 16): string {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lowercase = "abcdefghijkmnopqrstuvwxyz"
    const numbers = "23456789"
    const symbols = "!@#$%&*?-_"
    const charset = `${uppercase}${lowercase}${numbers}${symbols}`

    const bytes = new Uint32Array(length)
    crypto.getRandomValues(bytes)

    const required = [
      uppercase[bytes[0] % uppercase.length],
      lowercase[bytes[1] % lowercase.length],
      numbers[bytes[2] % numbers.length],
      symbols[bytes[3] % symbols.length],
    ]

    const extra = Array.from(bytes)
      .slice(4)
      .map((n) => charset[n % charset.length])

    const mixed = [...required, ...extra]
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = bytes[i % bytes.length] % (i + 1)
      ;[mixed[i], mixed[j]] = [mixed[j], mixed[i]]
    }

    return mixed.join("")
  }

  function handleGeneratePassword() {
    const generated = generateSecurePassword(16)
    setForm((s) => ({ ...s, contrasenaAcceso: generated }))
    toast.success("Se generó una contraseña segura.")
  }

  async function handleSubmit() {
    const nitSanitized = form.nit.replace(/\D/g, "")

    if (!form.nombre || !form.correo || !form.contrasenaAcceso || !form.razonSocial || !form.direccion) {
      toast.error("Completa los campos obligatorios para registrar el cliente.")
      return
    }

    if (form.contrasenaAcceso.length < 12) {
      toast.error("La contraseña de acceso debe tener al menos 12 caracteres.")
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
        portalPassword: form.contrasenaAcceso,
        primaryContactPhone: form.telefono || undefined,
        paymentRisk: paymentCapacityToRisk(form.capacidadPago),
        cargoRisk: toRiskLevel(form.riesgoMercancia),
        customsRisk: toRiskLevel(form.riesgoAduanas),
        amlRisk: toRiskLevel(form.lavadoDinero),
      })

      setSuccessOpen(true)
    } catch {
      toast.error("No se pudo registrar el cliente. Intenta nuevamente.")
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
              <UserCheck size={22} style={{ color: "#C9924B" }} />
            </div>

            <p style={{ fontSize: "0.52rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
              Registro completado
            </p>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A", marginBottom: "0.75rem" }}>
              Cliente registrado.
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#6B6260", lineHeight: 1.6, marginBottom: "2rem" }}>
              Se ha enviado un correo automático con las credenciales de acceso al portal.
            </p>

            <button
              onClick={() => { router.push("/agente-operativo"); setSuccessOpen(false) }}
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

      <div className="relative z-10 max-w-2xl mx-auto px-8 py-14">

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
            Nuevo Registro
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Registrar Cliente.
            </motion.h1>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
          {STEPS.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: i < currentStep ? "#C9924B" : i === currentStep ? "#0C0C0A" : "transparent",
                  border: `1px solid ${i <= currentStep ? "transparent" : "rgba(12,12,10,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 700,
                  color: i <= currentStep ? "#F5F2EC" : "#9A9489",
                  transition: "all 0.3s",
                }}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: "0.48rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700,
                  color: i === currentStep ? "#0C0C0A" : "#9A9489", whiteSpace: "nowrap", transition: "color 0.3s",
                }}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: "1px", margin: "0 0.5rem", marginBottom: "1.4rem",
                  background: i < currentStep ? "#C9924B" : "rgba(12,12,10,0.1)",
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ borderBottom: "1px solid rgba(12,12,10,0.06)", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.52rem", letterSpacing: "0.3em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Paso {currentStep + 1} / {STEPS.length}
            </span>
            <span style={{ width: "1px", height: "12px", background: "rgba(12,12,10,0.1)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C0C0A" }}>
              {STEPS[currentStep]}
            </span>
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
                      label="Correo de acceso"
                      type="email"
                      placeholder="portal@empresa.com"
                      value={form.correo}
                      onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Contraseña de acceso</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="text"
                        placeholder="Genera una contraseña segura"
                        value={form.contrasenaAcceso}
                        onChange={(e) => setForm((s) => ({ ...s, contrasenaAcceso: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white whitespace-nowrap"
                        onClick={handleGeneratePassword}
                      >
                        Generar contraseña segura
                      </Button>
                    </div>
                    <p className="text-xs text-text-muted mt-2">Mínimo 12 caracteres. Se usará para crear el usuario del portal cliente.</p>
                  </div>
                </div>
              )}

                {currentStep === 1 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                    <Input label="Razón Social" placeholder="Ej. Logitrans S.A."
                      value={form.razonSocial} onChange={e => setForm(s => ({ ...s, razonSocial: e.target.value }))} />
                    <Input label="NIT" placeholder="Ej. 1234567-8"
                      value={form.nit} onChange={e => setForm(s => ({ ...s, nit: e.target.value }))} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Input label="Dirección fiscal" placeholder="Ej. Zona 10, Ciudad de Guatemala"
                        value={form.direccion} onChange={e => setForm(s => ({ ...s, direccion: e.target.value }))} />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                    <Select label="Capacidad de Pago" placeholder="Selecciona"
                      options={capacidadPagoOptions} value={form.capacidadPago}
                      onChange={e => setForm(s => ({ ...s, capacidadPago: e.target.value }))} />
                    <Select label="Riesgo de Mercancía" placeholder="Selecciona"
                      options={riskOptions} value={form.riesgoMercancia}
                      onChange={e => setForm(s => ({ ...s, riesgoMercancia: e.target.value }))} />
                    <Select label="Riesgo en Aduanas" placeholder="Selecciona"
                      options={riskOptions} value={form.riesgoAduanas}
                      onChange={e => setForm(s => ({ ...s, riesgoAduanas: e.target.value }))} />
                    <Select label="Lavado de Dinero" placeholder="Selecciona"
                      options={riskOptions} value={form.lavadoDinero}
                      onChange={e => setForm(s => ({ ...s, lavadoDinero: e.target.value }))} />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
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
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  className="bg-[#53B73E] text-white hover:bg-[#3A8E2A] px-10"
                  loading={isSubmitting}
                >
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
