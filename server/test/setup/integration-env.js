/**
 * Jest setupFiles — se ejecuta antes de cada test suite de integración.
 * Garantiza que las dependencias externas (email, storage) estén en modo mock
 * cuando no hay credenciales reales disponibles.
 */
process.env.MOCK_SMTP = process.env.MOCK_SMTP ?? 'true';
