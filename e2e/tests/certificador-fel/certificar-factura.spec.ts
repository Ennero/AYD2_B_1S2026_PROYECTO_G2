import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 10: Validar NIT y Certificar Factura (Certificador FEL)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.certificadorFEL.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.certificadorFEL.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/certificador-fel/, { timeout: 15_000 });
  });

  test('verificar NIT y certificar factura pendiente', async ({ page }) => {
    await page.goto('/certificador-fel/bandeja');
    await expect(page.getByRole('heading', { name: /bandeja de aprobaci/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Cargando documentos...')).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - bandeja de aprobacion FEL cargada');

    const certificarBtn = page.getByRole('button', { name: /certificar/i }).first();
    const btnCount = await certificarBtn.count();

    if (btnCount === 0) {
      await screenshot(page, '01b - sin facturas pendientes en bandeja FEL');
      test.skip(true, 'No hay facturas pendientes de certificación en la bandeja FEL');
      return;
    }

    await screenshot(page, '02 - factura pendiente encontrada');

    await certificarBtn.click();

    await expect(page.getByText('Certificar documento')).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '03 - modal de certificacion abierto');

    const validateResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/certifier/invoices') &&
        res.url().includes('/validate-nit') &&
        res.request().method() === 'POST',
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /verificar nit/i }).click();

    const validateRes = await validateResponse;
    if (!validateRes.ok()) {
      const body = await validateRes.json().catch(() => ({}));
      await screenshot(page, `ERROR - POST validate-nit respondio ${validateRes.status()}`);
      throw new Error(`API ${validateRes.status()}: ${JSON.stringify(body)}`);
    }

    await expect(page.getByText(/nit validado/i).first()).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '04 - NIT validado correctamente');

    const certifyResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/certifier/invoices') &&
        res.url().includes('/certify') &&
        res.request().method() === 'PATCH',
      { timeout: 15_000 },
    );

    await page.getByRole('button', { name: /confirmar y certificar/i }).click();

    const certifyRes = await certifyResponse;
    if (!certifyRes.ok()) {
      const body = await certifyRes.json().catch(() => ({}));
      await screenshot(page, `ERROR - PATCH certify respondio ${certifyRes.status()}`);
      throw new Error(`API ${certifyRes.status()}: ${JSON.stringify(body)}`);
    }

    await expect(page.getByText(/certificad.*con éxito|certificad.*correctamente/i).first()).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Certificar documento')).toBeHidden({ timeout: 5_000 });

    await screenshot(page, '05 - factura certificada y modal cerrado');
  });

});
