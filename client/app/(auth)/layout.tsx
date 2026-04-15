import { Toaster } from "sonner"

/**
 * Layout para páginas de autenticación.
 * Fondo oscuro con grid overlay — sin navbar/sidebar.
 * Sin max-width: cada página gestiona su propio contenedor.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0C0C0A" }}
    >
      <Toaster position="top-right" richColors />

      {/* Swiss grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,242,236,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,242,236,0.028) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      {children}
    </div>
  )
}
