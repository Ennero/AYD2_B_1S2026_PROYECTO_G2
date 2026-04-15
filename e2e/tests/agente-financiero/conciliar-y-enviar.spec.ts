import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 11: Conciliar Pago y Enviar Factura al Cliente (Agente Financiero)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.finance.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.finance.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/finances/, { timeout: 15_000 });
  });

  test('conciliar pago pendiente', async ({ page }) => {
    await page.goto('/finances/pagos');
    await expect(page.getByRole('heading', { name: /conciliar pagos/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Cargando pagos pendientes...')).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - bandeja de conciliacion de pagos');

    const aprobarBtn = page.getByRole('button', { name: /aprobar/i }).first();
    const btnCount = await aprobarBtn.count();

    if (btnCount === 0) {
      await screenshot(page, '01b - sin pagos pendientes por conciliar');
      test.skip(true, 'No hay pagos pendientes por conciliar');
      return;
    }

    await screenshot(page, '02 - pago pendiente encontrado');

    await aprobarBtn.click();

    await expect(page.getByText('Confirmar aprobación de pago')).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '03 - modal de aprobacion abierto');

    const approveResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/finance/payments') &&
        res.url().includes('/approve') &&
        res.request().method() === 'PATCH',
      { timeout: 15_000 },
    );

    await page.getByRole('button', { name: /confirmar aprobaci/i }).click();

    const res = await approveResponse;
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));
      await screenshot(page, `ERROR - PATCH approve respondio ${res.status()}`);
      throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
    }

    await expect(
      page.getByText(/pago.*aprobado/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Confirmar aprobación de pago')).toBeHidden({ timeout: 5_000 });

    await screenshot(page, '04 - pago aprobado y modal cerrado');
  });

  test('enviar factura pagada al cliente', async ({ page }) => {
    await page.goto('/finances/facturacion');
    await expect(page.getByRole('heading', { name: /bandeja de facturaci/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Cargando...').first()).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - bandeja de facturacion con facturas pagadas');

    const enviarBtn = page.getByRole('button', { name: /^enviar$/i }).first();
    const btnCount = await enviarBtn.count();

    if (btnCount === 0) {
      await screenshot(page, '01b - sin facturas PAGADAS disponibles para enviar');
      test.skip(true, 'No hay facturas PAGADAS disponibles para enviar al cliente');
      return;
    }

    await screenshot(page, '02 - factura pagada encontrada');

    await enviarBtn.click();

    await expect(page.getByText('Enviar factura pagada')).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '03 - modal de envio al cliente abierto');

    const sendResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/finance/invoices') &&
        res.url().includes('/send') &&
        res.request().method() === 'PATCH',
      { timeout: 15_000 },
    );

    await page.getByRole('button', { name: /confirmar env/i }).click();

    const res = await sendResponse;
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));
      await screenshot(page, `ERROR - PATCH send respondio ${res.status()}`);
      throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
    }

    await expect(
      page.getByText(/enviada al cliente/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Enviar factura pagada')).toBeHidden({ timeout: 5_000 });

    await screenshot(page, '04 - factura enviada al cliente correctamente');
  });

});
