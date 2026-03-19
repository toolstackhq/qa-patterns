const state = {
  people: [],
  counters: {
    person: 0
  }
};

function nextId() {
  state.counters.person += 1;
  return `person-${String(state.counters.person).padStart(4, '0')}`;
}

function getPerson(personId) {
  return state.people.find((person) => person.personId === personId);
}

function createPerson(payload) {
  const personId = payload.personId || nextId();
  if (getPerson(personId)) {
    throw new Error(`Person ${personId} already exists`);
  }

  const person = {
    personId,
    name: payload.name,
    role: payload.role,
    email: payload.email
  };

  state.people.push(person);
  return person;
}

module.exports = {
  state,
  createPerson
};
