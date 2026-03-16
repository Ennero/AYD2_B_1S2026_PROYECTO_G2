"use client"

import { useAuth } from "@/hooks/useAuth"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { PackageOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function EncargadoPatioPage() {
  const { user } = useAuth()

  // Fake fallback name just in case the backend hasn't loaded 
  // or user obj is slightly different shape
  const fallbackName = user ? (user.nombre || user.email?.split("@")[0] || "Encargado") : "Marcos Bukele"

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 py-8 relative">
      <Card className="w-full text-center py-16 px-8 bg-surface rounded-3xl shadow-xl z-10 relative overflow-hidden border border-black/5">
        
        {/* Decorative elements for premium feel */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-secondary mb-8 bg-secondary/10 p-6 rounded-3xl shadow-sm border border-secondary/20">
            <PackageOpen size={72} strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-heading text-primary mb-6 tracking-tight">
            ¡Bienvenido, {fallbackName}!
          </h1>
          
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-body">
            Estás en el panel de control de operaciones de patio. Selecciona una opción en el menú lateral para comenzar a validar los despachos de hoy.
          </p>

          <Link href="/encargado-patio/cargas" passHref>
            <Button size="lg" className="rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              Ir a Formalizar Cargas <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
      
      {/* Background blobs behind Card */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/4 z-0" />
    </div>
  )
}
