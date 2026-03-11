/** Aquí implementar formulario de Formalización de Contrato
 *
 * Pantalla: Formalización de Contrato
 * Wireframes: Wireframe-26 (dos cuadros)
 *
 * Secciones del formulario:
 * 1. Buscar Cliente Registrado (autocomplete/select)
 * 2. Límite de Crédito, Rutas Autorizadas
 * 3. Plazo de Pago (30 días, 45 días)
 * 4. Tipos de Carga Permitidas (carga pesada, contenedores, peligrosa)
 * 5. Aplicar Descuento: porcentaje + descripción
 *
 * Componentes sugeridos: Input, Select, Button, Card
 * Ruta sugerida: POST /api/v1/contratos
 *
 * Botón final: "Generar y Enviar Propuesta al Cliente"
 * Al completar → redirigir a /agente-operativo/contrato-generado
 */

export default function FormalizarContratoPage() {
  return (
    <div>
      <h1>Formalización de Contrato</h1>
      <p className="text-text-muted mt-2">Implementar formulario de formalización con búsqueda de cliente</p>
    </div>
  )
}
