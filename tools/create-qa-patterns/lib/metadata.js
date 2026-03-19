const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function pathMatchesPattern(relativePath, pattern) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  }

  return relativePath === pattern;
}

function collectRelativeFiles(rootDirectory) {
  const results = [];

  function visit(currentDirectory) {
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = normalizePath(
        path.relative(rootDirectory, absolutePath)
      );

      if (entry.isDirectory()) {
        visit(absolutePath);
      } else {
        results.push(relativePath);
      }
    }
  }

  visit(rootDirectory);

  return results.sort();
}

function isManagedFile(template, relativePath, managedPatterns) {
  const patterns = [
    ...managedPatterns.common,
    ...(managedPatterns[template.id] || [])
  ];
  return patterns.some((pattern) => pathMatchesPattern(relativePath, pattern));
}

function transformTemplateFile(
  relativePath,
  content,
  targetDirectory,
  template,
  toPackageName
) {
  const packageName = toPackageName(targetDirectory, template);

  if (relativePath === 'package.json') {
    const pkg = JSON.parse(content);
    return `${JSON.stringify({ ...pkg, name: packageName }, null, 2)}\n`;
  }

  if (relativePath === 'package-lock.json') {
    const lock = JSON.parse(content);
    return `${JSON.stringify(
      {
        ...lock,
        name: packageName,
        packages: lock.packages
          ? {
              ...lock.packages,
              '': {
                ...lock.packages[''],
                name: packageName
              }
            }
          : lock.packages
      },
      null,
      2
    )}\n`;
  }

  return content;
}

function renderTemplateFile(template, relativePath, targetDirectory, options) {
  const { defaultGitignore, getTemplateDirectory, toPackageName } = options;

  if (relativePath === '.gitignore') {
    const gitignorePath = path.join(
      getTemplateDirectory(template.id),
      '.gitignore'
    );
    const gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf8')
      : defaultGitignore;
    return transformTemplateFile(
      relativePath,
      gitignoreContent,
      targetDirectory,
      template,
      toPackageName
    );
  }

  const sourcePath = path.join(getTemplateDirectory(template.id), relativePath);
  const content = fs.readFileSync(sourcePath, 'utf8');
  return transformTemplateFile(
    relativePath,
    content,
    targetDirectory,
    template,
    toPackageName
  );
}

function getManagedRelativePaths(template, options) {
  const { getTemplateDirectory, managedPatterns, metadataFilename } = options;
  const templateDirectory = getTemplateDirectory(template.id);
  const templateFiles = collectRelativeFiles(templateDirectory).filter(
    (relativePath) => isManagedFile(template, relativePath, managedPatterns)
  );
  const managedFiles = new Set(templateFiles);
  managedFiles.add('.gitignore');
  managedFiles.delete(metadataFilename);
  return [...managedFiles].sort();
}

function getMetadataPath(targetDirectory, metadataFilename) {
  return path.join(targetDirectory, metadataFilename);
}

function buildProjectMetadata(template, targetDirectory, options) {
  const { cliPackageVersion, metadataFilename } = options;
  const managedFiles = {};

  for (const relativePath of getManagedRelativePaths(template, options)) {
    const absolutePath = path.join(targetDirectory, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    managedFiles[relativePath] = {
      baselineHash: sha256(fs.readFileSync(absolutePath, 'utf8'))
    };
  }

  return {
    schemaVersion: 1,
    template: template.id,
    templateVersion: cliPackageVersion,
    packageName: options.toPackageName(targetDirectory, template),
    generatedAt: new Date().toISOString(),
    managedFiles,
    metadataFilename
  };
}

function writeProjectMetadata(
  template,
  targetDirectory,
  existingMetadata,
  options
) {
  const nextMetadata = buildProjectMetadata(template, targetDirectory, options);

  if (existingMetadata) {
    nextMetadata.generatedAt =
      existingMetadata.generatedAt || nextMetadata.generatedAt;
    nextMetadata.templateVersion =
      existingMetadata.templateVersion || nextMetadata.templateVersion;
  }

  fs.writeFileSync(
    getMetadataPath(targetDirectory, options.metadataFilename),
    `${JSON.stringify(nextMetadata, null, 2)}\n`,
    'utf8'
  );
  return nextMetadata;
}

function readProjectMetadata(targetDirectory, metadataFilename) {
  const metadataPath = getMetadataPath(targetDirectory, metadataFilename);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`No ${metadataFilename} file found in ${targetDirectory}.`);
  }

  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

