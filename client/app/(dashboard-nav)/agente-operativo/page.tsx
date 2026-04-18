"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { UserPlus, NotebookPen, ArrowRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

const CARDS = [
  {
    href: "/agente-operativo/registrar-cliente",
    icon: <UserPlus size={16} />,
    step: "01",
    title: "Registrar Cliente",
    description: "Alta de nuevos clientes, registro de datos fiscales y evaluación de perfiles de riesgo operativo.",
    cta: "Comenzar registro",
  },
  {
    href: "/agente-operativo/formalizar-contrato",
    icon: <NotebookPen size={16} />,
    step: "02",
    title: "Formalizar Contrato",
    description: "Vinculación de tarifas paramétricas, definición de rutas y condiciones logísticas para contratos activos.",
    cta: "Crear contrato",
  },
]

export default function AgenteOperativoPage() {
  const { user } = useAuth()
  const firstName = (user?.fullName || "Agente").split(" ")[0]

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Ghost letters */}
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem, 30vw, 28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>AO</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "3rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Área Comercial
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Hola, {firstName}.
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "42ch" }}>
            Panel de gestión regional de clientes y contratos comerciales.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Action cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {CARDS.map((card, i) => (
            <motion.div key={card.href}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: EASE }}>
              <Link href={card.href} style={{ display: "block", textDecoration: "none" }}>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(12,12,10,0.07)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = "rgba(201,146,75,0.3)"
                    el.style.transform = "translateY(-2px)"
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = "rgba(12,12,10,0.07)"
                    el.style.transform = "translateY(0)"
                  }}
                >
                  {/* Amber accent strip */}
                  <div style={{ height: "2px", background: "#C9924B" }} />

                  <div style={{ padding: "2rem 2rem 1.75rem" }}>
                    {/* Step number + icon */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                      <span style={{ fontSize: "0.52rem", letterSpacing: "0.3em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                        {card.step}
                      </span>
                      <span style={{ color: "#C9924B", display: "flex" }}>{card.icon}</span>
                    </div>

                    <h3 style={{ fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A", marginBottom: "0.6rem", lineHeight: 1.1 }}>
                      {card.title}
                    </h3>

                    <p style={{ fontSize: "0.8rem", color: "#6B6260", lineHeight: 1.6, marginBottom: "2rem" }}>
                      {card.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9924B" }}>
                      {card.cta}
                      <ArrowRight size={11} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
