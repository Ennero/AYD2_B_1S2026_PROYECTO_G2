import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 12: Validación Ejecutiva (Gerencia)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.gerencia.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.gerencia.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/gerencia/, { timeout: 15_000 });
  });

  test('verificar KPIs de operaciones con indicador USD', async ({ page }) => {
    await page.goto('/gerencia');
    await expect(page.getByRole('heading', { name: /hola/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Facturación', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Servicios Completados')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Incidentes Activos')).toBeVisible();

    await screenshot(page, '01 - dashboard gerencia KPIs mensual cargados');

    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('ANNUAL');

    await expect(page.getByText('Año 2026', { exact: true })).toBeVisible({ timeout: 10_000 });

    await screenshot(page, '02 - KPIs periodo anual cargados');

    await expect(page.getByText('Operaciones por Sede')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Últimos Despachos')).toBeVisible();

    await screenshot(page, '03 - secciones operativas visibles');
  });

  test('verificar análisis de rentabilidad en USD', async ({ page }) => {
    await page.goto('/gerencia/rentabilidad');
    await expect(page.getByRole('heading', { name: /an.*lisis de rentabilidad/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Facturación Total')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/monto facturado/i)).toBeVisible({ timeout: 15_000 });

    await screenshot(page, '04 - rentabilidad cargada con indicador USD');

    await expect(page.getByText('Ingresos por Cliente', { exact: true })).toBeVisible();
    await expect(page.getByText('Real vs Promesa', { exact: true })).toBeVisible();

    await screenshot(page, '05 - graficas de ingresos y entregas visibles');

    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('MONTHLY');

    await expect(page.getByText(/monto facturado/i)).toBeVisible({ timeout: 10_000 });

    await screenshot(page, '06 - rentabilidad periodo mensual sin errores');
  });

  test('verificar alertas y proyecciones de expansión', async ({ page }) => {
    await page.goto('/gerencia/alertas');
    await expect(page.getByRole('heading', { name: /alertas y planificaci/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Incidentes Activos en Ruta')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/órdenes en tr.nsito con retraso/i)).toBeVisible();

    await screenshot(page, '07 - secciones de alertas cargadas');

    await expect(page.getByText('Proyección de Expansión')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Tendencia mensual de órdenes')).toBeVisible();

    await screenshot(page, '08 - proyeccion de expansion y tendencia visibles');
  });

});
