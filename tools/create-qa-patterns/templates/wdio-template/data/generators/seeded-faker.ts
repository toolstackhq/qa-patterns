// Seeded faker wrapper so generated values stay stable for a given run id.
import { Faker, en } from '@faker-js/faker';

function hashSeed(value: string): number {
  return value.split('').reduce((seed, character) => {
    return ((seed << 5) - seed + character.charCodeAt(0)) | 0;
  }, 0);
}

export function createSeededFaker(seedInput: string): Faker {
  const instance = new Faker({ locale: [en] });
  instance.seed(Math.abs(hashSeed(seedInput)));
  return instance;
}
