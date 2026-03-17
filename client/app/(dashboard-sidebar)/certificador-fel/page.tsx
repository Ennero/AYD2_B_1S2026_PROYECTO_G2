"use client"

import Link from "next/link";
import { Clock as ClockIcon, ShieldCheck, CheckCircle, FileText } from 'lucide-react';
import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { CertifierSummary } from "@/lib/api/types";

export default function CertificadorFelPage() {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<CertifierSummary>({
    pendingInvoices: 0,
    certifiedCount: 0,
  })

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    
    const fetchSummary = async () => {
      try {
        const response = await api.get<{ data: CertifierSummary }>(ENDPOINTS.CERTIFIER.SUMMARY)
        setSummary(response.data.data)
      } catch (error) {
        console.error("Error fetching summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* HD Minimalist Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/images/certificador-minimal-hd.png')" }}
      />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-20 flex flex-col items-center text-center max-w-7xl mx-auto">
        
        {/* Top Section - Welcome */}
        <div className="max-w-4xl mb-16 mt-8">
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-[#0A3B7C] tracking-tight leading-tight">
            Portal Tributario <br />
            <span className="text-[#53B73E]">Certificador FEL</span>
          </h1>
          <p className="text-[#64748B] text-xl md:text-2xl mt-6 font-light max-w-3xl mx-auto">
            Sistema de validación y certificación de Documentos Tributarios Electrónicos (DTE) para operaciones LogiTrans en cumplimiento con SAT.
          </p>
        </div>

        {/* Action & Stats Section - Re-distributed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">
          
          {/* Main Action Card - Larger/Highlighted */}
          <Link href="/certificador-fel/bandeja" className="lg:col-span-1 block outline-none group">
            <div className="bg-white/90 backdrop-blur-md border border-black/5 hover:border-[#53B73E]/40 rounded-3xl p-10 h-full transition-all duration-300 transform group-hover:-translate-y-2 shadow-sm group-hover:shadow-[0_20px_50px_rgba(10,59,124,0.1)] flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-[#53B73E]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#53B73E]/20 transition-colors">
                <FileText size={40} className="text-[#53B73E]" />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-bold text-[#0A3B7C] mb-4">Ir a Bandeja</h3>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  Acceso a documentos fiscales pendientes de aprobación y firma electrónica.
                </p>
              </div>
              <div className="mt-4 text-[#53B73E] font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Validar DTE <span>→</span>
              </div>
            </div>
          </Link>

          {/* Stats Cards */}
          <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center">
             <div className="text-[#64748B] text-sm font-semibold uppercase tracking-[0.2em]">Documentos Pendientes</div>
             <div className="flex flex-col items-center">
                 <div className="text-7xl font-heading font-extrabold text-[#0A3B7C]">{summary.pendingInvoices}</div>
                 <div className="w-12 h-1.5 bg-[#53B73E]/20 rounded-full mt-4"></div>
             </div>
             <p className="text-[#64748B] text-base mt-2">En cola de revisión</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-black/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center">
             <div className="text-[#64748B] text-sm font-semibold uppercase tracking-[0.2em]">Certificados Hoy</div>
             <div className="flex flex-col items-center">
                 <div className="text-7xl font-heading font-extrabold text-[#53B73E]">{summary.certifiedCount}</div>
                 <div className="w-12 h-1.5 bg-[#0A3B7C]/10 rounded-full mt-4"></div>
             </div>
             <div className="flex items-center gap-2 text-[#53B73E] font-medium text-base">
               <CheckCircle size={24} />
               DTE Emitidos
             </div>
          </div>
        </div>

        {/* Footer Status Indicators - Minimalist */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-4 px-8 py-4 bg-white/60 rounded-full border border-black/5 shadow-sm">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#53B73E]"></span>
                </span>
                <span className="text-[#0A3B7C] text-sm font-bold tracking-widest uppercase">Conexión SAT Activa</span>
            </div>
            <div className="flex items-center gap-4 px-8 py-4 bg-white/60 rounded-full border border-black/5 shadow-sm">
                <ShieldCheck size={24} className="text-[#0A3B7C]/60" />
                <span className="text-[#0A3B7C] text-sm font-bold tracking-widest uppercase">Simulador Operativo</span>
            </div>
        </div>

      </div>
    </div>
  )
}
