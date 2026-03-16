import { expect, test } from "../fixtures/test-fixtures";

test.describe("API starter flow", () => {
  test("create and list one person @regression", async ({
    appConfig,
    dataFactory,
    request,
    stepLogger
  }) => {
    const person = dataFactory.person();

    await stepLogger.run("Create one person through the API", async () => {
      const response = await request.post(`${appConfig.apiBaseUrl}/people`, {
        data: person
      });
      expect(response.ok()).toBeTruthy();
      expect(await response.json()).toMatchObject(person);
    });

    await stepLogger.run("List people and verify the new record", async () => {
      const response = await request.get(`${appConfig.apiBaseUrl}/people`);
      expect(response.ok()).toBeTruthy();

      const people = await response.json();
      expect(people).toContainEqual(expect.objectContaining({ personId: person.personId }));
    });
  });
});
