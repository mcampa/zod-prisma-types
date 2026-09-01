import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const E2E_DIR = path.resolve(__dirname);
export const REPO_ROOT = path.resolve(E2E_DIR, '..');
export const GENERATED_DIR = path.join(E2E_DIR, '.generated');

/**
 * The generator reads the *declared* `@prisma/client` version out of the
 * `dependencies` of the package.json in `process.cwd()` to decide which
 * version-gated branch to emit (see `src/utils/getPackageVersion.ts`), and
 * ignores devDependencies. Since this repo depends on Prisma only for testing,
 * generating from the repo root would silently fall back to the default 6.18.0
 * and never exercise the Prisma 7 branches.
 *
 * So each run gets a throwaway work directory whose package.json declares the
 * versions under test, and prisma is invoked from there. Everything else
 * resolves normally: the fixtures' output paths are relative to the schema
 * file, node_modules resolution walks up into the repo root, and the fixtures'
 * `provider = "node ../../dist/bin.js"` is relative to this directory.
 */
const makeWorkDir = (name: string, prismaClientVersion: string) => {
  const dir = path.join(E2E_DIR, `.workdir-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `e2e-workdir-${name}`,
        version: '0.0.0',
        dependencies: {
          '@prisma/client': prismaClientVersion,
          zod: readRepoDependency('zod'),
        },
      },
      null,
      2,
    ),
  );
  return dir;
};

const readRepoDependency = (name: string) => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'),
  ) as Record<string, Record<string, string>>;
  const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  if (!version) throw new Error(`${name} is not a dependency of this package`);
  return version;
};

/** The Prisma version the e2e suite runs against, taken from our devDependencies. */
export const PRISMA_VERSION_UNDER_TEST = readRepoDependency('@prisma/client');

export type GenerateResult = {
  /** Absolute path of the generated zod file. */
  file: string;
  /** Contents of the generated zod file. */
  content: string;
  /** Combined stdout/stderr of the prisma CLI. */
  output: string;
};

/**
 * Runs a real `prisma generate` over a fixture schema, driving the generator
 * through its published entry point (`dist/bin.js`) exactly as a consumer does.
 * Throws if the CLI exits non-zero, so a crashing generator fails the test.
 */
export const generateFixture = (
  fixture: string,
  { prismaClientVersion = PRISMA_VERSION_UNDER_TEST } = {},
): GenerateResult => {
  const schema = path.join(E2E_DIR, 'fixtures', `${fixture}.prisma`);
  const cwd = makeWorkDir(fixture, prismaClientVersion);

  const output = execFileSync(
    path.join(REPO_ROOT, 'node_modules', '.bin', 'prisma'),
    ['generate', '--schema', schema],
    { cwd, encoding: 'utf-8', stdio: 'pipe' },
  );

  const file = path.join(GENERATED_DIR, fixture, 'zod', 'index.ts');
  if (!fs.existsSync(file)) {
    throw new Error(`generator produced no output at ${file}\n${output}`);
  }

  return { file, content: fs.readFileSync(file, 'utf-8'), output };
};
