import { test, expect, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

// Datos únicos por ejecución para evitar conflictos de NIT/email en la BD
function clienteData() {
  return {
    nombre:      'Henry Contreras',
    email:       faker.internet.email({ provider: 'logitrans-test.gt' }),
    nit:         faker.string.numeric(13), // 13 dígitos (label del NIT en la app desplegada)
    direccion:   'Tegucigalpa, Honduras',
    razonSocial: `DISTRIBUIDORA EL PROGRESO ${faker.string.alphanumeric(4).toUpperCase()}, S.A.`,
    telefono:    '22012341',              // 8 dígitos locales Honduras
  };
}

test.describe('Inciso 2 — Registrar nuevo cliente (Agente Operativo)', () => {

  // Login antes de cada test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.agenteOperativo.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.agenteOperativo.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/agente-operativo/);
  });

  test('flujo completo de registro en 3 pasos', async ({ page }) => {
    const cliente = clienteData();
    await page.goto('/agente-operativo/registrar-cliente');
    await expect(page.getByRole('heading', { name: /registrar cliente/i })).toBeVisible();
    await screenshot(page, '01 - formulario inicial (paso 1 visible)');

    // El texto "Datos Generales" aparece en el stepper Y en el card header → .first()
    await expect(page.getByText('Datos Generales').first()).toBeVisible();

    await page.getByLabel('Nombre completo').fill(cliente.nombre);

    // Teléfono es opcional — lo omitimos para evitar problemas de formato
    // (el campo split prefijo+número varía entre versiones)

    await page.getByLabel('Correo de acceso').fill(cliente.email);

    // Contraseña: la label no tiene htmlFor, se genera con el botón "Generar"
    await page.getByRole('button', { name: /generar/i }).click();
    // Verificar que el campo quedó lleno (≥12 chars)
    const passInput = page.getByPlaceholder(/contraseña segura/i);
    await expect(passInput).not.toHaveValue('');

    await screenshot(page, '02 - datos generales completados');
    await page.getByRole('button', { name: /siguiente/i }).click();

    // ════════════════════════════════════════════════════════════════════════
    // PASO 2 — Datos Fiscales
    // ════════════════════════════════════════════════════════════════════════

    await expect(page.getByText('Datos Fiscales').first()).toBeVisible();

    await page.getByLabel('Razón Social').fill(cliente.razonSocial);
    await page.getByLabel(/^NIT/i).fill(cliente.nit);
    await page.getByLabel('Dirección fiscal').fill(cliente.direccion);

    await screenshot(page, '03 - datos fiscales completados');
    await page.getByRole('button', { name: /siguiente/i }).click();

    // ════════════════════════════════════════════════════════════════════════
    // PASO 3 — Perfil de Riesgo
    // ════════════════════════════════════════════════════════════════════════

    await expect(page.getByText('Perfil de Riesgo').first()).toBeVisible();

    await page.getByLabel('Capacidad de Pago').selectOption({ label: 'Baja' });
    await page.getByLabel('Riesgo de Mercancía').selectOption({ label: 'Bajo' });
    await page.getByLabel('Riesgo en Aduanas').selectOption({ label: 'Medio' });
    await page.getByLabel('Lavado de Dinero').selectOption({ label: 'Bajo' });

    await screenshot(page, '04 - perfil de riesgo completado');

    // ── Enviar formulario ────────────────────────────────────────────────────
    // Capturar respuestas de la API para diagnóstico en caso de fallo
    const apiResponse = page.waitForResponse(
      res => res.url().includes('/operations/clients') && res.request().method() === 'POST',
      { timeout: 15_000 }
    );
    await page.getByRole('button', { name: /registrar cliente/i }).click();
    const res = await apiResponse;
    // Si la API responde con error, tomamos screenshot para ver el mensaje
    if (!res.ok()) {
      await screenshot(page, `ERROR - API respondio ${res.status()}`);
      const body = await res.json().catch(() => ({}));
      throw new Error(`API error ${res.status()}: ${JSON.stringify(body)}`);
    }

    // ── Verificar modal de éxito ─────────────────────────────────────────────
    await expect(page.getByText('Cliente registrado.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/credenciales de acceso al portal/i)).toBeVisible();

    await screenshot(page, '05 - modal confirmacion registro exitoso');

    // Volver al panel
    await page.getByRole('button', { name: /volver al panel/i }).click();
    await expect(page).toHaveURL(/agente-operativo$/);

    await screenshot(page, '06 - regreso al dashboard agente operativo');
  });

});
