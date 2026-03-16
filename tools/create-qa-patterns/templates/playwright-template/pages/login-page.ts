import type { Page } from "@playwright/test";

import type { Logger } from "../utils/logger";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  constructor(page: Page, baseUrl: string, logger: Logger) {
    super(page, baseUrl, logger);
  }

  async goto(): Promise<void> {
    this.logger.info("page.goto", { page: "login" });
    await this.page.goto(this.buildUrl("/login"));
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info("login.submit", { username });
    await this.page.getByLabel("Username").fill(username);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign in" }).click();
  }
}
