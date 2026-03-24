"use client"

import { LogEvento, EventType } from "@/types/pilot"
import { LogOut, MapPin, Landmark, AlertTriangle, Flag, MoreHorizontal } from "lucide-react"

interface BitacoraTimelineProps {
  logs: LogEvento[]
  newLogIds?: Set<string>
}

const EVENT: Record<EventType, {
  icon: React.ReactNode
  label: string
  dot: string
  labelColor: string
}> = {
  SALIDA: {
    icon: <LogOut size={11} />,
    label: "Salida",
    dot: "#C9924B",
    labelColor: "#C9924B",
  },
  PUNTO_CONTROL: {
    icon: <MapPin size={11} />,
    label: "Punto de Control",
    dot: "#6B6260",
    labelColor: "#6B6260",
  },
  ADUANA: {
    icon: <Landmark size={11} />,
    label: "Aduana",
    dot: "#0C0C0A",
    labelColor: "#0C0C0A",
  },
  INCIDENTE: {
    icon: <AlertTriangle size={11} />,
    label: "Incidente",
    dot: "#E53E3E",
    labelColor: "#E53E3E",
  },
  LLEGADA: {
    icon: <Flag size={11} />,
    label: "Llegada",
    dot: "#3A8E2A",
    labelColor: "#3A8E2A",
  },
  OTRO: {
    icon: <MoreHorizontal size={11} />,
    label: "Otro",
    dot: "#9A9489",
    labelColor: "#9A9489",
  },
}

export default function BitacoraTimeLine({
  logs,
  newLogIds = new Set(),
}: BitacoraTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0" }}>
        <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
          Sin eventos
        </p>
        <p style={{ fontSize: "0.78rem", color: "#6B6260" }}>
          Los eventos del viaje aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute",
        left: "5px",
        top: "8px",
        bottom: "8px",
        width: "1px",
        background: "rgba(12,12,10,0.1)",
      }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {logs.map((log) => {
          const cfg = EVENT[log.eventType] ?? EVENT["OTRO"]
          const isNew = newLogIds.has(log.logId)

          const hora = new Date(log.eventTime).toLocaleString("es-GT", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <div key={log.logId} style={{ position: "relative" }}>
              {/* Dot */}
              <div style={{
                position: "absolute",
                left: "-1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: cfg.dot,
                flexShrink: 0,
              }} />

              {/* Card */}
              <div style={{
                background: "#ffffff",
                border: `1px solid ${isNew ? "rgba(201,146,75,0.3)" : "rgba(12,12,10,0.07)"}`,
                borderLeft: isNew ? "2px solid #C9924B" : `1px solid rgba(12,12,10,0.07)`,
                borderRadius: "4px",
                padding: "0.75rem 1rem",
              }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    fontSize: "0.52rem", letterSpacing: "0.28em", fontWeight: 700,
                    textTransform: "uppercase", color: cfg.labelColor,
                  }}>
                    <span style={{ color: cfg.dot, display: "flex" }}>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#9A9489", letterSpacing: "0.04em" }}>
                    {hora}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: "0.8rem", color: "#0C0C0A", lineHeight: 1.5, margin: 0 }}>
                  {log.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
