"use client"

import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useMemo, useState } from "react"
import { UserCheck, Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

const EASE = [0.16, 1, 0.3, 1] as const

enum RiskLevel {
  BAJO = "BAJO",
  MEDIO = "MEDIO",
  ALTO = "ALTO",
}

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

const STEPS = ["Datos Generales", "Datos Fiscales", "Perfil de Riesgo"]

export default function RegistrarClientePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<FormState>({
    nombre: "", telefono: "", correo: "",
    razonSocial: "", direccion: "", nit: "",
    capacidadPago: "", riesgoMercancia: "", riesgoAduanas: "", lavadoDinero: "",
  })

  const riskOptions = useMemo(() => [
    { value: "bajo", label: "Bajo" },
    { value: "medio", label: "Medio" },
    { value: "alto", label: "Alto" },
  ], [])

  const capacidadPagoOptions = useMemo(() => [
    { value: "bajo", label: "Baja" },
    { value: "medio", label: "Media" },
    { value: "alto", label: "Alta" },
  ], [])

  async function handleSubmit() {
    if (!form.razonSocial || !form.nit || !form.nombre || !form.correo) {
      return toast.error("Por favor completa los campos obligatorios")
    }
    setLoading(true)
    try {
      await api.post(ENDPOINTS.CLIENTES.CREATE, {
        legalName: form.razonSocial,
        nit: form.nit,
        taxAddress: form.direccion || "Ciudad",
        primaryContactName: form.nombre,
        primaryContactEmail: form.correo,
        primaryContactPhone: form.telefono,
        paymentRisk: (form.capacidadPago || "medio").toUpperCase() as RiskLevel,
        customsRisk: (form.riesgoAduanas || "medio").toUpperCase() as RiskLevel,
        cargoRisk: (form.riesgoMercancia || "medio").toUpperCase() as RiskLevel,
        amlRisk: (form.lavadoDinero || "medio").toUpperCase() as RiskLevel,
      })
      setSuccessOpen(true)
    } catch (error) {
      console.error("Failed to register client:", error)
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

          <div style={{ padding: "1.75rem" }}>
            <AnimatePresence mode="wait">
              <motion.div key={currentStep}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22 }}>

                {currentStep === 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                    <Input label="Nombre completo" placeholder="Ej. Henry Contreras"
                      value={form.nombre} onChange={e => setForm(s => ({ ...s, nombre: e.target.value }))} />
                    <Input label="Teléfono" placeholder="Ej. 5555-5555"
                      value={form.telefono} onChange={e => setForm(s => ({ ...s, telefono: e.target.value }))} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Input label="Correo electrónico" type="email" placeholder="ejemplo@empresa.com"
                        value={form.correo} onChange={e => setForm(s => ({ ...s, correo: e.target.value }))} />
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

          {/* Navigation */}
          <div style={{ borderTop: "1px solid rgba(12,12,10,0.06)", padding: "1.25rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                border: "1px solid rgba(12,12,10,0.12)", background: "transparent",
                color: currentStep === 0 ? "rgba(12,12,10,0.2)" : "rgba(12,12,10,0.45)",
                transition: "all 0.15s",
              }}
              onMouseOver={e => { if (currentStep > 0) e.currentTarget.style.color = "#0C0C0A" }}
              onMouseOut={e => { if (currentStep > 0) e.currentTarget.style.color = "rgba(12,12,10,0.45)" }}
            >
              ← Atrás
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
                style={{
                  padding: "0.5rem 1.75rem", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                  background: "#0C0C0A", color: "#F5F2EC", border: "none", transition: "background 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#C9924B")}
                onMouseOut={e => (e.currentTarget.style.background = "#0C0C0A")}
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: "0.5rem 1.75rem", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "#9A9489" : "#0C0C0A", color: "#F5F2EC",
                  border: "none", transition: "background 0.15s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#C9924B" }}
                onMouseOut={e => { if (!loading) e.currentTarget.style.background = "#0C0C0A" }}
              >
                {loading && <Loader2 size={11} className="animate-spin" />}
                Registrar Cliente →
              </button>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
