// Builds the runtime configuration object that tests and fixtures consume.
import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

import { getEnvironmentDefaults } from './environments';
import { EnvSecretProvider, SecretManager } from './secret-manager';
import { loadTestEnvironment } from './test-env';

const environment = loadTestEnvironment();

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${environment}`),
  override: true
});

const runtimeConfigSchema = z.object({
  testEnv: z.enum(['dev', 'staging', 'prod']),
  testRunId: z.string().min(1),
  uiBaseUrl: z.string().url(),
  credentials: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export function loadRuntimeConfig(): RuntimeConfig {
  const defaults = getEnvironmentDefaults(environment);
  const secretManager = new SecretManager(new EnvSecretProvider());

  const uiBaseUrl =
    process.env[`${environment.toUpperCase()}_UI_BASE_URL`] ??
    process.env.UI_BASE_URL ??
    defaults.uiBaseUrl;

  return runtimeConfigSchema.parse({
    testEnv: environment,
    testRunId: process.env.TEST_RUN_ID ?? 'local',
    uiBaseUrl,
    credentials: {
      username:
        secretManager.getOptionalSecret('APP_USERNAME', environment) ??
        defaults.credentials.username,
      password:
        secretManager.getOptionalSecret('APP_PASSWORD', environment) ??
        defaults.credentials.password
    }
  });
}
