// Page object for the login screen and its user actions.
import { $ } from '@wdio/globals';

import type { Logger } from '../utils/logger';

import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  constructor(baseUrl: string, logger: Logger) {
    super(baseUrl, logger);
  }

  async goto(): Promise<void> {
    this.logger.info('page.goto', { pageObject: 'LoginPage', page: 'login' });
    await this.open('/login');
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info('login.submit', {
      pageObject: 'LoginPage',
      username
    });
    await $('#username').setValue(username);
    await $('#password').setValue(password);
    await $('button=Sign in').click();
  }
}
