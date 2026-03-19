// Base page object for WebdriverIO pages.
import { browser } from '@wdio/globals';

import type { Logger } from '../utils/logger';

export class BasePage {
  constructor(
    protected readonly baseUrl: string,
    protected readonly logger: Logger
  ) {}

  async open(pathname: string): Promise<void> {
    await browser.url(new globalThis.URL(pathname, this.baseUrl).toString());
  }
}
