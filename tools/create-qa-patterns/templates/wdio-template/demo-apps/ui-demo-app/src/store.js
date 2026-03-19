const fs = require('node:fs');
const path = require('node:path');

const dotenv = require('dotenv');

function loadClosestEnv(startDirectory) {
  let currentDirectory = startDirectory;

  while (true) {
    const candidate = path.join(currentDirectory, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return;
    }

    currentDirectory = parentDirectory;
  }
}

loadClosestEnv(process.cwd());
loadClosestEnv(__dirname);

const state = {
  credentials: {
    username:
      process.env.UI_DEMO_USERNAME || process.env.DEV_APP_USERNAME || '',
    password: process.env.UI_DEMO_PASSWORD || process.env.DEV_APP_PASSWORD || ''
  },
  people: []
};

function findPerson(personId) {
  return state.people.find((person) => person.personId === personId);
}

function createPerson(person) {
  if (findPerson(person.personId)) {
    throw new Error(`Person ${person.personId} already exists`);
  }

  state.people.push({
    personId: person.personId,
    name: person.name,
    role: person.role,
    email: person.email
  });
}

function getPeople(search = '') {
  const query = String(search).trim().toLowerCase();
  if (!query) {
    return state.people;
  }

  return state.people.filter((person) => {
    return [person.name, person.role, person.email].some((value) =>
      value.toLowerCase().includes(query)
    );
  });
}

module.exports = {
  state,
  createPerson,
  getPeople
};
