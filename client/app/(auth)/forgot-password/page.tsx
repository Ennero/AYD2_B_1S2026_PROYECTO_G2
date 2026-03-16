"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { Mail, KeyRound, Lock } from "lucide-react"
import { api } from "@/lib/api/client"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  
  // Step 1 state
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isSendingToken, setIsSendingToken] = useState(false)
  const [tokenSent, setTokenSent] = useState(false)

  // Step 2 state
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isChanging, setIsChanging] = useState(false)

  const handleSendToken = async () => {
    if (!email) {
      toast.error("Ingresa tu correo para recibir el token")
      return
    }

    try {
      setIsSendingToken(true)
      await api.post("/api/auth/recovery", { email })
      toast.success("Token enviado a tu correo")
      setTokenSent(true)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al solicitar token")
    } finally {
      setIsSendingToken(false)
    }
  }

  const handleValidateToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenSent) {
      toast.error("Primero debes solicitar el token")
      return
    }
    if (!token) {
      toast.error("Ingresa el token recibido")
      return
    }
    setStep(2)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmation) {
      toast.error("Completa ambos campos")
      return
    }
    if (password !== confirmation) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    try {
      setIsChanging(true)
      // The backend expects token as Bearer authorization
      await api.post("/api/auth/password", { password, confirmation }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success("Contraseña actualizada exitosamente")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Token inválido o error al cambiar la contraseña")
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <Card className="w-full p-8 sm:p-10 shadow-xl bg-surface rounded-2xl border border-black/5">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">LOGITRANS</h1>
        <p className="text-text-muted text-sm italic">
          {step === 1 ? "Recuperación de cuenta" : "Crea tu nueva contraseña"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleValidateToken} className="space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <Input
                label="Correo"
                type="email"
                placeholder="ejemplo@logitrans.com.gt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSendingToken}
                className="pl-11"
              />
              <Mail className="w-5 h-5 text-text-muted absolute left-3 top-[34px] group-focus-within:text-primary transition-colors" />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendToken}
                disabled={isSendingToken || !email}
                className="text-xs text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline disabled:opacity-50"
              >
                {isSendingToken ? "Enviando..." : "Enviar token único"}
              </button>
            </div>
          </div>

          <div className="relative group pt-4">
            <Input
              label="Token recibido"
              type="text"
              placeholder="Ingresa el código"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pl-11"
            />
            <KeyRound className="w-5 h-5 text-text-muted absolute left-3 top-[66px] group-focus-within:text-primary transition-colors" />
          </div>

          <Button
            type="submit"
            className="w-full py-6 mt-6 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={!tokenSent || !token}
          >
            Validar Token
          </Button>

          <div className="text-center mt-6">
             <Link href="/login" className="text-sm text-text-muted hover:text-primary transition-colors">
               ← Volver al login
             </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="relative group">
            <Input
              label="Nueva Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isChanging}
              className="pl-11"
              required
            />
            <Lock className="w-5 h-5 text-text-muted absolute left-3 top-[34px] group-focus-within:text-primary transition-colors" />
          </div>

          <div className="relative group">
            <Input
              label="Confirmar Contraseña"
              type="password"
              placeholder="••••••••"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isChanging}
              className="pl-11"
              required
            />
            <Lock className="w-5 h-5 text-text-muted absolute left-3 top-[34px] group-focus-within:text-primary transition-colors" />
          </div>

          <Button
            type="submit"
            className="w-full py-6 mt-6 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all"
            loading={isChanging}
          >
            Cambiar
          </Button>

          <div className="text-center mt-6">
             <button
               type="button"
               onClick={() => setStep(1)}
               className="text-sm text-text-muted hover:text-primary transition-colors"
             >
               ← Volver
             </button>
          </div>
        </form>
      )}
    </Card>
  )
}
