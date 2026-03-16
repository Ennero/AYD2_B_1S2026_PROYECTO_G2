"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos")
      return
    }

    try {
      setIsLoading(true)
      await login(email, password)
      toast.success("¡Bienvenido/a de nuevo!")
    } catch (error: any) {
      toast.error(error.message || "Credenciales inválidas, intenta nuevamente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full p-8 sm:p-10 shadow-xl bg-surface rounded-2xl border border-black/5">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">LOGITRANS</h1>
        <p className="text-text-muted text-sm">Ingresa tus credenciales para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="ejemplo@logitrans.com.gt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-11"
            required
          />
          <Mail className="w-5 h-5 text-text-muted absolute left-3 top-[34px] group-focus-within:text-primary transition-colors" />
        </div>

        <div className="relative group">
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pl-11"
            required
          />
          <Lock className="w-5 h-5 text-text-muted absolute left-3 top-[34px] group-focus-within:text-primary transition-colors" />
        </div>

        <div className="flex justify-end mt-2">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline transition-colors block"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full py-6 mt-6 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all"
          loading={isLoading}
        >
          Iniciar Sesión
        </Button>
      </form>
    </Card>
  )
}
