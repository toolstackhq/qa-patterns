import { faker } from "@faker-js/faker";

function hashSeed(value: string): number {
  return value.split("").reduce((seed, character) => {
    return ((seed << 5) - seed + character.charCodeAt(0)) | 0;
  }, 0);
}

export function createSeededFaker(seedInput: string) {
  const instance = faker;
  instance.seed(Math.abs(hashSeed(seedInput)));
  return instance;
}
