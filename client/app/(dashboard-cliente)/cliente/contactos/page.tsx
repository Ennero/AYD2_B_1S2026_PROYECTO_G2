"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Briefcase,
  Search,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils/cn"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import {
  buildPrefixedPhone,
  normalizeLocalPhone,
  PHONE_COUNTRIES,
  splitPrefixedPhone,
  type PhoneCountryCode,
} from "@/lib/utils/phone"

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
  contactPhoneCountry: PhoneCountryCode
  contactPhoneLocal: string
  positionTitle: string
}

const EMPTY_FORM: ContactForm = {
  contactName: "",
  contactEmail: "",
  contactPhoneCountry: "+502",
  contactPhoneLocal: "",
  positionTitle: "",
}

/* ─── Avatar inicial ────────────────────────────────────────────────────── */

function ContactAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const colors = [
    "bg-[#095556]/15 text-[#095556]",
    "bg-[#53B73E]/15 text-[#3A8E2A]",
    "bg-[#0A3B7C]/15 text-[#0A3B7C]",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0", color)}>
      {initials}
    </div>
  )
}

/* ─── Modal de agregar / editar ──────────────────────────────────────────── */

function ContactModal({
  open,
  editing,
  onClose,
  onSaved,
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
      setForm(
        editing
          ? {
              contactName: editing.contactName,
              contactEmail: editing.contactEmail,
              contactPhoneCountry: splitPrefixedPhone(editing.contactPhone).countryCode,
              contactPhoneLocal: splitPrefixedPhone(editing.contactPhone).localNumber,
              positionTitle: editing.positionTitle ?? "",
            }
          : EMPTY_FORM,
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
        contactPhone: buildPrefixedPhone(form.contactPhoneCountry, form.contactPhoneLocal) || undefined,
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
      // api client already shows toast
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-black/5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#095556]/10 flex items-center justify-center">
              <UserPlus size={18} className="text-[#095556]" />
            </div>
            <h2 className="text-base font-bold text-[#1A202C]">
              {editing ? "Editar Contacto" : "Nuevo Contacto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1A202C] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          <Input
            label="Nombre completo *"
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            placeholder="Ej. María García"
            disabled={saving}
          />
          <Input
            label="Correo electrónico *"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            placeholder="contacto@empresa.com"
            disabled={saving}
          />
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0C0C0A", letterSpacing: "0.01em" }}>
              Teléfono
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.contactPhoneCountry}
                onChange={(e) => setForm((f) => ({ ...f, contactPhoneCountry: e.target.value as PhoneCountryCode }))}
                disabled={saving}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-white border border-black/15 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {PHONE_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>{country.label}</option>
                ))}
              </select>
              <input
                value={form.contactPhoneLocal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhoneLocal: normalizeLocalPhone(e.target.value) }))
                }
                placeholder="22001234"
                disabled={saving}
                className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-black/15 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">Formato guardado: +50X seguido de 8 dígitos.</p>
          </div>
          <Input
            label="Cargo / Puesto"
            value={form.positionTitle}
            onChange={(e) => setForm((f) => ({ ...f, positionTitle: e.target.value }))}
            placeholder="Ej. Gerente de Logística"
            disabled={saving}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? "Guardar cambios" : "Agregar contacto"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

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
      // api client already shows toast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchContacts()
  }, [fetchContacts])

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
      // api client already shows toast
    } finally {
      setDeleting(null)
    }
  }

  const openEdit = (contact: Contact) => {
    setEditing(contact)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const filtered = contacts.filter(
    (c) =>
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
      (c.positionTitle ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  /* Skeleton */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-9 w-64 bg-[#095556]/10 rounded-xl animate-pulse mb-6" />
        <div className="bg-white rounded-2xl h-16 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <ContactModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] tracking-tight uppercase">
              Contactos Clave
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Personas de tu empresa autorizadas para coordinar con LogiTrans.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Agregar Contacto
          </Button>
        </div>

        {/* Search + count */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o cargo..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#095556]/30 focus:border-[#095556]/50"
            />
          </div>
          <span className="text-xs text-[#94A3B8] shrink-0">
            {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#095556]/8 flex items-center justify-center">
              <Users size={26} className="text-[#095556]/50" />
            </div>
            <div>
              <p className="font-semibold text-[#1A202C]">
                {search ? "Sin resultados" : "Aún no hay contactos"}
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                {search
                  ? "Intenta con otro término de búsqueda."
                  : "Agrega el primer contacto clave de tu empresa."}
              </p>
            </div>
            {!search && (
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} />
                Agregar contacto
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contact) => (
              <div
                key={contact.contactId}
                className="bg-white rounded-2xl shadow-sm border border-black/5 px-5 py-4 flex items-center gap-4 group hover:shadow-md transition-shadow"
              >
                <ContactAvatar name={contact.contactName} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A202C] text-sm truncate">
                    {contact.contactName}
                  </p>
                  {contact.positionTitle && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Briefcase size={11} className="text-[#94A3B8] shrink-0" />
                      <span className="text-xs text-[#64748B] truncate">{contact.positionTitle}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="text-[#095556] shrink-0" />
                      <span className="text-xs text-[#475569] truncate">{contact.contactEmail}</span>
                    </div>
                    {contact.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-[#095556] shrink-0" />
                        <span className="text-xs text-[#475569]">{contact.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(contact)}
                    title="Editar"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0A3B7C] hover:bg-[#0A3B7C]/8 transition-colors cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => void handleDelete(contact.contactId)}
                    disabled={deleting === contact.contactId}
                    title="Eliminar"
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                      deleting === contact.contactId
                        ? "opacity-50 cursor-not-allowed"
                        : "text-[#64748B] hover:text-red-600 hover:bg-red-50",
                    )}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
