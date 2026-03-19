const express = require('express');

const { createPerson, state } = require('./store');

const app = express();
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || '3001');

app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/people', (_request, response) => {
  response.json(state.people);
});

app.post('/people', (request, response) => {
  const { name, role, email } = request.body;
  if (!name || !role || !email) {
    response.status(400).json({ error: 'name, role, and email are required' });
    return;
  }

  try {
    const person = createPerson(request.body);
    response.status(201).json(person);
  } catch (error) {
    response.status(409).json({ error: error.message });
  }
});

app.listen(port, host, () => {
  console.log(`API demo server listening on http://${host}:${port}`);
});
