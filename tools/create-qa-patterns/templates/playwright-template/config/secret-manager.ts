import type { TestEnvironment } from "./test-env";

export interface SecretProvider {
  getSecret(key: string, testEnv: TestEnvironment): string | undefined;
}

export class EnvSecretProvider implements SecretProvider {
  getSecret(key: string, testEnv: TestEnvironment): string | undefined {
    const envPrefix = testEnv.toUpperCase();
    return process.env[`${envPrefix}_${key}`] ?? process.env[key];
  }
}

export class SecretManager {
  constructor(private readonly provider: SecretProvider) {}

  getRequiredSecret(key: string, testEnv: TestEnvironment): string {
    const value = this.provider.getSecret(key, testEnv);
    if (!value) {
      throw new Error(`Missing secret "${key}" for TEST_ENV=${testEnv}`);
    }
    return value;
  }

  getOptionalSecret(key: string, testEnv: TestEnvironment): string | undefined {
    return this.provider.getSecret(key, testEnv);
  }
}
