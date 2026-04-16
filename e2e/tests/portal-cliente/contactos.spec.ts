import { test, expect, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 4: Gestión de Contactos (Portal Cliente)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.cliente.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.cliente.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/cliente/, { timeout: 15_000 });
  });

  test('agregar un nuevo contacto clave y editar su nombre', async ({ page }) => {
    await page.goto('/cliente/contactos');
    await expect(page.getByRole('heading', { name: /contactos clave/i })).toBeVisible();

    await screenshot(page, '01 - listado de contactos');

    // ── Agregar nuevo contacto ────────────────────────────────────────────────
    // El botón del header dice "Agregar Contacto" (title-case)
    await page.getByRole('button', { name: 'Agregar Contacto' }).click();
    await expect(page.getByText('Nuevo Contacto')).toBeVisible();

    const contactName = `${faker.person.firstName()} ${faker.person.lastName()} E2E`;
    const contactEmail = faker.internet.email({ provider: 'logitrans-test.gt' });

    await page.getByLabel(/nombre completo/i).fill(contactName);
    await page.getByLabel(/correo electrónico/i).fill(contactEmail);
    await page.getByLabel(/cargo/i).fill('Gerente de Pruebas');

    await screenshot(page, '02 - formulario nuevo contacto completado');

    const postResponse = page.waitForResponse(
      (res) => res.url().includes('/client/contacts') && res.request().method() === 'POST',
      { timeout: 10_000 },
    );

    // El botón de submit del modal dice "Agregar contacto" (lowercase c, exact=true para
    // distinguirlo del botón del header "Agregar Contacto" con C mayúscula)
    await page.getByRole('button', { name: 'Agregar contacto', exact: true }).click();

    const res = await postResponse;
    if (!res.ok()) {
      await screenshot(page, `ERROR - API respondio ${res.status()}`);
      const body = await res.json().catch(() => ({}));
      throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
    }

    await expect(page.getByText('Contacto agregado correctamente').first()).toBeVisible({ timeout: 5_000 });
    // Modal se cierra automáticamente
    await expect(page.getByText('Nuevo Contacto')).toBeHidden();
    // El nuevo contacto aparece en la lista
    await expect(page.getByText(contactName)).toBeVisible();

    await screenshot(page, '03 - contacto agregado en la lista');

    const contactCard = page.locator('div').filter({
      has: page.getByText(contactName, { exact: true }),
    }).filter({
      has: page.getByTitle('Editar'),
    }).last();

    // El botón tiene opacity:0 pero Playwright lo puede clickear igualmente
    await contactCard.getByTitle('Editar').click();
    await expect(page.getByText('Editar Contacto')).toBeVisible();

    await screenshot(page, '04 - modal de edicion abierto');

    const updatedName = `${contactName} (upd)`;
    await page.getByLabel(/nombre completo/i).clear();
    await page.getByLabel(/nombre completo/i).fill(updatedName);

    await screenshot(page, '05 - nombre actualizado en el modal');

    const patchResponse = page.waitForResponse(
      (res) => res.url().includes('/client/contacts') && res.request().method() === 'PATCH',
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    const patchRes = await patchResponse;
    if (!patchRes.ok()) {
      await screenshot(page, `ERROR - PATCH respondio ${patchRes.status()}`);
      const body = await patchRes.json().catch(() => ({}));
      throw new Error(`API ${patchRes.status()}: ${JSON.stringify(body)}`);
    }

    await expect(page.getByText('Contacto actualizado correctamente').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Editar Contacto')).toBeHidden();
    await expect(page.getByText(updatedName)).toBeVisible();

    await screenshot(page, '06 - nombre actualizado en la lista');
  });

});
