import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 6: Registrar Despacho (Encargado de Patio)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.encargadoPatio.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.encargadoPatio.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/encargado-patio/, { timeout: 15_000 });
  });

  test('formalizar una carga pendiente con peso y estiba confirmada', async ({ page }) => {
    await page.goto('/encargado-patio/cargas');
    await expect(page.getByRole('heading', { name: /cargas a formalizar/i })).toBeVisible();

    await expect(page.getByText('Cargando órdenes…')).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - listado de cargas');

    const weightInput = page.locator('input[type="number"]:not([disabled])').first();
    const inputCount = await weightInput.count();

    if (inputCount === 0) {
      await screenshot(page, '01b - sin cargas pendientes disponibles');
      test.skip(true, 'No hay cargas en estado PENDIENTE disponibles para formalizar');
      return;
    }

    await screenshot(page, '02 - carga pendiente encontrada');

    await weightInput.fill('2.5');

    const estibaButton = page.getByRole('button').filter({ hasText: /sin confirmar/i }).first();
    const estibaVisible = await estibaButton.count();
    if (estibaVisible > 0) {
      await estibaButton.click();
      await expect(
        page.getByRole('button').filter({ hasText: /confirmada/i }).first(),
      ).toBeVisible({ timeout: 5_000 });
    }

    await screenshot(page, '03 - peso ingresado y estiba confirmada');

    const patchResponse = page.waitForResponse(
      (res) => res.url().includes('/cargas') && res.url().includes('/formalizar') && res.request().method() === 'PATCH',
      { timeout: 15_000 },
    );

    // El botón "Listo para Despacho" habilitado pertenece a la misma carga PENDIENTE
    await page.locator('button:not([disabled])').filter({ hasText: /listo para despacho/i }).first().click();

    const res = await patchResponse;
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));

      const alreadyFormalizado =
        res.status() === 400 &&
        typeof body.message === 'string' &&
        (body.message.toLowerCase().includes('formalizado') || body.message.toLowerCase().includes('ya fue'));

      if (!alreadyFormalizado) {
        await screenshot(page, `ERROR - API respondio ${res.status()}`);
        throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
      }

      await screenshot(page, '04 - carga ya formalizada previamente (ok — idempotente)');
      return;
    }

    await expect(
      page.getByText(/formalizada/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await screenshot(page, '04 - carga formalizada correctamente');
  });

});
