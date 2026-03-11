/** Aquí implementar Dashboard del Piloto — Mis Viajes
 *
 * Pantalla: ¡Bienvenido [Nombre]! — Mis Viajes
 * Wireframes: Wireframe-32
 *
 * Contenido:
 * - WelcomeCard con saludo personalizado
 * - Buscador de viajes (filtros: fecha, tipo, estado)
 * - Lista de viajes como tarjetas con: ID, fecha, origen, destino, tipo, peso, estado
 * - Cada viaje clickeable → abre /piloto/viaje/[id]
 * - StatusBadge para estados (En Progreso, Completado, etc.)
 * - Botón "Filtrar"
 *
 * Componentes sugeridos: WelcomeCard, Card, Input, Button, StatusBadge, Select
 * Ruta sugerida: GET /api/v1/viajes
 */

export default function PilotoDashboardPage() {
  return (
    <div>
      <h1>Mis Viajes — Piloto</h1>
      <p className="text-text-muted mt-2">Implementar dashboard con lista de viajes y filtros</p>
    </div>
  )
}
