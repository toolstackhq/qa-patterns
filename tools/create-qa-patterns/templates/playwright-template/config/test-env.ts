import { z } from "zod";

export const testEnvironmentSchema = z.enum(["dev", "staging", "prod"]);

export type TestEnvironment = z.infer<typeof testEnvironmentSchema>;

export function loadTestEnvironment(): TestEnvironment {
  return testEnvironmentSchema.parse(process.env.TEST_ENV ?? "dev");
}
