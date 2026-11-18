import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly serverError: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Correo electrónico');
    this.password = page.getByLabel('Contraseña');
    this.submit = page.getByRole('button', { name: 'Iniciar sesión' });
    this.serverError = page.getByText('No se pudo iniciar sesión');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
