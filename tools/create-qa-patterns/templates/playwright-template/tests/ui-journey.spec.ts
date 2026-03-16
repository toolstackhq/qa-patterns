import { expect, test } from "../fixtures/test-fixtures";

test.describe("UI starter journey", () => {
  test("login and add one person @smoke @critical", async ({
    appConfig,
    loginPage,
    peoplePage,
    dataFactory,
    stepLogger
  }) => {
    const person = dataFactory.person();

    await stepLogger.run("Sign in to the demo app", async () => {
      await loginPage.goto();
      await loginPage.login(appConfig.credentials.username, appConfig.credentials.password);
      await peoplePage.waitForReady();
      expect(await peoplePage.getWelcomeMessage()).toContain(appConfig.credentials.username);
    });

    await stepLogger.run("Add one person and verify the list", async () => {
      await peoplePage.addPerson(person);
      expect(await peoplePage.flashMessage.getText()).toContain("Person added");
      expect(await peoplePage.getPersonSummary(person.personId)).toEqual({
        name: person.name,
        role: person.role,
        email: person.email
      });
    });
  });
});
