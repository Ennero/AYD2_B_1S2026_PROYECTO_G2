/** Aquí implementar Cargas a Formalizar
 *
 * Pantalla: Cargas a Formalizar
 * Wireframes: Encargado de Patio (segundo cuadro)
 *
 * Contenido:
 * - Lista de cargas pendientes de formalización
 * - Para cada carga: ID, detalles, estado
 * - Tabla con columnas: Nivel, Marca de Piso, Autoriza, Marbetes
 * - Filtros por estado (PENDIENTE, RECHAZADO, etc.)
 * - Botón "Formalizar Carga" que actualiza estado
 *
 * Componentes sugeridos: Card, Button, StatusBadge, Modal
 * Rutas sugeridas:
 *   GET /api/v1/cargas
 *   POST /api/v1/cargas/{id}/formalizar
 */

export default function FormalizarCargasPage() {
  return (
    <div>
      <h1>Cargas a Formalizar</h1>
      <p className="text-text-muted mt-2">Implementar lista de cargas con acciones de formalización</p>
    </div>
  )
}
