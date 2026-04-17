"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"
import { Users, Search, Pencil, X, RefreshCw, ChevronDown } from "lucide-react"
import {
  buildPrefixedPhone,
  normalizeLocalPhone,
  PHONE_COUNTRIES,
  splitPrefixedPhone,
  type PhoneCountryCode,
} from "@/lib/utils/phone"

const EASE = [0.16, 1, 0.3, 1] as const

type UserRole =
  | "CLIENTE"
  | "AGENTE_OPERATIVO"
  | "AGENTE_LOGISTICO"
  | "ENCARGADO_PATIO"
  | "PILOTO"
  | "AGENTE_FINANCIERO"
  | "GERENCIA"
  | "CERTIFICADOR_FEL"

type OperationUser = {
  userId: number
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  role: UserRole
  clientId: number | null
  clientCode: string | null
  clientName: string | null
}

type ListUsersResponse = { message: string; data: OperationUser[] }
type UpdateUserResponse = { message: string; data: OperationUser }

const ROLE_LABEL: Record<UserRole, string> = {
  CLIENTE:           "Cliente",
  AGENTE_OPERATIVO:  "Agente Operativo",
  AGENTE_LOGISTICO:  "Agente Logístico",
  ENCARGADO_PATIO:   "Encargado de Patio",
  PILOTO:            "Piloto",
  AGENTE_FINANCIERO: "Agente Financiero",
  GERENCIA:          "Gerencia",
  CERTIFICADOR_FEL:  "Certificador FEL",
}

