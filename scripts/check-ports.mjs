#!/usr/bin/env node
// Pre-flight port check for local dev. Runs automatically before `npm run dev` (see the `predev`
// script in package.json). Checks every port MyCondo's local dev stack needs — its own web port
// plus the companion mycondo-api ports — so a conflict is caught before Vite (or the API) starts,
// not after. See docs/local-development-ports.md for the full multi-project port registry this
// belongs to (MyCondo is one of several local apps sharing this machine).
import net from 'node:net';
import { execSync } from 'node:child_process';

const PORTS = [
  { port: Number(process.env.MYCONDO_WEB_PORT) || 4219, owner: 'mycondo-web dev server' },
  { port: Number(process.env.MYCONDO_API_HTTPS_PORT) || 7219, owner: 'mycondo-api (HTTPS)' },
  { port: Number(process.env.MYCONDO_API_HTTP_PORT) || 5219, owner: 'mycondo-api (HTTP)' },
];

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

function describeOccupant(port) {
  if (process.platform !== 'win32') {
    try {
      return execSync(`lsof -i :${port} -sTCP:LISTEN -P -n`, { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  }

  try {
    const netstatOutput = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf8' });
    const listeningLine = netstatOutput
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes('LISTENING'));

    if (!listeningLine) return null;

    const pid = listeningLine.split(/\s+/).pop();
    try {
      const tasklistOutput = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' });
      const processName = tasklistOutput.split(',')[0]?.replace(/"/g, '');
      return `PID ${pid}${processName ? ` (${processName})` : ''}`;
    } catch {
      return `PID ${pid}`;
    }
  } catch {
    return null;
  }
}

const conflicts = [];
for (const { port, owner } of PORTS) {
  // eslint-disable-next-line no-await-in-loop -- sequential is fine for 3 quick checks
  const free = await isPortFree(port);
  if (!free) {
    conflicts.push({ port, owner, occupant: describeOccupant(port) });
  }
}

if (conflicts.length > 0) {
  console.error('\n✖ MyCondo local port check failed — reserved port(s) already in use:\n');
  for (const { port, owner, occupant } of conflicts) {
    console.error(`  - :${port} (${owner})${occupant ? ` — held by ${occupant}` : ''}`);
  }
  console.error(
    '\nRemediation:\n' +
      '  1. Stop whatever is holding the port above (e.g. `taskkill /PID <pid> /F` on Windows), or\n' +
      '  2. If it is a different local project, see docs/local-development-ports.md for the\n' +
      '     reserved range and free up MyCondo\'s ports, or\n' +
      '  3. Override the port for this run, e.g. `MYCONDO_WEB_PORT=4229 npm run dev` (also update\n' +
      '     mycondo-api\'s launchSettings.json / CORS origins to match if you override the API ports).\n',
  );
  process.exit(1);
}

console.log(`✓ MyCondo ports free: ${PORTS.map((p) => p.port).join(', ')}`);
