/** Aquí implementar Bandeja de Aprobación FEL
 *
 * Pantalla: Portal Certificador FEL - Bandeja de Aprobación
 * Wireframes: Certificador FEL (cuadros inferiores)
 *
 * Contenido:
 * - Enlace: "Ir a Certificador FEL (Simulador)"
 * - Tabla de facturas: DTE, Emisor, Receptor RNIT, Monto, Fecha, Acciones
 * - Para cada factura: botones "Certificar" (verde) y "Rechazar" (rojo)
 * - Modal de confirmación al certificar: "¡Factura Certificada!"
 * - Modal de confirmación al rechazar: "Rechazar Factura" (con motivo)
 *
 * Componentes sugeridos: Card, Button, Modal, StatusBadge
 * Rutas sugeridas:
 *   GET /api/v1/facturas
 *   POST /api/v1/facturas/{id}/certificar
 *   POST /api/v1/facturas/{id}/rechazar
 */

export default function BandejaAprobacionPage() {
  return (
    <div>
      <h1>Bandeja de Aprobación</h1>
      <p className="text-text-muted mt-2">Implementar tabla de facturas con acciones de certificar/rechazar</p>
    </div>
  )
}
