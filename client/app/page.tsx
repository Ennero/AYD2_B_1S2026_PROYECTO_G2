"use client"

import { useEffect, useRef, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
} from "framer-motion"
import Link from "next/link"

/* ─────────────────────────────────────────────
   PALETTE
   #0C0C0A  Graphite Black  (dark sections bg)
   #F5F2EC  Warm Ivory      (light sections bg, hero text)
   #C9924B  Amber           (accent, CTAs, highlights)
   #1E1E1B  Deep Ink        (card bg on dark)
   #9A9489  Warm Mist       (muted text)
   #6B6260  Ash             (body text on light)
   ───────────────────────────────────────────── */

/* ─── Animated counter ─── */
function StatBlock({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(0, value, {
      duration: 2.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return ctrl.stop
  }, [inView, value])

  return (
    <div ref={ref}>
      <div
        style={{
          fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
          fontWeight: 900,
          color: "#C9924B",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {display.toLocaleString()}
        {suffix}
      </div>
      <div
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.28em",
          color: "#9A9489",
          marginTop: "0.5rem",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  )
}

/* ─── Custom cursor dot ─── */
function CursorDot() {
  const [pos, setPos] = useState({ x: -100, y: -100 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <motion.div
      animate={{ x: pos.x - 5, y: pos.y - 5 }}
      transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.4 }}
      style={{
        position: "fixed",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#C9924B",
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "difference",
      }}
    />
  )
}

/* ─── Swiss grid overlay ─── */
const GridOverlay = () => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(245,242,236,0.028) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245,242,236,0.028) 1px, transparent 1px)
      `,
      backgroundSize: "72px 72px",
      pointerEvents: "none",
    }}
  />
)

/* ─── Marquee ticker ─── */
const TICKER_ITEMS = [
  "Logística de Precisión",
  "Contratos Digitales",
  "Monitoreo en Tiempo Real",
  "Gestión de Rutas",
  "Trazabilidad Total",
  "Certificación FEL",
]

function Marquee() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div
      style={{
        background: "#C9924B",
        padding: "0.85rem 0",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{ display: "inline-flex", gap: "3.5rem" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.32em",
              color: "#0C0C0A",
              textTransform: "uppercase",
            }}
          >
            — {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── Main page ─── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.28], ["0%", "-6%"])

  const words = ["LOGÍSTICA", "SIN", "FRONTERAS."]

  const capabilities = [
    {
      num: "01",
      title: "Trazabilidad Total",
      desc: "Monitorea cada envío en tiempo real. Desde la asignación del piloto hasta la entrega final, con historial completo y auditable.",
    },
    {
      num: "02",
      title: "Contratos Digitales",
      desc: "Formaliza acuerdos al instante. Generación automática de contratos con certificación FEL y firma integrada.",
    },
    {
      num: "03",
      title: "Reportes en Tiempo Real",
      desc: "Dashboards de gerencia con métricas de rentabilidad, alertas críticas y análisis detallado de rutas.",
    },
  ]

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .landing-btn-ghost:hover { border-color: rgba(201,146,75,0.55) !important; }
        @media (max-width: 768px) {
          .hero-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 2rem !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 1.5rem !important; }
          .capabilities-grid { grid-template-columns: 1fr !important; }
          .hero-section { padding: 5rem 1.5rem 4rem !important; }
          .nav-inner { padding: 1.5rem !important; }
          .section-light { padding: 5rem 1.5rem !important; }
          .cta-section { padding: 6rem 1.5rem !important; }
          .footer-inner { padding: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .stats-grid > div { border-left: none !important; padding-left: 0 !important; border-top: 1px solid rgba(245,242,236,0.08); padding-top: 1.5rem; }
          .stats-grid > div:first-child { border-top: none; padding-top: 0; }
        }
      `}</style>

      {/* Cursor dot — hidden on touch */}
      <CursorDot />

      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "#C9924B",
          scaleX: scrollYProgress,
          transformOrigin: "left",
          zIndex: 200,
        }}
      />

      <div style={{ background: "#0C0C0A", color: "#F5F2EC" }}>
        {/* ═══════════════════════════════════
            NAV
        ═══════════════════════════════════ */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            background: "rgba(12,12,10,0.82)",
            borderBottom: "1px solid rgba(245,242,236,0.055)",
          }}
        >
          <div
            className="nav-inner"
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "1.6rem 3rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: "0.32em",
                color: "#F5F2EC",
              }}
            >
              LOGITRANS
            </div>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ color: "#C9924B" }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: "#F5F2EC",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "color 0.25s ease",
                }}
              >
                Ingresar
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </motion.div>
            </Link>
          </div>
        </motion.nav>

        {/* ═══════════════════════════════════
            HERO
        ═══════════════════════════════════ */}
        <motion.section
          className="hero-section"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "5rem 3rem 5rem",
            position: "relative",
            overflow: "hidden",
            opacity: heroOpacity,
            y: heroY,
          }}
        >
          <GridOverlay />

          {/* Ambient amber glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "25%",
              left: "5%",
              width: "70vw",
              height: "70vw",
              maxWidth: "700px",
              maxHeight: "700px",
              background:
                "radial-gradient(ellipse, rgba(201,146,75,0.075) 0%, transparent 68%)",
              pointerEvents: "none",
            }}
          />

          {/* Ghost background letterform — Swiss editorial */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            style={{
              position: "absolute",
              right: "-0.04em",
              top: "48%",
              transform: "translateY(-55%)",
              fontSize: "clamp(14rem, 32vw, 30rem)",
              fontWeight: 900,
              color: "rgba(245,242,236,0.018)",
              letterSpacing: "-0.06em",
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            GT
          </motion.div>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.38em",
              color: "#C9924B",
              marginBottom: "2.5rem",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontWeight: 700,
            }}
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "inline-block",
                width: "28px",
                height: "1px",
                background: "#C9924B",
                transformOrigin: "left",
              }}
            />
            Plataforma de Gestión Logística — Guatemala
          </motion.p>

          {/* Main display headline — word mask reveal */}
          <div>
            {words.map((word, i) => (
              <div key={word} style={{ overflow: "hidden" }}>
                <motion.div
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: 0.55 + i * 0.13,
                    duration: 1.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    fontSize: "clamp(4rem, 12.5vw, 11.5rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.032em",
                    color: "#F5F2EC",
                    lineHeight: 0.9,
                    display: "block",
                    paddingBottom: "0.05em",
                  }}
                >
                  {word}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Description + CTA */}
          <motion.div
            className="hero-bottom"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "3rem",
              gap: "2rem",
            }}
          >
            <p
              style={{
                maxWidth: "30rem",
                lineHeight: 1.75,
                color: "#9A9489",
                fontSize: "0.925rem",
              }}
            >
              Conectamos origen y destino con precisión milimétrica. Gestiona
              contratos, rutas y entregas desde una sola plataforma.
            </p>
            <Link href="/login" style={{ textDecoration: "none", flexShrink: 0 }}>
              <motion.div
                className="landing-btn-ghost"
                whileHover={{ x: 4 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "1px solid rgba(245,242,236,0.16)",
                  color: "#F5F2EC",
                  fontSize: "0.78rem",
                  letterSpacing: "0.14em",
                  cursor: "pointer",
                  transition: "border-color 0.3s ease",
                }}
              >
                Acceder al sistema
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </motion.div>
            </Link>
          </motion.div>

          {/* Divider + Stats */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.6, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "1px",
              background: "rgba(245,242,236,0.08)",
              marginTop: "4rem",
              transformOrigin: "left",
            }}
          />
          <motion.div
            className="stats-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.9 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              paddingTop: "2.5rem",
            }}
          >
            {[
              { value: 1200, suffix: "+", label: "Rutas activas" },
              { value: 98, suffix: "%", label: "Entregas a tiempo" },
              { value: 15, suffix: " años", label: "De confianza" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  borderLeft:
                    i > 0 ? "1px solid rgba(245,242,236,0.08)" : "none",
                  paddingLeft: i > 0 ? "2rem" : "0",
                }}
              >
                <StatBlock {...stat} />
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════
            AMBER MARQUEE TICKER
        ═══════════════════════════════════ */}
        <Marquee />

        {/* ═══════════════════════════════════
            CAPABILITIES — light section
        ═══════════════════════════════════ */}
        <section
          className="section-light"
          style={{
            background: "#F5F2EC",
            color: "#0C0C0A",
            padding: "8rem 3rem",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "5rem",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "1px",
                  background: "#C9924B",
                }}
              />
              <span
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "#9A9489",
                  fontWeight: 700,
                }}
              >
                Capacidades del sistema
              </span>
            </motion.div>

            {/* Capabilities grid */}
            <div
              className="capabilities-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "3rem",
              }}
            >
              {capabilities.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.14,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  viewport={{ once: true }}
                  style={{
                    borderTop: "1px solid rgba(12,12,10,0.11)",
                    paddingTop: "2rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.32em",
                      color: "#C9924B",
                      marginBottom: "1.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {item.num}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#0C0C0A",
                      lineHeight: 1.2,
                      marginBottom: "1rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      color: "#6B6260",
                      lineHeight: 1.78,
                      fontSize: "0.875rem",
                    }}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              style={{
                height: "1px",
                background: "rgba(12,12,10,0.1)",
                marginTop: "5rem",
                transformOrigin: "left",
              }}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════
            ROLE GRID — dark
        ═══════════════════════════════════ */}
        <section
          style={{
            background: "#0C0C0A",
            padding: "8rem 3rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <GridOverlay />
          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "5rem",
              }}
            >
              <div style={{ width: "28px", height: "1px", background: "#C9924B" }} />
              <span
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "#9A9489",
                  fontWeight: 700,
                }}
              >
                Roles en la plataforma
              </span>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1px",
                background: "rgba(245,242,236,0.06)",
              }}
            >
              {[
                { role: "Gerencia", desc: "Dashboards, alertas y rentabilidad" },
                { role: "Ag. Logístico", desc: "Asignación y gestión de rutas" },
                { role: "Ag. Operativo", desc: "Contratos y registro de clientes" },
                { role: "Piloto", desc: "Viajes, bitácora y monitoreo" },
                { role: "Finanzas", desc: "Pagos, facturas y tarifario" },
                { role: "Cliente", desc: "Estado de cuenta y servicios" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  viewport={{ once: true }}
                  whileHover={{ background: "rgba(201,146,75,0.07)" }}
                  style={{
                    background: "#1E1E1B",
                    padding: "2rem 1.75rem",
                    transition: "background 0.25s ease",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.25em",
                      color: "#C9924B",
                      marginBottom: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#F5F2EC",
                      marginBottom: "0.5rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.role}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#9A9489",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════ */}
        <section
          className="cta-section"
          style={{
            background: "#F5F2EC",
            color: "#0C0C0A",
            padding: "10rem 3rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle warm glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "900px",
              height: "400px",
              background:
                "radial-gradient(ellipse, rgba(201,146,75,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            style={{ position: "relative", zIndex: 1 }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.38em",
                color: "#C9924B",
                marginBottom: "2.5rem",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "1px",
                  background: "#C9924B",
                }}
              />
              Listo para comenzar
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "1px",
                  background: "#C9924B",
                }}
              />
            </p>

            {/* Big CTA headline */}
            <div style={{ overflow: "hidden", marginBottom: "3.5rem" }}>
              <motion.h2
                initial={{ y: "105%" }}
                whileInView={{ y: 0 }}
                transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                style={{
                  fontSize: "clamp(3.5rem, 9vw, 8rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.035em",
                  lineHeight: 0.92,
                  color: "#0C0C0A",
                }}
              >
                ACCEDE HOY.
              </motion.h2>
            </div>

            <Link href="/login" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.02, background: "#B8813C" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "#C9924B",
                  color: "#0C0C0A",
                  padding: "1.1rem 3.2rem",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.22em",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "background 0.25s ease",
                }}
              >
                Ingresar al Sistema →
              </motion.button>
            </Link>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════
            FOOTER
        ═══════════════════════════════════ */}
        <footer
          className="footer-inner"
          style={{
            background: "#0C0C0A",
            borderTop: "1px solid rgba(245,242,236,0.06)",
            padding: "2rem 3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: "0.85rem",
              letterSpacing: "0.32em",
              color: "#F5F2EC",
            }}
          >
            LOGITRANS
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              color: "#6B6260",
            }}
          >
            © 2026 — Guatemala
          </span>
        </footer>
      </div>
    </>
  )
}
