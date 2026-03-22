"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

/* ─── Password input with show/hide ─────────────────────────────────────── */

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

/* ─── Inner component (needs useSearchParams) ───────────────────────────── */

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Warn if no token in URL
  const tokenMissing = !token

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmation) {
      toast.error("Completa ambos campos")
      return
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (password !== confirmation) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      await api.post(
        ENDPOINTS.AUTH.RESET_PASSWORD,
        { password, confirmation },
        {
          skipAuth: true,
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setSuccess(true)
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.")
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      // api client shows toast
    } finally {
      setIsLoading(false)
    }
  }

  /* Success state */
  if (success) {
    return (
      <Card className="w-full p-8 sm:p-10 shadow-xl bg-white rounded-2xl border border-black/5 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-[#53B73E]/15 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-[#3A8E2A]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#1A202C] mb-2">¡Contraseña actualizada!</h2>
        <p className="text-sm text-[#64748B] mb-6">
          Tu contraseña ha sido restablecida correctamente. Serás redirigido al login en unos segundos.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[#0A3B7C] hover:underline"
        >
          Ir al inicio de sesión →
        </Link>
      </Card>
    )
  }

  /* Token missing state */
  if (tokenMissing) {
    return (
      <Card className="w-full p-8 sm:p-10 shadow-xl bg-white rounded-2xl border border-black/5 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#1A202C] mb-2">Enlace inválido</h2>
        <p className="text-sm text-[#64748B] mb-6">
          El enlace de recuperación no contiene un token válido. Solicita uno nuevo desde la página de recuperación.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#0A3B7C] hover:underline"
        >
          Solicitar nuevo enlace →
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full p-8 sm:p-10 shadow-xl bg-white rounded-2xl border border-black/5">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0A3B7C]/10 flex items-center justify-center">
            <Lock size={26} className="text-[#0A3B7C]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight mb-1">
          Nueva contraseña
        </h1>
        <p className="text-sm text-[#64748B]">
          Elige una contraseña segura para tu cuenta de LogiTrans
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <PasswordInput
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 6 caracteres"
          disabled={isLoading}
        />
        <PasswordInput
          label="Confirmar contraseña"
          value={confirmation}
          onChange={setConfirmation}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full py-3 rounded-xl font-semibold"
          loading={isLoading}
        >
          Guardar nueva contraseña
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="text-sm text-[#64748B] hover:text-[#0A3B7C] transition-colors"
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    </Card>
  )
}

/* ─── Page export — wraps in Suspense for useSearchParams ───────────────── */

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full p-10 shadow-xl bg-white rounded-2xl border border-black/5">
          <div className="space-y-4 animate-pulse">
            <div className="h-14 w-14 rounded-2xl bg-[#0A3B7C]/10 mx-auto" />
            <div className="h-6 w-48 bg-[#0A3B7C]/10 rounded-lg mx-auto" />
            <div className="h-10 rounded-lg bg-gray-100" />
            <div className="h-10 rounded-lg bg-gray-100" />
            <div className="h-12 rounded-xl bg-[#0A3B7C]/15" />
          </div>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
