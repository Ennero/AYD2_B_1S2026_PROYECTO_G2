import type { ReactNode } from "react"

interface FinancePageShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  rightSlot?: ReactNode
}

export default function FinancePageShell({ title, subtitle, children, rightSlot }: FinancePageShellProps) {
  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-transparent" />

      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-16 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#0A3B7C]">{title}</h1>
            {subtitle ? <p className="text-[#64748B] mt-2 text-lg">{subtitle}</p> : null}
          </div>
          {rightSlot ? <div>{rightSlot}</div> : null}
        </div>

        {children}
      </div>
    </div>
  )
}
