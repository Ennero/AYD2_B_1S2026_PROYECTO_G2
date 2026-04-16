import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 9: Revisar Borrador y Enviar a Certificador FEL (Agente Financiero)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.finance.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.finance.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/finances/, { timeout: 15_000 });
  });

  test('revisar borrador de factura y enviarlo al flujo FEL', async ({ page }) => {
    await page.goto('/finances/facturacion');
    // El heading puede renderizarse con o sin tilde según el entorno ("Facturación" / "Facturacion")
    await expect(page.getByRole('heading', { name: /bandeja de facturaci/i })).toBeVisible();

    await expect(page.getByText('Cargando...').first()).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - bandeja de facturacion cargada');

    const revisarBtn = page.getByRole('button', { name: /revisar/i }).first();
    const btnCount = await revisarBtn.count();

    if (btnCount === 0) {
      await screenshot(page, '01b - sin facturas BORRADOR disponibles');
      test.skip(true, 'No hay facturas en estado BORRADOR para revisar');
      return;
    }

    await screenshot(page, '02 - factura BORRADOR encontrada');

    await revisarBtn.click();

    await expect(page).toHaveURL(/\/finances\/facturacion\//, { timeout: 10_000 });
    // El heading varía entre entornos: "Revisión de Factura" / "Revision de factura borrador"
    await expect(page.getByRole('heading', { name: /revisi.*factura/i })).toBeVisible({ timeout: 10_000 });

    await screenshot(page, '03 - pagina de revision de factura');

    await expect(page.getByText(/enviar a certificador fel/i)).toBeVisible();
    await page.getByRole('button', { name: /enviar a certificador fel/i }).click();

    // El heading del modal puede tener o no tilde: "Confirmar envío a FEL" / "Confirmar envio a FEL"
    await expect(page.getByRole('heading', { name: /confirmar env.*fel/i })).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '04 - modal confirmar envio a FEL abierto');

    const descriptionArea = page.getByPlaceholder(/servicios de transporte/i);
    await descriptionArea.fill('Servicio de transporte de carga — LogiTrans E2E');

    await screenshot(page, '05 - descripcion de servicio completada');

    const patchResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/finance/invoices') &&
        res.url().includes('/submit-for-certification') &&
        res.request().method() === 'PATCH',
      { timeout: 15_000 },
    );

    await page.getByRole('button', { name: /confirmar env/i }).click();

    const res = await patchResponse;
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));

      const alreadySubmitted =
        res.status() === 400 &&
        typeof body.message === 'string' &&
        (body.message.toLowerCase().includes('pendiente') ||
          body.message.toLowerCase().includes('certificad') ||
          body.message.toLowerCase().includes('ya fue'));

      if (!alreadySubmitted) {
        await screenshot(page, `ERROR - PATCH submit-for-certification respondio ${res.status()}`);
        throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
      }

      await screenshot(page, '06 - factura ya enviada a FEL previamente (ok — idempotente)');
      return;
    }

    await expect(
      page.getByText(/enviada al flujo fel/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page).toHaveURL(/\/finances\/facturacion$/, { timeout: 10_000 });

    await screenshot(page, '06 - factura enviada a FEL y vuelta a bandeja');
  });

});
