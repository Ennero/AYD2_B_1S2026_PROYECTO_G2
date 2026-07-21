"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { wakeApi } from "@/lib/api/client"
import { DEMO_PORTALS, type DemoPortal } from "@/lib/demo-accounts"
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Lock, ArrowRight } from "lucide-react"

/* ── ease ─────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const

/* ── capability bullets (left panel) ─ */
const BULLETS = [
  "Trazabilidad en tiempo real",
  "Contratos digitales FEL",
  "Gestión de rutas inteligente",
]

export default function LoginPage() {
  const { login } = useAuth()
  const [selectedPortal, setSelectedPortal] = useState<DemoPortal | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Render free tier se duerme: despertarlo al abrir login reduce el primer error.
  useEffect(() => {
    void wakeApi()
  }, [])

  const selectPortal = (portal: DemoPortal) => {
    setSelectedPortal(portal)
    setEmail(portal.email)
    setPassword(portal.password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Por favor completa todos los campos"); return }
    try {
      setIsLoading(true)
      await login(email, password)
      toast.success("¡Bienvenido/a de nuevo!")
    } catch (error: any) {
      toast.error(error.message || "Credenciales inválidas")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════════
          LEFT — typographic editorial panel
      ══════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ width: "52%", borderRight: "1px solid rgba(245,242,236,0.06)" }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: "10%",
            left: "-10%",
            width: "600px",
            height: "500px",
            background: "radial-gradient(ellipse, rgba(201,146,75,0.07) 0%, transparent 65%)",
          }}
        />

        {/* Ghost letter */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.6 }}
          className="absolute pointer-events-none select-none"
          style={{
            right: "-0.04em",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(12rem, 24vw, 22rem)",
            fontWeight: 900,
            color: "rgba(245,242,236,0.016)",
            letterSpacing: "-0.06em",
            lineHeight: 1,
          }}
        >
          LT
        </motion.div>

        {/* Top: eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.58rem",
            letterSpacing: "0.38em",
            color: "#C9924B",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.7, ease: EASE }}
            style={{ display: "inline-block", width: "24px", height: "1px", background: "#C9924B", transformOrigin: "left" }}
          />
          Plataforma de Gestión Logística
        </motion.div>

        {/* Middle: big headline */}
        <div className="relative z-10">
          {["LOGITRANS."].map((word, i) => (
            <div key={word} style={{ overflow: "hidden" }}>
              <motion.div
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 1.05, ease: EASE }}
                style={{
                  fontSize: "clamp(4.5rem, 9vw, 8rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#F5F2EC",
                  lineHeight: 0.92,
                }}
              >
                {word}
              </motion.div>
            </div>
          ))}

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
            style={{
              marginTop: "2rem",
              fontSize: "0.88rem",
              lineHeight: 1.75,
              color: "#9A9489",
              maxWidth: "28rem",
            }}
          >
            Conectamos origen y destino con precisión milimétrica.
            Gestiona contratos, rutas y entregas desde una sola plataforma.
          </motion.p>

          {/* Bullets */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {BULLETS.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.6, ease: EASE }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "0.78rem",
                  color: "rgba(245,242,236,0.55)",
                }}
              >
                <span style={{ width: "16px", height: "1px", background: "#C9924B", flexShrink: 0 }} />
                {b}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Bottom: footer line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          style={{ fontSize: "0.62rem", letterSpacing: "0.2em", color: "#6B6260" }}
        >
          © 2026 — LOGITRANS · Guatemala
        </motion.div>
      </div>

      {/* ══════════════════════════════════
          RIGHT — login form
      ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-16 relative">

        {/* Mobile: brand */}
        <motion.div
          className="lg:hidden mb-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "2.5rem",
          }}
        >
          <span style={{ width: "20px", height: "1px", background: "#C9924B" }} />
          <span style={{ fontSize: "0.58rem", letterSpacing: "0.36em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
            Acceso al sistema
          </span>
        </motion.div>

        {/* Heading */}
        <div style={{ overflow: "hidden", marginBottom: "0.5rem" }}>
          <motion.h2
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.55, duration: 1, ease: EASE }}
            style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              color: "#F5F2EC",
              lineHeight: 1,
            }}
          >
            Bienvenido.
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          style={{ fontSize: "0.82rem", color: "#9A9489", marginBottom: "1.75rem" }}
        >
          Elige un portal para autocompletar credenciales de demostración
        </motion.p>

        {/* ── Portal picker ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7, ease: EASE }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.55rem",
            maxWidth: "26rem",
            marginBottom: "1.75rem",
          }}
        >
          {DEMO_PORTALS.map((portal) => {
            const active = selectedPortal?.role === portal.role
            return (
              <button
                key={portal.role}
                type="button"
                onClick={() => selectPortal(portal)}
                disabled={isLoading}
                style={{
                  textAlign: "left",
                  padding: "0.7rem 0.8rem",
                  background: active ? "rgba(201,146,75,0.12)" : "rgba(245,242,236,0.03)",
                  border: active
                    ? "1px solid rgba(201,146,75,0.55)"
                    : "1px solid rgba(245,242,236,0.09)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: active ? "#C9924B" : "#F5F2EC",
                    letterSpacing: "0.02em",
                    marginBottom: "0.2rem",
                  }}
                >
                  {portal.label}
                </div>
                <div style={{ fontSize: "0.62rem", color: "#6B6260", lineHeight: 1.35 }}>
                  {portal.description}
                </div>
              </button>
            )
          })}
        </motion.div>

        {/* ── Divider ── */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
          style={{ height: "1px", background: "rgba(245,242,236,0.07)", marginBottom: "2rem", transformOrigin: "left", maxWidth: "26rem" }}
        />

        {/* ── Form ── */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "26rem" }}
        >
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
              <input
                id="email"
                type="email"
                placeholder="ejemplo@logitrans.com.gt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                style={{
                  background: "rgba(245,242,236,0.04)",
                  border: "1px solid rgba(245,242,236,0.09)",
                  borderRadius: "6px",
                  color: "#F5F2EC",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#C9924B"
                  e.currentTarget.style.background = "rgba(201,146,75,0.05)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"
                  e.currentTarget.style.background = "rgba(245,242,236,0.04)"
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.32em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B6260" }} />
              <input
                id="password"
                type="text"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3.5 text-sm transition-all focus:outline-none"
                style={{
                  background: "rgba(245,242,236,0.04)",
                  border: "1px solid rgba(245,242,236,0.09)",
                  borderRadius: "6px",
                  color: "#F5F2EC",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#C9924B"
                  e.currentTarget.style.background = "rgba(201,146,75,0.05)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,242,236,0.09)"
                  e.currentTarget.style.background = "rgba(245,242,236,0.04)"
                }}
              />
            </div>
            {selectedPortal && (
              <p style={{ marginTop: "0.55rem", fontSize: "0.68rem", color: "#6B6260" }}>
                Portal seleccionado: {selectedPortal.label}
              </p>
            )}
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
            <Link
              href="/forgot-password"
              style={{ fontSize: "0.72rem", color: "#C9924B", letterSpacing: "0.02em" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* CTA */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={isLoading ? {} : { x: 3 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            className="flex items-center justify-between w-full px-6 py-4 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#C9924B",
              color: "#0C0C0A",
              borderRadius: "6px",
              letterSpacing: "0.06em",
              marginTop: "0.5rem",
            }}
            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.background = "#B8813C" }}
            onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.background = "#C9924B" }}
          >
            <span>Iniciar Sesión</span>
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.span>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}
