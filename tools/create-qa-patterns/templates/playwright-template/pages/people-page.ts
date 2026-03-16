import type { Page } from "@playwright/test";

import type { PersonRecord } from "../data/factories/data-factory";
import type { Logger } from "../utils/logger";
import { BasePage } from "./base-page";

export class PeoplePage extends BasePage {
  constructor(page: Page, baseUrl: string, logger: Logger) {
    super(page, baseUrl, logger);
  }

  async waitForReady(): Promise<void> {
    await this.page.getByRole("heading", { level: 1, name: "People", exact: true }).waitFor();
  }

  async addPerson(person: PersonRecord): Promise<void> {
    this.logger.info("person.create", { personId: person.personId });
    await this.page.getByLabel("Person ID").fill(person.personId);
    await this.page.getByLabel("Name").fill(person.name);
    await this.page.getByLabel("Role").fill(person.role);
    await this.page.getByLabel("Email").fill(person.email);
    await this.page.getByRole("button", { name: "Add person" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async getPersonSummary(personId: string): Promise<{ name: string; role: string; email: string } | null> {
    const row = this.page.getByTestId(`person-row-${personId}`);
    if (!(await row.count())) {
      return null;
    }

    const cells = row.getByRole("cell");
    return {
      name: (await cells.nth(0).textContent()) ?? "",
      role: (await cells.nth(1).textContent()) ?? "",
      email: (await cells.nth(2).textContent()) ?? ""
    };
  }
}
