import { test, expect } from '@playwright/test';
import { SEEDED_USERS } from '../../fixtures';

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
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/correo/i).fill('nonexistent@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText('Credenciales inválidas.').first()).toBeVisible();
  });

  test('redirects Agente Operativo to its dashboard', async ({ page }) => {
    const { email, password } = SEEDED_USERS.agenteOperativo;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/agente-operativo/);
  });

  test('redirects Piloto to its dashboard', async ({ page }) => {
    const { email, password } = SEEDED_USERS.piloto;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/piloto/);
  });

  test('redirects Cliente to its portal', async ({ page }) => {
    const { email, password } = SEEDED_USERS.cliente;
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/cliente/);
  });
});
