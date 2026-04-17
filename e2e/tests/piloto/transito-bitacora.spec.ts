import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Inciso 7: Iniciar Tránsito y Registrar Bitácora (Piloto)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(SEEDED_USERS.piloto.email);
    await page.getByLabel(/contraseña/i).fill(SEEDED_USERS.piloto.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/piloto/, { timeout: 15_000 });
  });

  test('iniciar viaje y registrar evento en bitácora', async ({ page }) => {
    await page.goto('/piloto');
    await expect(page.getByText('Cargando viajes…')).toBeHidden({ timeout: 15_000 });

    await screenshot(page, '01 - dashboard piloto con viajes');

    const empezarBtn = page.getByRole('button', { name: /empezar viaje/i }).first();
    const actualizarBtn = page.getByRole('button', { name: /actualizar bitácora/i }).first();

    const hasEmpezar = await empezarBtn.count();
    const hasActualizar = await actualizarBtn.count();

    if (hasEmpezar === 0 && hasActualizar === 0) {
      await screenshot(page, '01b - sin viajes asignados');
      test.skip(true, 'El piloto no tiene viajes asignados en estado LISTA_PARA_DESPACHO o EN_TRANSITO');
      return;
    }

    if (hasEmpezar > 0) {
      await screenshot(page, '02 - viaje listo para despacho encontrado');

      await empezarBtn.click();

      await expect(page).toHaveURL(/\/piloto\/monitoreo\//, { timeout: 10_000 });

      await screenshot(page, '03 - pagina de monitoreo del viaje');

      const startResponse = page.waitForResponse(
        (res) => res.url().includes('/pilot/orders') && res.url().includes('/status') && res.request().method() === 'PATCH',
        { timeout: 15_000 },
      );

      await page.getByRole('button', { name: /empezar viaje/i }).click();

      const startRes = await startResponse;
      if (!startRes.ok()) {
        const body = await startRes.json().catch(() => ({}));
        await screenshot(page, `ERROR - PATCH status respondio ${startRes.status()}`);
        throw new Error(`API ${startRes.status()}: ${JSON.stringify(body)}`);
      }

      await expect(page.getByText(/viaje iniciado/i).first()).toBeVisible({ timeout: 10_000 });

      await screenshot(page, '04 - viaje iniciado correctamente');
    } else {
      await actualizarBtn.click();
      await expect(page).toHaveURL(/\/piloto\/monitoreo\//, { timeout: 10_000 });

      await screenshot(page, '03 - pagina de monitoreo (viaje EN_TRANSITO)');
    }

    await expect(
      page.getByRole('button', { name: /registrar evento/i }),
    ).toBeVisible({ timeout: 10_000 });

    await screenshot(page, '05 - boton registrar evento visible');

    await page.getByRole('button', { name: /registrar evento/i }).click();

    await expect(page.getByRole('heading', { name: 'Registrar Evento' })).toBeVisible();

    await screenshot(page, '06 - modal registrar evento abierto');

    await page.getByRole('combobox').selectOption({ label: 'Punto de Control' });

    await page.getByPlaceholder(/paso por control/i).fill('Control de ruta km 45 — sin novedades E2E.');

    await screenshot(page, '07 - formulario de evento completado');

    const logResponse = page.waitForResponse(
      (res) => res.url().includes('/pilot/orders') && res.url().includes('/logs') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );

    // Hay dos botones con este nombre: el trigger de la página y el submit del modal.
    // El modal se renderiza como overlay al final del DOM, por lo que .last() da el submit.
    await page.getByRole('button', { name: /registrar evento/i }).last().click();

    const logRes = await logResponse;
    if (!logRes.ok()) {
      const body = await logRes.json().catch(() => ({}));
      await screenshot(page, `ERROR - POST logs respondio ${logRes.status()}`);
      throw new Error(`API ${logRes.status()}: ${JSON.stringify(body)}`);
    }

    // Verificar que el modal se cierra comprobando que su heading desaparece.
    // No usar getByText('Registrar Evento') porque el botón trigger de la página
    // siempre tiene ese texto y nunca se oculta.
    await expect(
      page.getByRole('heading', { name: 'Registrar Evento' }),
    ).toBeHidden({ timeout: 5_000 });

    await screenshot(page, '08 - evento registrado en bitácora');

    await expect(
      page.getByText(/punto de control|control de ruta/i).first(),
    ).toBeVisible({ timeout: 5_000 });

    await screenshot(page, '09 - evento visible en la bitácora del viaje');
  });

});