// ── Edit Modal ────────────────────────────────────────────────
function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: OperationUser
  onClose: () => void
  onSaved: (updated: OperationUser) => void
}) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phoneCountry: splitPrefixedPhone(user.phone).countryCode as PhoneCountryCode,
    phoneLocal: splitPrefixedPhone(user.phone).localNumber,
    isActive: user.isActive,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Nombre y correo son obligatorios.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: buildPrefixedPhone(form.phoneCountry, form.phoneLocal) || undefined,
        isActive: form.isActive,
      }
      const response = await api.patch<UpdateUserResponse>(
        ENDPOINTS.OPERATIONS.USER(user.userId),
        payload,
      )
      toast.success("Usuario actualizado correctamente.")
      onSaved(response.data.data)
    } catch {
      // api client already shows a detailed toast
    } finally {
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.5rem", letterSpacing: "0.22em", color: "#9A9489",
    textTransform: "uppercase", fontWeight: 700, marginBottom: "6px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.85rem",
    background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.1)",
    borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem",
    outline: "none", boxSizing: "border-box",
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      padding: "1rem",
    }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{
          background: "#ffffff", borderRadius: "6px",
          maxWidth: "460px", width: "100%",
          border: "1px solid rgba(12,12,10,0.07)",
          overflow: "hidden",
        }}>

        {/* Top amber strip */}
        <div style={{ height: "2px", background: "#C9924B" }} />

        <div style={{ padding: "1.75rem 2rem 2rem" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                Editar usuario
              </p>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A" }}>
                {user.fullName}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9489" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ height: "1px", background: "rgba(12,12,10,0.07)", marginBottom: "1.5rem" }} />

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#C9924B")}
                onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.1)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#C9924B")}
                onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.1)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <select
                  value={form.phoneCountry}
                  onChange={(e) => setForm((s) => ({ ...s, phoneCountry: e.target.value as PhoneCountryCode }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#C9924B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.1)")}
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
                <input
                  value={form.phoneLocal}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, phoneLocal: normalizeLocalPhone(e.target.value) }))
                  }
                  placeholder="22001234"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#C9924B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.1)")}
                />
              </div>
            </div>

            {/* Toggle activo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setForm((s) => ({ ...s, isActive: !s.isActive }))}
                style={{
                  width: "36px", height: "20px", borderRadius: "10px",
                  background: form.isActive ? "#3A8E2A" : "rgba(12,12,10,0.15)",
                  border: "none", cursor: "pointer", position: "relative",
                  transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: "3px",
                  left: form.isActive ? "19px" : "3px",
                  width: "14px", height: "14px", borderRadius: "50%",
                  background: "#ffffff", transition: "left 0.2s",
                }} />
              </button>
              <span style={{ fontSize: "0.78rem", color: "#6B6260" }}>
                {form.isActive ? "Usuario activo" : "Usuario inactivo"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "2rem" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "0.65rem",
                background: "none", border: "1px solid rgba(12,12,10,0.12)",
                borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#6B6260", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                flex: 1, padding: "0.65rem",
                background: saving ? "rgba(201,146,75,0.4)" : "#C9924B",
                border: "none", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#ffffff",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function GestionarUsuariosPage() {
  const [users, setUsers] = useState<OperationUser[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<OperationUser | null>(null)

  const roleOptions = useMemo(
    () => [
      { value: "", label: "Todos los roles" },
      ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
    ],
    [],
  )

  async function loadUsers() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (search.trim()) query.set("search", search.trim())
      if (roleFilter) query.set("role", roleFilter)

      const endpoint = query.toString()
        ? `${ENDPOINTS.OPERATIONS.USERS}?${query.toString()}`
        : ENDPOINTS.OPERATIONS.USERS

      const response = await api.get<ListUsersResponse>(endpoint)
      setUsers(response.data.data)
    } catch {
      toast.error("No se pudo cargar la lista de usuarios.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaved(updated: OperationUser) {
    setUsers((prev) =>
      prev.map((u) => (u.userId === updated.userId ? { ...u, ...updated } : u)),
    )
    setEditUser(null)
  }

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
      }}>GU</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Agente Operativo
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Gestión de Usuarios
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Visualiza y edita usuarios del sistema desde el módulo operativo.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Filter + search bar */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto auto", gap: "10px", alignItems: "stretch",
          }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px", padding: "0 1rem",
            }}>
              <Search size={14} style={{ color: "#9A9489", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, cliente o NIT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void loadUsers()}
                style={{
                  flex: 1, padding: "0.7rem 0",
                  background: "none", border: "none", outline: "none",
                  fontSize: "0.82rem", color: "#F5F2EC",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6260", display: "flex" }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Role select */}
            <div style={{
              position: "relative",
              background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px", padding: "0 2rem 0 0.85rem",
              display: "flex", alignItems: "center",
            }}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "#F5F2EC", fontSize: "0.78rem", cursor: "pointer",
                  padding: "0.7rem 0", appearance: "none", width: "100%",
                }}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: "#1E1E1B" }}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: "0.65rem", color: "#9A9489", pointerEvents: "none" }} />
            </div>

            {/* Refresh button */}
            <button
              onClick={() => void loadUsers()}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "0 1.25rem",
                background: "#C9924B", border: "none", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Actualizar
            </button>
          </div>
        </motion.div>

        {/* Count */}
        {!loading && users.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
            {users.length} usuario{users.length !== 1 ? "s" : ""}
          </motion.p>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Cargando usuarios...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <Users size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
              Sin usuarios
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6B6260" }}>
              No se encontraron usuarios con los filtros actuales.
            </p>
          </div>
        )}

        {/* Table header */}
        {!loading && users.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.8fr 1.1fr 1.5fr 0.6fr 0.5fr",
            gap: "0 1rem", padding: "0 1.25rem 0.5rem",
            borderBottom: "1px solid rgba(12,12,10,0.1)",
            marginBottom: "8px",
          }}>
            {["Nombre", "Correo", "Rol", "Cliente", "Estado", ""].map((h) => (
              <span key={h} style={{ fontSize: "0.48rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                {h}
              </span>
            ))}
          </div>
        )}

        {/* User rows */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <AnimatePresence>
              {users.map((user, i) => (
                <motion.div key={user.userId}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, ease: EASE }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1.8fr 1.1fr 1.5fr 0.6fr 0.5fr",
                    gap: "0 1rem", alignItems: "center",
                    background: "#ffffff",
                    border: "1px solid rgba(12,12,10,0.07)",
                    borderLeft: `3px solid ${user.isActive ? "rgba(58,142,42,0.5)" : "rgba(229,62,62,0.4)"}`,
                    borderRadius: "4px", padding: "0.85rem 1.25rem",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    cursor: "default",
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = "0 4px 14px rgba(12,12,10,0.06)"
                    el.style.transform = "translateY(-1px)"
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = "none"
                    el.style.transform = "translateY(0)"
                  }}
                >
                  {/* Nombre */}
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.fullName}
                  </p>

                  {/* Correo */}
                  <p style={{ fontSize: "0.75rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </p>

                  {/* Rol */}
                  <div>
                    <span style={{
                      display: "inline-block",
                      background: "rgba(201,146,75,0.08)", borderRadius: "3px",
                      padding: "2px 8px",
                      fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em",
                      color: "#C9924B",
                    }}>
                      {ROLE_LABEL[user.role] || user.role || "Usuario"}
                    </span>
                  </div>

                  {/* Cliente */}
                  <p style={{ fontSize: "0.72rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.clientCode && user.clientName ? `${user.clientCode} — ${user.clientName}` : "—"}
                  </p>

                  {/* Estado */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                      background: user.isActive ? "#3A8E2A" : "#E53E3E",
                    }} />
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: user.isActive ? "#3A8E2A" : "#E53E3E" }}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Editar */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setEditUser(user)}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        padding: "0.4rem 0.75rem",
                        background: "none", border: "1px solid rgba(12,12,10,0.12)",
                        borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#6B6260", cursor: "pointer",
                        transition: "border-color 0.2s, color 0.2s, background 0.2s",
                      }}
                      onMouseOver={e => {
                        const el = e.currentTarget
                        el.style.borderColor = "#C9924B"
                        el.style.color = "#C9924B"
                        el.style.background = "rgba(201,146,75,0.06)"
                      }}
                      onMouseOut={e => {
                        const el = e.currentTarget
                        el.style.borderColor = "rgba(12,12,10,0.12)"
                        el.style.color = "#6B6260"
                        el.style.background = "none"
                      }}
                    >
                      <Pencil size={11} />
                      Editar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={handleSaved}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
