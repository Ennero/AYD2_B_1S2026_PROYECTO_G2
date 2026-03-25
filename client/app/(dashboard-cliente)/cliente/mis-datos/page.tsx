"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Send, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ClientProfile {
  user: {
    userId: string
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
  }
  company: {
    clientId: string
    clientCode: string
    legalName: string
    commercialName: string | null
    nit: string
    taxAddress: string
    primaryContactName: string
    primaryContactEmail: string
    primaryContactPhone: string | null
    isBlocked: boolean
    blockReason: string | null
  } | null
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
      {children}
    </p>
  )
}

function FieldPair({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p style={{ fontSize: "0.58rem", color: "#9A9489", marginBottom: "3px", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0C0C0A" }}>
        {value ?? <span style={{ fontStyle: "italic", color: "#9A9489" }}>—</span>}
      </p>
    </div>
  )
}

function FormInput({
  label, type = "text", value, onChange, placeholder, disabled,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.52rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "0.6rem 0.85rem",
          background: disabled ? "rgba(12,12,10,0.03)" : "#F5F2EC",
          border: "1px solid rgba(12,12,10,0.12)",
          borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem",
          outline: "none", opacity: disabled ? 0.6 : 1, transition: "border-color 0.15s",
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "#C9924B" }}
        onBlur={e => { e.target.style.borderColor = "rgba(12,12,10,0.12)" }}
      />
    </div>
  )
}

