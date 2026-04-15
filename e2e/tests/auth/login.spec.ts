import { test, expect, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

/** Helper: adjunta un screenshot al reporte HTML con nombre descriptivo */
async function screenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible();
    await expect(page.getByLabel(/correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    // El botón dice "Iniciar Sesión"
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();

    await screenshot(page, 'login-form-rendered');
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/correo/i).fill('nonexistent@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText('Credenciales inválidas.').first()).toBeVisible();

    await screenshot(page, 'error-credenciales-invalidas');
  });

  test('redirects Agente Operativo to its dashboard', async ({ page }) => {
    const { email, password } = SEEDED_USERS.agenteOperativo;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/agente-operativo/);

    await screenshot(page, 'dashboard-agente-operativo');
  });

  test('redirects Piloto to its dashboard', async ({ page }) => {
    const { email, password } = SEEDED_USERS.piloto;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/piloto/);

    await screenshot(page, 'dashboard-piloto');
  });

  test('redirects Cliente to its portal', async ({ page }) => {
    const { email, password } = SEEDED_USERS.cliente;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/cliente/);

    await screenshot(page, 'portal-cliente');
  });
});
