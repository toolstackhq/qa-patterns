// Starter WDIO scenario that demonstrates the preferred spec style for this template.
import assert from 'node:assert/strict';

import { loadRuntimeConfig } from '../config/runtime-config';
import { DataFactory } from '../data/factories/data-factory';
import { LoginPage } from '../pages/login-page';
import { PeoplePage } from '../pages/people-page';
import { createLogger } from '../utils/logger';
import { StepLogger } from '../utils/test-step';

describe('UI starter journey', () => {
  it('login and add one person @smoke @critical', async () => {
    const appConfig = loadRuntimeConfig();
    const logger = createLogger({
      test: 'ui-journey.spec.ts > UI starter journey > login and add one person @smoke @critical'
    });
    const stepLogger = new StepLogger(logger.child({ scope: 'steps' }));
    const dataFactory = new DataFactory(appConfig.testRunId);
    const loginPage = new LoginPage(
      appConfig.uiBaseUrl,
      logger.child({ pageObject: 'LoginPage' })
    );
    const peoplePage = new PeoplePage(
      appConfig.uiBaseUrl,
      logger.child({ pageObject: 'PeoplePage' })
    );
    const person = dataFactory.person();

    await stepLogger.run('Sign in to the demo app', async () => {
      await loginPage.goto();
      await loginPage.login(
        appConfig.credentials.username,
        appConfig.credentials.password
      );
      await peoplePage.waitForReady();
      assert.match(
        await peoplePage.getWelcomeMessage(),
        new RegExp(appConfig.credentials.username)
      );
    });

    await stepLogger.run('Add one person and verify the list', async () => {
      await peoplePage.addPerson(person);
      assert.match(await peoplePage.getFlashMessage(), /Person added/);
      assert.deepEqual(await peoplePage.getPersonSummary(person.personId), {
        name: person.name,
        role: person.role,
        email: person.email
      });
    });
  });
});
