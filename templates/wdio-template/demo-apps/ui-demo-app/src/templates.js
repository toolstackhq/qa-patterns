function layout({ title, body, flashMessage = '', username = 'Local user' }) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <div class="layout">
        <header class="header">
          <div class="brand">UI Patterns Demo</div>
          <nav class="nav" aria-label="Primary">
            <a href="/people">People</a>
          </nav>
        </header>
        ${flashMessage ? `<div class="flash-message" data-testid="flash-message" role="status">${flashMessage}</div>` : ''}
        <p data-testid="welcome-message">Signed in as ${username}</p>
        ${body}
      </div>
    </body>
  </html>`;
}

function loginPage(errorMessage = '') {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Login</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <main class="login-shell">
        <section class="card login-card">
          <h1>Login</h1>
          <p>Keep the example intentionally small: sign in, add one person, assert the list.</p>
          ${errorMessage ? `<div class="flash-message" role="status">${errorMessage}</div>` : ''}
          <form action="/login" method="post">
            <label for="username">
              Username
              <input id="username" name="username" type="text" autocomplete="username" required />
            </label>
            <label for="password">
              Password
              <input id="password" name="password" type="password" autocomplete="current-password" required />
            </label>
            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    </body>
  </html>`;
}

function peoplePage(people) {
  const rows = people
    .map((person) => {
      return `<tr data-testid="person-row-${person.personId}">
        <td>${person.name}</td>
        <td>${person.role}</td>
        <td>${person.email}</td>
      </tr>`;
    })
    .join('');

  return `
    <section class="panel-grid">
      <section class="panel">
        <h1>People</h1>
        <form action="/people" method="post">
          <label for="personId">
            Person ID
            <input id="personId" name="personId" type="text" required />
          </label>
          <label for="name">
            Name
            <input id="name" name="name" type="text" required />
          </label>
          <label for="role">
            Role
            <input id="role" name="role" type="text" required />
          </label>
          <label for="email">
            Email
            <input id="email" name="email" type="email" required />
          </label>
          <button type="submit">Add person</button>
        </form>
      </section>
      <section class="panel">
        <h2>Directory</h2>
        <form action="/people" method="get">
          <label for="search">
            Search
            <input id="search" name="search" type="text" placeholder="Search people" />
          </label>
          <button type="submit">Apply filter</button>
        </form>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    </section>
  `;
}

module.exports = {
  layout,
  loginPage,
  peoplePage
};
