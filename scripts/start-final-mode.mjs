import { existsSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const databaseDir = join(rootDir, 'tmp', 'embedded-postgres');
const databaseName = 'farefoto';
const databasePort = 5432;
const databaseUser = 'farefoto';
const databasePassword = 'farefoto';
const databaseUrl = `postgresql://${databaseUser}:${databasePassword}@127.0.0.1:${databasePort}/${databaseName}`;

const postgres = new EmbeddedPostgres({
  databaseDir,
  port: databasePort,
  user: databaseUser,
  password: databasePassword,
  persistent: true,
  onLog: (message) => process.stdout.write(`[postgres] ${String(message)}`),
  onError: (message) => process.stderr.write(`[postgres] ${String(message)}\n`),
});

const childProcesses = [];
let shuttingDown = false;

function spawnApp(name, args, env) {
  const child = spawn('npm', args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });

  childProcesses.push(child);
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(
        `[${name}] encerrou antes do esperado (${signal ?? code ?? 'sem codigo'}).`,
      );
      void shutdown(code ?? 1);
    }
  });

  return child;
}

async function ensureDatabase() {
  mkdirSync(databaseDir, { recursive: true });

  if (!existsSync(join(databaseDir, 'PG_VERSION'))) {
    await postgres.initialise();
  }

  await postgres.start();

  try {
    await postgres.createDatabase(databaseName);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  await Promise.all(
    childProcesses.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) {
            resolve(undefined);
            return;
          }

          child.once('exit', () => resolve(undefined));
        }),
    ),
  );

  await postgres.stop().catch((error) => {
    console.error('[postgres] falha ao encerrar:', error);
  });

  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

await ensureDatabase();

console.log(`Modo final ativo com PostgreSQL em ${databaseUrl}`);

spawnApp('api', ['run', 'start:prod', '--workspace=api'], {
  NODE_ENV: 'production',
  PORT: '3000',
  DATABASE_URL: databaseUrl,
});

spawnApp('admin', ['run', 'start', '--workspace=admin'], {
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
});

spawnApp('web', ['run', 'start', '--workspace=web'], {
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
});

await new Promise(() => undefined);
