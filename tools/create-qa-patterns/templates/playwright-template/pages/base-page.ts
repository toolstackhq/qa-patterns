import type { Page } from "@playwright/test";

import { FlashMessage } from "../components/flash-message";
import type { Logger } from "../utils/logger";

export abstract class BasePage {
  readonly flashMessage: FlashMessage;

  constructor(
    protected readonly page: Page,
    private readonly baseUrl: string,
    protected readonly logger: Logger
  ) {
    this.flashMessage = new FlashMessage(page);
  }

  protected buildUrl(pathname: string): string {
    return new URL(pathname, this.baseUrl).toString();
  }

  async getWelcomeMessage(): Promise<string> {
    return (await this.page.getByTestId("welcome-message").textContent()) ?? "";
  }
}
