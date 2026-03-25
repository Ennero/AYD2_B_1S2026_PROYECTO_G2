"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users, Plus, Pencil, Trash2, X,
  Mail, Phone, Briefcase, Search, UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Contact {
  contactId: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  positionTitle: string | null
}

interface ContactForm {
  contactName: string
  contactEmail: string
  contactPhone: string
  positionTitle: string
}

const EMPTY_FORM: ContactForm = { contactName: "", contactEmail: "", contactPhone: "", positionTitle: "" }

/* ─── Avatar ─────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  { bg: "rgba(201,146,75,0.12)", color: "#C9924B" },
  { bg: "rgba(58,142,42,0.10)",  color: "#3A8E2A" },
  { bg: "rgba(37,99,235,0.10)",  color: "#2563EB" },
  { bg: "rgba(139,92,246,0.10)", color: "#8B5CF6" },
  { bg: "rgba(229,62,62,0.10)",  color: "#E53E3E" },
]

function ContactAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const { bg, color } = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div style={{
      width: "40px", height: "40px", borderRadius: "6px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: bg, color, fontSize: "0.82rem", fontWeight: 900, letterSpacing: "-0.02em",
    }}>
      {initials}
    </div>
  )
}

/* ─── Field component ───────────────────────────────────────────────────── */

function FormField({
  label, type = "text", value, onChange, placeholder, disabled,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
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
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "0.6rem 0.85rem",
          background: disabled ? "rgba(12,12,10,0.03)" : "#F5F2EC",
          border: "1px solid rgba(12,12,10,0.12)",
          borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem",
          outline: "none", transition: "border-color 0.15s",
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "#C9924B" }}
        onBlur={e => { e.target.style.borderColor = "rgba(12,12,10,0.12)" }}
      />
    </div>
  )
}

/* ─── Contact Modal ─────────────────────────────────────────────────────── */

