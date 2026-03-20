"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { UserPlus, NotebookPen, Globe2, FileSignature } from 'lucide-react';
import { useState, useEffect } from "react";

export default function AgenteOperativoPage() {
  const { user, loading } = useAuth()
  const userName = loading ? "..." : (user?.fullName ?? "Agente")
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* HD Minimalist Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-20 flex flex-col items-center text-center max-w-7xl mx-auto">
        
        {/* Top Section - Welcome */}
        <div className="max-w-4xl mb-16 mt-8">
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-[#0A3B7C] tracking-tight leading-tight">
            ¡Bienvenido <br />
            <span className="text-[#53B73E]">Área Comercial!</span>
          </h1>
          <p className="text-[#64748B] text-xl md:text-2xl mt-6 font-light max-w-2xl mx-auto">
            Panel de Control Operativo para la gestión regional de clientes y contratos comerciales LogiTrans.
          </p>
        </div>

        {/* Action Cards Section - Centered and Larger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
          <Link href="/agente-operativo/registrar-cliente" className="block outline-none group">
            <div className="bg-white/90 backdrop-blur-sm border border-black/5 hover:border-[#53B73E]/40 rounded-3xl p-10 h-full transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(10,59,124,0.1)] flex flex-col items-center text-center gap-6 shadow-sm">
              <div className="w-20 h-20 bg-[#0A3B7C]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#0A3B7C]/20 transition-colors">
                <UserPlus size={40} className="text-[#0A3B7C]" />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-bold text-[#0A3B7C] mb-4">Registrar Cliente</h3>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  Alta de nuevos clientes, registro de datos fiscales y evaluación de perfiles de riesgo operativo.
                </p>
              </div>
              <div className="mt-4 text-[#53B73E] font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Comenzar registro <span>→</span>
              </div>
            </div>
          </Link>

          <Link href="/agente-operativo/formalizar-contrato" className="block outline-none group">
            <div className="bg-white/90 backdrop-blur-sm border border-black/5 hover:border-[#53B73E]/40 rounded-3xl p-10 h-full transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(10,59,124,0.1)] flex flex-col items-center text-center gap-6 shadow-sm">
              <div className="w-20 h-20 bg-[#53B73E]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#53B73E]/20 transition-colors">
                <NotebookPen size={40} className="text-[#53B73E]" />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-bold text-[#0A3B7C] mb-4">Formalizar Contrato</h3>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  Vinculación de tarifas paramétricas, definición de rutas y condiciones logísticas para contratos activos.
                </p>
              </div>
              <div className="mt-4 text-[#53B73E] font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Crear contrato <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="mt-20 flex gap-4 text-[#0A3B7C]/20">
          <Globe2 size={40} strokeWidth={1} />
          <FileSignature size={40} strokeWidth={1} />
        </div>

      </div>
    </div>
  )
}
