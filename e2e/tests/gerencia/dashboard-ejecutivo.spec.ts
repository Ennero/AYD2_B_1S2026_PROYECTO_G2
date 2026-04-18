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
