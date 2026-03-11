import { Toaster } from "sonner"
import Navbar from "@/components/layout/Navbar"

/**
 * Layout para roles con Navbar superior.
 * Agente Operativo, Piloto, Agente Logístico.
 */
export default function DashboardNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
