"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import { toast } from "sonner"
import { Shield, Mail, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error("Por favor completa todos los campos")

    setLoading(true)
    try {
      await login(email, password)
      toast.success("Bienvenido al sistema")
    } catch (error: any) {
      console.error("Login failed:", error)
      // El api wrapper ya muestra toast.error por defecto
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A3B7C]/5 px-6 font-body">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none" 
           style={{ backgroundImage: "url('/images/background-pattern.svg')" }}></div>
      
      <Card className="w-full max-w-md p-10 rounded-3xl shadow-2xl bg-white/90 backdrop-blur-md border-black/5 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#0A3B7C] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0A3B7C]/20">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0A3B7C] text-center">Inicia Sesión</h1>
          <p className="text-[#64748B] mt-2 text-center">Accede a la plataforma LogiTrans</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0A3B7C] uppercase tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0A3B7C] transition-colors" size={20} />
              <input 
                type="email"
                placeholder="usuario@logitrans.gt"
                className="w-full bg-[#0A3B7C]/5 border border-black/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 transition-all text-[#1A202C]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0A3B7C] uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0A3B7C] transition-colors" size={20} />
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0A3B7C]/5 border border-black/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 transition-all text-[#1A202C]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            className="w-full bg-[#0A3B7C] hover:bg-[#082D5E] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#0A3B7C]/20 transition-all active:scale-[0.98]"
            loading={loading}
          >
            Ingresar al Portal
          </Button>
        </form>

        <div className="mt-10 pt-8 border-t border-black/5 text-center">
          <p className="text-[#64748B] text-sm">
            ¿Olvidaste tu contraseña? <span className="text-[#0A3B7C] font-bold cursor-pointer hover:underline">Recupérala aquí</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
