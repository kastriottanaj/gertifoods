// Post-build step: tell search engines which pages this build changed.
//
// It is the last link in `npm run build`, so it only runs once the build has
// passed its checks, and because nginx serves dist/ directly the changed pages
// are already live when the engines come to look. Hooking the build rather than
// a deploy script is what makes this automatic: catalogue rebuilds and both
// deploy recipes in deploy/DEPLOY.md all go through `npm run build`.
//
// All the logic is in `manage.py ping_indexnow --changed`, including the
// INDEXNOW_AUTO_SUBMIT switch that keeps local builds from submitting anything.
//
// This step must never fail the build. By now the new pages are being served,
// so a non-zero exit would report a successful deploy as a failed one because of
// an outage at IndexNow. The command only records a submission once it has been
// accepted, so whatever fails here is picked up again by the next build.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PYTHON = join(ROOT, 'venv', 'bin', 'python');

// Two requests at up to 30 seconds each, plus Django starting up.
const TIMEOUT_MS = 120_000;

if (!existsSync(PYTHON)) {
  console.log(`indexnow: no virtualenv at ${PYTHON}, skipping.`);
  process.exit(0);
}

const result = spawnSync(PYTHON, ['manage.py', 'ping_indexnow', '--changed'], {
  cwd: ROOT,
  stdio: 'inherit',
  timeout: TIMEOUT_MS,
});

if (result.status !== 0) {
  console.warn(
    'indexnow: submission did not complete, see above. The build is fine and\n' +
      'indexnow: the next one will report these pages again. To retry now, run\n' +
      'indexnow:   ./venv/bin/python manage.py ping_indexnow --changed'
  );
}
