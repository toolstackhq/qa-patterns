const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

function getCommandName(base) {
  if (process.platform === 'win32') {
    return `${base}.cmd`;
  }

  return base;
}

function commandExists(command) {
  const result = spawnSync(getCommandName(command), ['--version'], {
    stdio: 'ignore'
  });

  return !result.error && result.status === 0;
}

function collectPrerequisites() {
  return {
    npm: commandExists('npm'),
    npx: commandExists('npx'),
    docker: commandExists('docker'),
    git: commandExists('git')
  };
}

function initializeGitRepository(targetDirectory) {
  if (require('node:fs').existsSync(path.join(targetDirectory, '.git'))) {
    return;
  }

  const result = spawnSync(getCommandName('git'), ['init'], {
    cwd: targetDirectory,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'git init failed.');
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(getCommandName(command), args, {
      cwd,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code}`)
      );
    });

    child.on('error', reject);
  });
}

module.exports = {
  collectPrerequisites,
  commandExists,
  getCommandName,
  initializeGitRepository,
  runCommand
};
