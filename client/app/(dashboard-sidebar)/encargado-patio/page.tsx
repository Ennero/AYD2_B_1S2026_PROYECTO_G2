"use client"

import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

const STATS = [
  { value: "PATIO", label: "Módulo activo" },
  { value: "GT",    label: "Operaciones" },
  { value: "FEL",   label: "Certificación" },
]

export default function EncargadoPatioPage() {
  const { user } = useAuth()
  const name = user?.fullName ?? "Encargado"
  const firstName = name.split(" ")[0]

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-10 relative overflow-hidden"
      style={{ background: "#F5F2EC" }}
    >
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(12,12,10,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(12,12,10,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      {/* Ambient glow — amber */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          right: "-5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(201,146,75,0.09) 0%, transparent 68%)",
        }}
      />

      {/* ── TOP: eyebrow ── */}
      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
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
          transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
          style={{ display: "inline-block", width: "24px", height: "1px", background: "#C9924B", transformOrigin: "left" }}
        />
        Panel de Control — Encargado de Patio
      </motion.div>

      {/* ── CENTER: main content ── */}
      <div className="relative z-10 max-w-3xl">

        {/* Ghost letter */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1.5 }}
          className="absolute pointer-events-none select-none"
          style={{
            left: "-0.04em",
            top: "50%",
            transform: "translateY(-60%)",
            fontSize: "clamp(10rem, 20vw, 18rem)",
            fontWeight: 900,
            color: "rgba(12,12,10,0.028)",
            letterSpacing: "-0.06em",
            lineHeight: 1,
          }}
        >
          EP
        </motion.div>

        {/* Greeting */}
        <div style={{ overflow: "hidden", marginBottom: "0.3rem" }}>
          <motion.p
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.45, duration: 1, ease: EASE }}
            style={{
              fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "#9A9489",
              textTransform: "uppercase",
            }}
          >
            Bienvenido de vuelta,
          </motion.p>
        </div>

        <div style={{ overflow: "hidden" }}>
          <motion.h1
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.57, duration: 1.05, ease: EASE }}
            style={{
              fontSize: "clamp(3.5rem, 8vw, 7rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#0C0C0A",
              lineHeight: 0.92,
            }}
          >
            {firstName}.
          </motion.h1>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
          style={{
            marginTop: "2rem",
            fontSize: "0.9rem",
            lineHeight: 1.75,
            color: "#6B6260",
            maxWidth: "32rem",
          }}
        >
          Estás en el panel de operaciones de patio. Valida despachos, registra pesos y confirma estibas para mantener el flujo de cargas del día.
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.1, duration: 1, ease: EASE }}
          style={{
            height: "1px",
            background: "rgba(12,12,10,0.1)",
            margin: "2.5rem 0",
            transformOrigin: "left",
            maxWidth: "32rem",
          }}
        />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.8, ease: EASE }}
        >
          <Link href="/encargado-patio/cargas" style={{ textDecoration: "none", display: "inline-flex" }}>
            <motion.div
              whileHover={{ x: 4 }}
              className="inline-flex items-center justify-between gap-8 px-7 py-4 cursor-pointer"
              style={{
                background: "#0C0C0A",
                color: "#F5F2EC",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span>Formalizar Cargas</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.span>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* ── BOTTOM: stats ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.9 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px",
          background: "rgba(12,12,10,0.08)",
          maxWidth: "28rem",
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#F5F2EC",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#C9924B", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.24em", color: "#9A9489", marginTop: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
