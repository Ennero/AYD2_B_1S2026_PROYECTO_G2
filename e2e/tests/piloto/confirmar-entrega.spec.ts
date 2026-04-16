import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 8: Confirmar Entrega con Evidencia (Piloto)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.piloto.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.piloto.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/piloto/, { timeout: 15_000 });
  });

  test('completar entrega con firma y evidencia fotográfica', async ({ page }) => {
    await page.goto('/piloto');
    await expect(page.getByText('Cargando viajes…')).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - dashboard piloto');

    const actualizarBtn = page.getByRole('button', { name: /actualizar bitácora/i }).first();
    const hasActualizar = await actualizarBtn.count();

    if (hasActualizar === 0) {
      await screenshot(page, '01b - sin viajes EN_TRANSITO disponibles');
      test.skip(true, 'No hay viajes EN_TRANSITO disponibles para confirmar entrega');
      return;
    }

    await actualizarBtn.click();
    await expect(page).toHaveURL(/\/piloto\/monitoreo\//, { timeout: 10_000 });

    await screenshot(page, '02 - pagina de monitoreo del viaje EN_TRANSITO');

    await page.getByRole('button', { name: /llegué a destino/i }).click();

    await expect(page.getByRole('heading', { name: /datos del receptor/i })).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '03 - formulario de entrega visible');

    await page.getByPlaceholder('Ej. Juan Pérez').fill('Almacén Central E2E');

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    await page.locator('input[type="time"]').fill(`${hh}:${mm}`);

    await screenshot(page, '04 - datos del receptor completados');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5_000 });
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 60);
      await page.mouse.move(box.x + 140, box.y + 40);
      await page.mouse.move(box.x + 200, box.y + 80);
      await page.mouse.up();
    }

    await screenshot(page, '05 - firma digital realizada');

    const photoInput = page.locator('input[type="file"][accept="image/*"]').first();
    await photoInput.setInputFiles({
      name: 'evidencia.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
        'AABAAEDASIA2gABAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABQQD/8QAIRAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFESExQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAA' +
        'AAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AMy2sTRlsxYWMdpKlSXlJUVEkknJJ9nJ5ooorZFFFAUUUUB/9k=',
        'base64',
      ),
    });

    await expect(page.getByAltText(/evidencia 1/i)).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '06 - foto de evidencia adjuntada');

    const deliverResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/pilot/orders') &&
        res.url().includes('/deliver') &&
        res.request().method() === 'PATCH',
      { timeout: 20_000 },
    );

    await page.getByRole('button', { name: /confirmar entrega/i }).click();

    const res = await deliverResponse;
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));
      await screenshot(page, `ERROR - PATCH deliver respondio ${res.status()}`);
      throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
    }

    await screenshot(page, '07 - API de entrega OK, esperando modal de éxito');

    const swalConfirm = page.locator('.swal2-confirm');
    await expect(swalConfirm).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('¡Misión Cumplida!')).toBeVisible();

    await screenshot(page, '08 - modal mision cumplida visible');

    await swalConfirm.click();

    await expect(page).toHaveURL(/\/piloto$/, { timeout: 10_000 });

    await screenshot(page, '09 - regreso al dashboard del piloto');
  });

});
