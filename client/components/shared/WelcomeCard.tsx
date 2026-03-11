/** Tarjeta de bienvenida reutilizable para dashboards */

interface WelcomeCardProps {
  userName: string
  roleName: string
  description?: string
}

export default function WelcomeCard({ userName, roleName, description }: WelcomeCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">👋</span>
        </div>
        <div>
          <h1 className="text-2xl">¡Bienvenido, {userName}!</h1>
          <p className="text-text-muted text-small mt-1">
            {description || `Panel de control — ${roleName}`}
          </p>
        </div>
      </div>
    </div>
  )
}
