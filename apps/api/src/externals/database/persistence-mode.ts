export type PersistenceMode = 'memory' | 'write-behind' | 'postgres';

export function resolvePersistenceMode(
  raw: string | undefined = process.env.PERSISTENCE_MODE,
): PersistenceMode {
  const value = (raw ?? 'postgres').trim().toLowerCase();
  if (value === 'memory' || value === 'write-behind' || value === 'postgres') {
    return value;
  }
  return 'postgres';
}

export function usesMemoryStore(mode: PersistenceMode): boolean {
  return mode === 'memory' || mode === 'write-behind';
}

export function connectsPrisma(mode: PersistenceMode): boolean {
  return mode === 'postgres' || mode === 'write-behind';
}
