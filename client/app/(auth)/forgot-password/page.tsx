"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api/client"

const EASE = [0.16, 1, 0.3, 1] as const

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 state
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isSendingToken, setIsSendingToken] = useState(false)
  const [tokenSent, setTokenSent] = useState(false)

  // Step 2 state
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isChanging, setIsChanging] = useState(false)

  const handleSendToken = async () => {
    if (!email) { toast.error("Ingresa tu correo para recibir el token"); return }
    try {
      setIsSendingToken(true)
      await api.post("/api/auth/recovery", { email })
      toast.success("Token enviado a tu correo")
      setTokenSent(true)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al solicitar token")
    } finally {
      setIsSendingToken(false)
    }
  }

  const handleValidateToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenSent) { toast.error("Primero debes solicitar el token"); return }
    if (!token) { toast.error("Ingresa el token recibido"); return }
    setStep(2)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmation) { toast.error("Completa ambos campos"); return }
    if (password !== confirmation) { toast.error("Las contraseñas no coinciden"); return }

    try {
      setIsChanging(true)
      await api.post("/api/auth/password", { token, password, confirmation })
      toast.success("Contraseña actualizada exitosamente")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Token inválido o error al cambiar la contraseña")
    } finally {
      setIsChanging(false)
    }
  }

  const inputStyle = {
    background: "rgba(245,242,236,0.04)",
    border: "1px solid rgba(245,242,236,0.09)",
    borderRadius: "6px",
    color: "#F5F2EC",
  }

  return (
    <div className="min-h-screen flex">

      {/* ═══ LEFT — typographic editorial panel ═══ */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ width: "52%", borderRight: "1px solid rgba(245,242,236,0.06)" }}
      >
        {/* Ambient glow */}
        <div aria-hidden className="absolute pointer-events-none" style={{
          bottom: "10%", left: "-10%", width: "600px", height: "500px",
          background: "radial-gradient(ellipse, rgba(201,146,75,0.07) 0%, transparent 65%)",
        }} />

        {/* Ghost letter */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.6 }}
          className="absolute pointer-events-none select-none"
          style={{
            right: "-0.04em", top: "50%", transform: "translateY(-50%)",
            fontSize: "clamp(12rem, 24vw, 22rem)", fontWeight: 900,
            color: "rgba(245,242,236,0.016)", letterSpacing: "-0.06em", lineHeight: 1,
          }}
        >LT</motion.div>

        {/* Top: eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            fontSize: "0.58rem", letterSpacing: "0.38em",
            color: "#C9924B", textTransform: "uppercase", fontWeight: 700,
          }}
        >
          <motion.span
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.7, ease: EASE }}
            style={{ display: "inline-block", width: "24px", height: "1px", background: "#C9924B", transformOrigin: "left" }}
          />
          Plataforma de Gestión Logística
        </motion.div>

        {/* Middle: big headline */}
        <div className="relative z-10">
          <div style={{ overflow: "hidden" }}>
            <motion.div
              initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.5, duration: 1.05, ease: EASE }}
              style={{
                fontSize: "clamp(4.5rem, 9vw, 8rem)",
                fontWeight: 900, letterSpacing: "-0.04em",
                color: "#F5F2EC", lineHeight: 0.92,
              }}
            >LOGITRANS.</motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
            style={{ marginTop: "2rem", fontSize: "0.88rem", lineHeight: 1.75, color: "#9A9489", maxWidth: "28rem" }}
          >
            Recupera el acceso a tu cuenta de forma segura.
            Recibirás un token de verificación en tu correo electrónico.
          </motion.p>
        </div>

        {/* Bottom: footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          style={{ fontSize: "0.62rem", letterSpacing: "0.2em", color: "#6B6260" }}
        >
          © 2026 — LOGITRANS · Guatemala
        </motion.div>
      </div>

      {/* ═══ RIGHT — recovery form ═══ */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-16 relative">

        {/* Mobile: brand */}
        <motion.div
          className="lg:hidden mb-10"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p style={{ fontSize: "0.58rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.6rem" }}>
            Plataforma Logística
          </p>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#F5F2EC", lineHeight: 1 }}>
            LOGITRANS.
          </h1>
        </motion.div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2.5rem" }}
        >
          <span style={{ width: "20px", height: "1px", background: "#C9924B" }} />
          <span style={{ fontSize: "0.58rem", letterSpacing: "0.36em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
            Recuperación de cuenta
          </span>
        </motion.div>

        {/* Heading */}
        <div style={{ overflow: "hidden", marginBottom: "0.5rem" }}>
          <motion.h2
            initial={{ y: "105%" }} animate={{ y: 0 }}
            transition={{ delay: 0.55, duration: 1, ease: EASE }}
            style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 900, letterSpacing: "-0.035em",
              color: "#F5F2EC", lineHeight: 1,
            }}
          >
            {step === 1 ? "Solicitar token." : "Nueva contraseña."}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          style={{ fontSize: "0.82rem", color: "#9A9489", marginBottom: "3rem" }}
        >
          {step === 1
            ? "Ingresa tu correo y luego el token que recibirás"
            : "Establece tu nueva contraseña de acceso"}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
          style={{ height: "1px", background: "rgba(245,242,236,0.07)", marginBottom: "2.5rem", transformOrigin: "left" }}
        />

        {step === 1 ? (
          <motion.form
            onSubmit={handleValidateToken}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8, ease: EASE }}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "26rem" }}
          >
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
                <input
                  id="email" type="email" placeholder="ejemplo@logitrans.com.gt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSendingToken}
                  className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#C9924B"; e.currentTarget.style.background = "rgba(201,146,75,0.05)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"; e.currentTarget.style.background = "rgba(245,242,236,0.04)" }}
                />
              </div>
              <div style={{ textAlign: "right", marginTop: "6px" }}>
                <button
                  type="button" onClick={() => void handleSendToken()}
                  disabled={isSendingToken || !email}
                  style={{ fontSize: "0.72rem", color: "#C9924B", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}
                >
                  {isSendingToken ? "Enviando..." : "Enviar token único →"}
                </button>
              </div>
            </div>

            {/* Token */}
            <div>
              <label htmlFor="token" style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                Token recibido
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
                <input
                  id="token" type="text" placeholder="Ingresa el código"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#C9924B"; e.currentTarget.style.background = "rgba(201,146,75,0.05)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"; e.currentTarget.style.background = "rgba(245,242,236,0.04)" }}
                />
              </div>
            </div>

            {/* CTA */}
            <motion.button
              type="submit" disabled={!tokenSent || !token}
              whileHover={(!tokenSent || !token) ? {} : { x: 3 }}
              whileTap={(!tokenSent || !token) ? {} : { scale: 0.98 }}
              className="flex items-center justify-between w-full px-6 py-4 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#C9924B", color: "#0C0C0A", borderRadius: "6px", letterSpacing: "0.06em", marginTop: "0.5rem" }}
              onMouseOver={e => { if (tokenSent && token) e.currentTarget.style.background = "#B8813C" }}
              onMouseOut={e => { if (tokenSent && token) e.currentTarget.style.background = "#C9924B" }}
            >
              <span>Validar Token</span>
              <ArrowRight size={16} />
            </motion.button>

            {/* Back to login */}
            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#9A9489", letterSpacing: "0.02em" }}>
                <ArrowLeft size={12} /> Volver al login
              </Link>
            </div>
          </motion.form>
        ) : (
          <motion.form
            onSubmit={handleChangePassword}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "26rem" }}
          >
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
                <input
                  id="newPassword" type="password" placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isChanging} required
                  className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#C9924B"; e.currentTarget.style.background = "rgba(201,146,75,0.05)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"; e.currentTarget.style.background = "rgba(245,242,236,0.04)" }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confPassword" style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
                <input
                  id="confPassword" type="password" placeholder="••••••••"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={isChanging} required
                  className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#C9924B"; e.currentTarget.style.background = "rgba(201,146,75,0.05)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"; e.currentTarget.style.background = "rgba(245,242,236,0.04)" }}
                />
              </div>
            </div>

            {/* CTA */}
            <motion.button
              type="submit" disabled={isChanging}
              whileHover={isChanging ? {} : { x: 3 }}
              whileTap={isChanging ? {} : { scale: 0.98 }}
              className="flex items-center justify-between w-full px-6 py-4 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#C9924B", color: "#0C0C0A", borderRadius: "6px", letterSpacing: "0.06em", marginTop: "0.5rem" }}
              onMouseOver={e => { if (!isChanging) e.currentTarget.style.background = "#B8813C" }}
              onMouseOut={e => { if (!isChanging) e.currentTarget.style.background = "#C9924B" }}
            >
              <span>{isChanging ? "Procesando..." : "Cambiar Contraseña"}</span>
              {!isChanging && <ArrowRight size={16} />}
              {isChanging && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </motion.button>

            {/* Back */}
            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <button
                type="button" onClick={() => setStep(1)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#9A9489", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}
              >
                <ArrowLeft size={12} /> Volver al paso anterior
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  )
}
