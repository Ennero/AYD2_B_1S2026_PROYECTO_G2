import { test, expect, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 2 — Gestionar usuario (Agente Operativo)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.agenteOperativo.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.agenteOperativo.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/agente-operativo/);
  });

  test('editar nombre de un usuario existente', async ({ page }) => {
    // ── Navegar a gestión de usuarios ────────────────────────────────────────
    await page.goto('/agente-operativo/usuarios');
    await expect(page.getByRole('heading', { name: /gestión de usuarios/i })).toBeVisible();

    // Esperar que el spinner desaparezca y aparezca al menos un botón "Editar"
    await expect(page.getByText(/cargando usuarios/i)).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /editar/i }).first()).toBeVisible();

    await screenshot(page, '01 - lista de usuarios cargada');

    // ── Abrir modal del primer usuario ───────────────────────────────────────
    await page.getByRole('button', { name: /editar/i }).first().click();
    await expect(page.getByText('Editar usuario')).toBeVisible();

    await screenshot(page, '02 - modal de edicion abierto');

    const nombreInput = page
      .locator('label')
      .filter({ hasText: /nombre completo/i })
      .locator('xpath=../input');

    await expect(nombreInput).toBeVisible();

    const newName = `${faker.person.firstName()} ${faker.person.lastName()} E2E`;
    await nombreInput.clear();
    await nombreInput.fill(newName);

    await screenshot(page, '03 - nuevo nombre escrito');

    // ── Guardar y verificar ──────────────────────────────────────────────────
    const patchResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/operations/users/') &&
        res.request().method() === 'PATCH',
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /guardar cambios/i }).click();

    const res = await patchResponse;
    if (!res.ok()) {
      await screenshot(page, `ERROR - API respondio ${res.status()}`);
      const body = await res.json().catch(() => ({}));
      throw new Error(`API ${res.status()}: ${JSON.stringify(body)}`);
    }

    // Toast de confirmación
    await expect(page.getByText('Usuario actualizado correctamente.').first()).toBeVisible();

    // Modal se cierra automáticamente
    await expect(page.getByText('Editar usuario')).toBeHidden();

    // El nuevo nombre aparece en la tabla
    await expect(page.getByText(newName)).toBeVisible();

    await screenshot(page, '05 - nombre actualizado en la lista');
  });

});
