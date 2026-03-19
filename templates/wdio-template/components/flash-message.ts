import type { Locator, Page } from '@playwright/test';

export class FlashMessage {
  private readonly message: Locator;

  constructor(page: Page) {
    this.message = page.getByTestId('flash-message');
  }

  async getText(): Promise<string | null> {
    if (!(await this.message.count())) {
      return null;
    }
    return this.message.textContent();
  }
}