function ContactModal({
  open, editing, onClose, onSaved,
}: {
  open: boolean
  editing: Contact | null
  onClose: () => void
  onSaved: (contact: Contact) => void
}) {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { contactName: editing.contactName, contactEmail: editing.contactEmail, contactPhone: editing.contactPhone ?? "", positionTitle: editing.positionTitle ?? "" }
        : EMPTY_FORM
      )
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contactName.trim() || !form.contactEmail.trim()) {
      toast.error("Nombre y correo son obligatorios")
      return
    }
    setSaving(true)
    try {
      const payload = {
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        positionTitle: form.positionTitle.trim() || undefined,
      }
      let contact: Contact
      if (editing) {
        const res = await api.patch<{ data: Contact }>(ENDPOINTS.CLIENT.CONTACT(editing.contactId), payload)
        contact = res.data.data
      } else {
        const res = await api.post<{ data: Contact }>(ENDPOINTS.CLIENT.CONTACTS, payload)
        contact = res.data.data
      }
      toast.success(editing ? "Contacto actualizado correctamente" : "Contacto agregado correctamente")
      onSaved(contact)
      onClose()
    } catch {
      // api client shows toast
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: "6px",
          width: "100%", maxWidth: "460px", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(12,12,10,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: "3px", background: "#C9924B" }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <UserPlus size={15} style={{ color: "#C9924B" }} />
            <h2 style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
              {editing ? "Editar Contacto" : "Nuevo Contacto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "30px", height: "30px", borderRadius: "4px", display: "flex",
              alignItems: "center", justifyContent: "center", background: "rgba(12,12,10,0.04)",
              border: "1px solid rgba(12,12,10,0.08)", color: "#9A9489", cursor: "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.08)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FormField label="Nombre completo *" value={form.contactName} onChange={(v) => setForm((f) => ({ ...f, contactName: v }))} placeholder="Ej. María García" disabled={saving} />
          <FormField label="Correo electrónico *" type="email" value={form.contactEmail} onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))} placeholder="contacto@empresa.com" disabled={saving} />
          <FormField label="Teléfono" value={form.contactPhone} onChange={(v) => setForm((f) => ({ ...f, contactPhone: v }))} placeholder="+502 5555-0000" disabled={saving} />
          <FormField label="Cargo / Puesto" value={form.positionTitle} onChange={(v) => setForm((f) => ({ ...f, positionTitle: v }))} placeholder="Ej. Gerente de Logística" disabled={saving} />

          <div style={{ display: "flex", gap: "10px", paddingTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: "0.65rem 1rem",
                background: saving ? "rgba(201,146,75,0.5)" : "#C9924B",
                border: "none", borderRadius: "4px", color: "#ffffff",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseOver={e => { if (!saving) e.currentTarget.style.background = "#b5833f" }}
              onMouseOut={e => { if (!saving) e.currentTarget.style.background = "#C9924B" }}
            >
              {saving ? "Guardando…" : (editing ? "Guardar cambios" : "Agregar contacto")}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "0.65rem 1.1rem", background: "none",
                border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                color: "#6B6260", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer", transition: "border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get<{ data: Contact[] }>(ENDPOINTS.CLIENT.CONTACTS)
      setContacts(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchContacts() }, [fetchContacts])

  const handleSaved = (contact: Contact) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.contactId === contact.contactId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = contact
        return updated
      }
      return [...prev, contact].sort((a, b) => a.contactName.localeCompare(b.contactName))
    })
  }

  const handleDelete = async (contactId: string) => {
    setDeleting(contactId)
    try {
      await api.delete(ENDPOINTS.CLIENT.CONTACT(contactId))
      toast.success("Contacto eliminado")
      setContacts((prev) => prev.filter((c) => c.contactId !== contactId))
    } catch {
      // api client shows toast
    } finally {
      setDeleting(null)
    }
  }

  const filtered = contacts.filter((c) =>
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
    (c.positionTitle ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <ContactModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
        <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
          backgroundSize: "72px 72px",
        }} />
        <div aria-hidden style={{
          position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
          fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
          color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}>CK</div>

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-14">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
                  Portal Cliente
                </p>
                <div style={{ overflow: "hidden" }}>
                  <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
                    transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
                    style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
                    Contactos Clave
                  </motion.h1>
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
                  Personas de tu empresa autorizadas para coordinar con LogiTrans.
                </motion.p>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <button
                  onClick={() => { setEditing(null); setModalOpen(true) }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "0.6rem 1.1rem", background: "#C9924B", border: "none",
                    borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#b5833f")}
                  onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}
                >
                  <Plus size={12} />
                  Agregar Contacto
                </button>
              </motion.div>
            </div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
              style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "1rem 1.25rem", marginBottom: "1rem",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
            }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "340px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, correo o cargo..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  paddingLeft: "32px", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem",
                  background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.12)",
                  borderRadius: "4px", color: "#0C0C0A", fontSize: "0.82rem", outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#C9924B")}
                onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.12)")}
              />
            </div>
            <p style={{ fontSize: "0.62rem", color: "#9A9489", flexShrink: 0 }}>
              {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: "72px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "4rem 2rem", textAlign: "center",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "6px",
                background: "rgba(201,146,75,0.08)", margin: "0 auto 1rem",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={22} style={{ color: "rgba(201,146,75,0.5)" }} />
              </div>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "4px" }}>
                {search ? "Sin resultados" : "Aún no hay contactos"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9A9489", marginBottom: "1.5rem" }}>
                {search
                  ? "Intenta con otro término de búsqueda."
                  : "Agrega el primer contacto clave de tu empresa."}
              </p>
              {!search && (
                <button
                  onClick={() => { setEditing(null); setModalOpen(true) }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "0.55rem 1.1rem", background: "#C9924B", border: "none",
                    borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                  }}
                >
                  <Plus size={12} />
                  Agregar contacto
                </button>
              )}
            </div>
          )}

          {/* Contact list */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((contact, i) => (
                <motion.div key={contact.contactId}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.5, ease: EASE }}>
                  <div
                    style={{
                      background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                      borderRadius: "6px", padding: "1rem 1.25rem",
                      display: "flex", alignItems: "center", gap: "1rem",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(12,12,10,0.06)"; const btns = (e.currentTarget as HTMLDivElement).querySelectorAll("[data-action]"); btns.forEach((b) => ((b as HTMLElement).style.opacity = "1")) }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; const btns = (e.currentTarget as HTMLDivElement).querySelectorAll("[data-action]"); btns.forEach((b) => ((b as HTMLElement).style.opacity = "0")) }}
                  >
                    <ContactAvatar name={contact.contactName} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contact.contactName}
                      </p>
                      {contact.positionTitle && (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                          <Briefcase size={10} style={{ color: "#9A9489", flexShrink: 0 }} />
                          <span style={{ fontSize: "0.68rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.positionTitle}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 1rem", marginTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Mail size={10} style={{ color: "#C9924B", flexShrink: 0 }} />
                          <span style={{ fontSize: "0.68rem", color: "#6B6260" }}>{contact.contactEmail}</span>
                        </div>
                        {contact.contactPhone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Phone size={10} style={{ color: "#C9924B", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.68rem", color: "#6B6260" }}>{contact.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <button
                        data-action="edit"
                        onClick={() => { setEditing(contact); setModalOpen(true) }}
                        title="Editar"
                        style={{
                          width: "30px", height: "30px", borderRadius: "4px", display: "flex",
                          alignItems: "center", justifyContent: "center", opacity: 0,
                          background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
                          color: "#6B6260", cursor: "pointer", transition: "opacity 0.15s, background 0.15s",
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(201,146,75,0.10)")}
                        onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        data-action="delete"
                        onClick={() => void handleDelete(contact.contactId)}
                        disabled={deleting === contact.contactId}
                        title="Eliminar"
                        style={{
                          width: "30px", height: "30px", borderRadius: "4px", display: "flex",
                          alignItems: "center", justifyContent: "center", opacity: 0,
                          background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
                          color: "#6B6260", cursor: deleting === contact.contactId ? "not-allowed" : "pointer",
                          transition: "opacity 0.15s, background 0.15s",
                        }}
                        onMouseOver={e => { if (deleting !== contact.contactId) e.currentTarget.style.background = "rgba(229,62,62,0.08)" }}
                        onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
                      >
                        <Trash2 size={13} style={{ color: deleting === contact.contactId ? "#9A9489" : undefined }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