function detectTemplateFromProject(targetDirectory, metadataFilename) {
  const metadataPath = getMetadataPath(targetDirectory, metadataFilename);
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    return metadata.template;
  }

  if (fs.existsSync(path.join(targetDirectory, 'playwright.config.ts'))) {
    return 'playwright-template';
  }

  if (fs.existsSync(path.join(targetDirectory, 'cypress.config.ts'))) {
    return 'cypress-template';
  }

  if (fs.existsSync(path.join(targetDirectory, 'wdio.conf.ts'))) {
    return 'wdio-template';
  }

  throw new Error(`Could not detect the template used for ${targetDirectory}.`);
}

function analyzeUpgrade(template, targetDirectory, metadata, options) {
  const managedPaths = getManagedRelativePaths(template, options);
  const results = [];

  for (const relativePath of managedPaths) {
    const absolutePath = path.join(targetDirectory, relativePath);
    const latestContent = renderTemplateFile(
      template,
      relativePath,
      targetDirectory,
      options
    );
    const latestHash = sha256(latestContent);
    const baselineHash =
      metadata.managedFiles?.[relativePath]?.baselineHash || null;
    const currentExists = fs.existsSync(absolutePath);
    const currentHash = currentExists
      ? sha256(fs.readFileSync(absolutePath, 'utf8'))
      : null;

    let status = 'up-to-date';

    if (!baselineHash) {
      if (!currentExists) {
        status = 'new-file';
      } else if (currentHash === latestHash) {
        status = 'new-file';
      } else {
        status = 'conflict';
      }
    } else if (!currentExists) {
      status = 'conflict';
    } else if (currentHash === latestHash) {
      status = 'up-to-date';
    } else if (currentHash === baselineHash) {
      status = 'safe-update';
    } else {
      status = 'conflict';
    }

    results.push({
      relativePath,
      status,
      latestContent,
      latestHash,
      currentHash,
      baselineHash,
      currentExists
    });
  }

  return results;
}

function applySafeUpdates(targetDirectory, metadata, results, options) {
  const nextMetadata = {
    ...metadata,
    managedFiles: {
      ...metadata.managedFiles
    }
  };

  let appliedCount = 0;

  for (const entry of results) {
    if (!['safe-update', 'new-file'].includes(entry.status)) {
      continue;
    }

    const absolutePath = path.join(targetDirectory, entry.relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, entry.latestContent, 'utf8');
    nextMetadata.managedFiles[entry.relativePath] = {
      baselineHash: entry.latestHash
    };
    appliedCount += 1;
  }

  const remainingConflicts = results.filter(
    (entry) => entry.status === 'conflict'
  ).length;
  if (remainingConflicts === 0) {
    nextMetadata.templateVersion = options.cliPackageVersion;
  }

  fs.writeFileSync(
    getMetadataPath(targetDirectory, options.metadataFilename),
    `${JSON.stringify(nextMetadata, null, 2)}\n`,
    'utf8'
  );

  return {
    appliedCount,
    remainingConflicts
  };
}

module.exports = {
  analyzeUpgrade,
  applySafeUpdates,
  buildProjectMetadata,
  collectRelativeFiles,
  detectTemplateFromProject,
  getManagedRelativePaths,
  readProjectMetadata,
  renderTemplateFile,
  sha256,
  writeProjectMetadata
};
