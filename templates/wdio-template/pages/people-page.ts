// Page object for the people screen used in the starter WDIO workflow.
import { $ } from '@wdio/globals';

import type { PersonRecord } from '../data/factories/data-factory';
import type { Logger } from '../utils/logger';

import { BasePage } from './base-page';

export class PeoplePage extends BasePage {
  constructor(baseUrl: string, logger: Logger) {
    super(baseUrl, logger);
  }

  async waitForReady(): Promise<void> {
    await $('h1=People').waitForDisplayed();
  }

  async getWelcomeMessage(): Promise<string> {
    return $('[data-testid="welcome-message"]').getText();
  }

  async addPerson(person: PersonRecord): Promise<void> {
    this.logger.info('person.create', {
      pageObject: 'PeoplePage',
      personId: person.personId
    });
    await $('#personId').setValue(person.personId);
    await $('#name').setValue(person.name);
    await $('#role').setValue(person.role);
    await $('#email').setValue(person.email);
    await $('button=Add person').click();
    await $('[data-testid="flash-message"]').waitForDisplayed();
  }

  async getFlashMessage(): Promise<string> {
    return $('[data-testid="flash-message"]').getText();
  }

  async getPersonSummary(
    personId: string
  ): Promise<{ name: string; role: string; email: string } | null> {
    const row = await $(`[data-testid="person-row-${personId}"]`);
    if (!(await row.isExisting())) {
      return null;
    }

    const cells = await row.$$('td');
    return {
      name: await cells[0].getText(),
      role: await cells[1].getText(),
      email: await cells[2].getText()
    };
  }
}
