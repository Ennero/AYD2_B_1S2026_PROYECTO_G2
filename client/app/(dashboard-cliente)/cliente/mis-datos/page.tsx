"use client"

import { useEffect, useState } from "react"
import {
  Lock,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

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

/* ─── Section divider ───────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-[#0A3B7C] pb-2 border-b border-[#0A3B7C]/15 mb-4">
      {children}
    </h3>
  )
}

/* ─── Read-only field pair ──────────────────────────────────────────────── */

function FieldPair({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      <p className="font-semibold text-[#1A202C] text-sm">
        {value ?? <span className="italic text-[#94A3B8]">—</span>}
      </p>
    </div>
  )
}

/* ─── Password input with show/hide toggle ──────────────────────────────── */

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        label={label}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        disabled={disabled}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-[34px] text-[#64748B] hover:text-[#0A3B7C] transition-colors cursor-pointer"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

export default function MisDatosPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Change password state
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [savingPwd, setSavingPwd] = useState(false)

  // Recovery email state
  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ data: ClientProfile }>(ENDPOINTS.CLIENT.PROFILE)
      setProfile(res.data.data)
    } catch {
      // api client already shows toast
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfile()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error("La nueva contraseña y la confirmación no coinciden")
      return
    }
    if (newPwd.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    setSavingPwd(true)
    try {
      await api.patch(ENDPOINTS.CLIENT.CHANGE_PASSWORD, {
        currentPassword: currentPwd,
        newPassword: newPwd,
      })
      toast.success("Contraseña actualizada correctamente")
      setShowChangeForm(false)
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
    } catch {
      // api client already shows toast
    } finally {
      setSavingPwd(false)
    }
  }

  const handleSendRecovery = async () => {
    if (!profile?.user.email) return
    setSendingRecovery(true)
    try {
      await api.post(
        ENDPOINTS.AUTH.RECOVERY,
        { email: profile.user.email },
        { skipAuth: true, silentError: true },
      )
      setRecoverySent(true)
      toast.success(`Enlace de recuperación enviado a ${profile.user.email}`)
    } catch {
      toast.error("No se pudo enviar el correo. Intenta más tarde.")
    } finally {
      setSendingRecovery(false)
    }
  }

  /* Skeleton */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-9 w-72 bg-[#0A3B7C]/10 rounded-xl animate-pulse mx-auto mb-6" />
        <div className="bg-white rounded-2xl h-56 animate-pulse" />
        <div className="bg-white rounded-2xl h-40 animate-pulse" />
      </div>
    )
  }

  if (!profile) return null

  const { user, company } = profile

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Page title */}
      <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-[#1A202C] tracking-tight uppercase">
        Mi Perfil Empresarial
      </h1>

      {/* Blocked alert */}
      {company?.isBlocked && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Cuenta bloqueada</p>
            {company.blockReason && (
              <p className="text-sm text-red-600 mt-0.5">{company.blockReason}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Datos Fiscales ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-5">
        <SectionTitle>Datos Fiscales (Solo Lectura)</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldPair label="Razón Social" value={company?.legalName} />
          <FieldPair label="NIT" value={company?.nit} />
          <FieldPair label="Nombre Comercial" value={company?.commercialName} />
          <FieldPair label="Código de Cliente" value={company?.clientCode} />
          <div className="sm:col-span-2">
            <FieldPair label="Dirección Fiscal" value={company?.taxAddress} />
          </div>
        </div>

        {/* Contact info sub-section */}
        <div className="pt-4 border-t border-[#F4F7F9]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
            Contacto Principal
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldPair label="Nombre" value={company?.primaryContactName} />
            <FieldPair label="Correo" value={company?.primaryContactEmail} />
            <FieldPair label="Teléfono de empresa" value={company?.primaryContactPhone} />
            <FieldPair label="Teléfono de portal" value={user.phone} />
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] pt-2">
          Para modificar razón social, NIT o dirección fiscal, contacta a tu agente operativo.
        </p>
      </div>

      {/* ── Cuenta ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-4">
        <SectionTitle>Cuenta</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldPair label="Nombre de usuario" value={user.fullName} />
          <FieldPair label="Correo de acceso" value={user.email} />
          <div className="flex items-center gap-2 sm:col-span-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                user.isActive
                  ? "bg-[#53B73E]/10 text-[#3A8E2A]"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <CheckCircle2 size={12} />
              {user.isActive ? "Cuenta activa" : "Cuenta inactiva"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Seguridad ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-4">
        <SectionTitle>Seguridad</SectionTitle>

        {/* Password row */}
        <div className="flex items-center justify-between py-3 border border-[#F1F5F9] rounded-xl px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0A3B7C]/8 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-[#0A3B7C]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A202C]">Contraseña de Acceso</p>
              <p className="text-xs text-[#64748B]">Última actualización desconocida</p>
            </div>
          </div>
          {!showChangeForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangeForm(true)}
            >
              Cambiar Clave
            </Button>
          )}
        </div>

        {/* Inline change-password form */}
        {showChangeForm && (
          <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4 pt-2">
            <PasswordInput
              label="Contraseña actual"
              value={currentPwd}
              onChange={setCurrentPwd}
              disabled={savingPwd}
            />
            <PasswordInput
              label="Nueva contraseña"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="Mínimo 6 caracteres"
              disabled={savingPwd}
            />
            <PasswordInput
              label="Confirmar nueva contraseña"
              value={confirmPwd}
              onChange={setConfirmPwd}
              disabled={savingPwd}
            />
            <div className="flex gap-3 pt-1">
              <Button type="submit" size="sm" loading={savingPwd}>
                Guardar contraseña
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowChangeForm(false)
                  setCurrentPwd("")
                  setNewPwd("")
                  setConfirmPwd("")
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Recovery divider */}
        <div className="border-t border-[#F1F5F9] pt-4">
          <p className="text-sm font-semibold text-[#1A202C] mb-1">Recuperación por correo</p>
          <p className="text-xs text-[#64748B] mb-3">
            ¿Olvidaste tu contraseña actual? Te enviaremos un enlace seguro a{" "}
            <span className="font-medium text-[#0A3B7C]">{user.email}</span> para
            restablecerla sin necesidad de la contraseña actual.
          </p>

          {recoverySent ? (
            <div className="flex items-center gap-2 text-[#3A8E2A] text-sm font-medium">
              <CheckCircle2 size={16} />
              Enlace enviado. Revisa tu bandeja de entrada.
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              loading={sendingRecovery}
              onClick={() => void handleSendRecovery()}
            >
              <Send size={14} />
              Enviar enlace de recuperación
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