function PasswordInput({
  label, value, onChange, placeholder, disabled,
}: {
  label: string; value: string
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <FormInput
        label={label}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute", right: "10px", bottom: "9px",
          background: "none", border: "none", color: "#9A9489", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function MisDatosPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [showChangeForm, setShowChangeForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [savingPwd, setSavingPwd] = useState(false)

  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ data: ClientProfile }>(ENDPOINTS.CLIENT.PROFILE)
      setProfile(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchProfile() }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error("Completa todos los campos"); return }
    if (newPwd !== confirmPwd) { toast.error("La nueva contraseña y la confirmación no coinciden"); return }
    if (newPwd.length < 6) { toast.error("La nueva contraseña debe tener al menos 6 caracteres"); return }
    setSavingPwd(true)
    try {
      await api.patch(ENDPOINTS.CLIENT.CHANGE_PASSWORD, { currentPassword: currentPwd, newPassword: newPwd })
      toast.success("Contraseña actualizada correctamente")
      setShowChangeForm(false)
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
    } catch {
      // api client shows toast
    } finally {
      setSavingPwd(false)
    }
  }

  const handleSendRecovery = async () => {
    if (!profile?.user.email) return
    setSendingRecovery(true)
    try {
      await api.post(ENDPOINTS.AUTH.RECOVERY, { email: profile.user.email }, { skipAuth: true, silentError: true })
      setRecoverySent(true)
      toast.success(`Token de recuperación enviado a ${profile.user.email}`)
    } catch {
      toast.error("No se pudo enviar el correo. Intenta más tarde.")
    } finally {
      setSendingRecovery(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
        <div className="max-w-3xl mx-auto px-8 py-14" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ height: "60px", width: "260px", borderRadius: "4px", background: "rgba(12,12,10,0.06)" }} />
          <div style={{ height: "220px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
          <div style={{ height: "140px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
          <div style={{ height: "160px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const { user, company } = profile

  const cardStyle: React.CSSProperties = {
    background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
    borderRadius: "6px", overflow: "hidden",
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>MD</div>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Portal Cliente
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Mi Perfil Empresarial
            </motion.h1>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Blocked alert */}
        {company?.isBlocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "1rem",
              background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.2)",
              borderRadius: "6px", padding: "1rem 1.25rem",
            }}>
            <AlertTriangle size={16} style={{ color: "#E53E3E", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E53E3E", marginBottom: "2px" }}>Cuenta bloqueada</p>
              {company.blockReason && (
                <p style={{ fontSize: "0.75rem", color: "#6B6260" }}>{company.blockReason}</p>
              )}
            </div>
          </motion.div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* ── Datos Fiscales */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            style={cardStyle}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <SectionLabel>Datos Fiscales (Solo Lectura)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                <FieldPair label="Razón Social" value={company?.legalName} />
                <FieldPair label="NIT" value={company?.nit} />
                <FieldPair label="Nombre Comercial" value={company?.commercialName} />
                <FieldPair label="Código de Cliente" value={company?.clientCode} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldPair label="Dirección Fiscal" value={company?.taxAddress} />
                </div>
              </div>

              {/* Contacto principal */}
              <div style={{ borderTop: "1px solid rgba(12,12,10,0.07)", paddingTop: "1.25rem" }}>
                <p style={{ fontSize: "0.52rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
                  Contacto Principal
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <FieldPair label="Nombre" value={company?.primaryContactName} />
                  <FieldPair label="Correo" value={company?.primaryContactEmail} />
                  <FieldPair label="Teléfono de empresa" value={company?.primaryContactPhone} />
                  <FieldPair label="Teléfono de portal" value={user.phone} />
                </div>
              </div>

              <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(12,12,10,0.05)" }}>
                Para modificar razón social, NIT o dirección fiscal, contacta a tu agente operativo.
              </p>
            </div>
          </motion.div>

          {/* ── Cuenta */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
            style={cardStyle}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <SectionLabel>Cuenta</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1rem" }}>
                <FieldPair label="Nombre de usuario" value={user.fullName} />
                <FieldPair label="Correo de acceso" value={user.email} />
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "3px 10px", borderRadius: "4px",
                background: user.isActive ? "rgba(58,142,42,0.08)" : "rgba(229,62,62,0.08)",
                color: user.isActive ? "#3A8E2A" : "#E53E3E",
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                <CheckCircle2 size={11} />
                {user.isActive ? "Cuenta activa" : "Cuenta inactiva"}
              </span>
            </div>
          </motion.div>

          {/* ── Seguridad */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
            style={cardStyle}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <SectionLabel>Seguridad</SectionLabel>

              {/* Password row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.85rem 1rem", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "4px", marginBottom: showChangeForm ? "1rem" : 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "4px",
                    background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Lock size={14} style={{ color: "#6B6260" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>Contraseña de Acceso</p>
                    <p style={{ fontSize: "0.65rem", color: "#9A9489" }}>Última actualización desconocida</p>
                  </div>
                </div>
                {!showChangeForm && (
                  <button
                    onClick={() => setShowChangeForm(true)}
                    style={{
                      padding: "0.45rem 0.9rem", background: "none",
                      border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "#6B6260", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
                  >
                    Cambiar Clave
                  </button>
                )}
              </div>

              {/* Change password form */}
              {showChangeForm && (
                <form onSubmit={(e) => void handleChangePassword(e)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <PasswordInput label="Contraseña actual" value={currentPwd} onChange={setCurrentPwd} disabled={savingPwd} />
                  <PasswordInput label="Nueva contraseña" value={newPwd} onChange={setNewPwd} placeholder="Mínimo 6 caracteres" disabled={savingPwd} />
                  <PasswordInput label="Confirmar nueva contraseña" value={confirmPwd} onChange={setConfirmPwd} disabled={savingPwd} />
                  <div style={{ display: "flex", gap: "10px", paddingTop: "0.25rem" }}>
                    <button
                      type="submit"
                      disabled={savingPwd}
                      style={{
                        padding: "0.6rem 1.25rem", background: savingPwd ? "rgba(201,146,75,0.5)" : "#C9924B",
                        border: "none", borderRadius: "4px", color: "#ffffff",
                        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", cursor: savingPwd ? "not-allowed" : "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={e => { if (!savingPwd) e.currentTarget.style.background = "#b5833f" }}
                      onMouseOut={e => { if (!savingPwd) e.currentTarget.style.background = "#C9924B" }}
                    >
                      {savingPwd ? "Guardando…" : "Guardar contraseña"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowChangeForm(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd("") }}
                      style={{
                        padding: "0.6rem 1rem", background: "none",
                        border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                        color: "#6B6260", fontSize: "0.62rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
                      onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Recovery */}
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(12,12,10,0.07)" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "4px" }}>
                  Recuperación por correo
                </p>
                <p style={{ fontSize: "0.75rem", color: "#9A9489", marginBottom: "1rem", lineHeight: 1.6 }}>
                  ¿Olvidaste tu contraseña actual? Te enviaremos un enlace seguro a{" "}
                  <span style={{ fontWeight: 600, color: "#6B6260" }}>{user.email}</span>{" "}
                  para restablecerla sin necesidad de la contraseña actual.
                </p>

                {recoverySent ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3A8E2A", fontSize: "0.82rem", fontWeight: 600 }}>
                    <CheckCircle2 size={15} />
                    Token enviado. Revisa tu bandeja de entrada.
                  </div>
                ) : (
                  <button
                    onClick={() => void handleSendRecovery()}
                    disabled={sendingRecovery}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "0.55rem 1rem", background: "none",
                      border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                      fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "#6B6260",
                      cursor: sendingRecovery ? "not-allowed" : "pointer",
                      opacity: sendingRecovery ? 0.6 : 1,
                      transition: "border-color 0.15s",
                    }}
                    onMouseOver={e => { if (!sendingRecovery) e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)" }}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
                  >
                    <Send size={12} />
                    {sendingRecovery ? "Enviando…" : "Enviar token de recuperación"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
