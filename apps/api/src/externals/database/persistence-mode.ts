import net from 'node:net';

export type PersistenceMode = 'memory' | 'write-behind' | 'postgres';

const KNOWN_MODES = new Set<PersistenceMode>([
  'memory',
  'write-behind',
  'postgres',
]);

export function resolvePersistenceMode(
  raw: string | undefined = process.env.PERSISTENCE_MODE,
): PersistenceMode {
  const value = (raw ?? '').trim().toLowerCase();
  if (KNOWN_MODES.has(value as PersistenceMode)) {
    return value as PersistenceMode;
  }
  return 'memory';
}

export function usesMemoryStore(mode: PersistenceMode): boolean {
  return mode === 'memory' || mode === 'write-behind';
}

export function connectsPrisma(mode: PersistenceMode): boolean {
  return mode === 'postgres' || mode === 'write-behind';
}

function parseDatabaseTarget(
  databaseUrl: string,
): { host: string; port: number } | null {
  try {
    const url = new URL(databaseUrl);
    if (!url.hostname) {
      return null;
    }
    return {
      host: url.hostname,
      port: Number(url.port || 5432),
    };
  } catch {
    return null;
  }
}

export function canReachPostgres(
  databaseUrl: string,
  timeoutMs = 1000,
): Promise<boolean> {
  const target = parseDatabaseTarget(databaseUrl);
  if (!target) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const socket = net.connect({ host: target.host, port: target.port });
    const finish = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

export async function ensurePersistenceMode(
  raw: string | undefined = process.env.PERSISTENCE_MODE,
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): Promise<PersistenceMode> {
  const explicit = (raw ?? '').trim().toLowerCase();
  if (KNOWN_MODES.has(explicit as PersistenceMode)) {
    process.env.PERSISTENCE_MODE = explicit;
    return explicit as PersistenceMode;
  }

  if (!databaseUrl) {
    process.env.PERSISTENCE_MODE = 'memory';
    return 'memory';
  }

  const reachable = await canReachPostgres(databaseUrl);
  const mode: PersistenceMode = reachable ? 'postgres' : 'memory';
  process.env.PERSISTENCE_MODE = mode;
  return mode;
}
