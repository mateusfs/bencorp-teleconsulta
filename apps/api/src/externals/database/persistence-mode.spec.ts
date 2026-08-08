import {
  canReachPostgres,
  ensurePersistenceMode,
  resolvePersistenceMode,
  usesMemoryStore,
  connectsPrisma,
} from '@/externals/database/persistence-mode';

describe('persistence-mode', () => {
  const originalMode = process.env.PERSISTENCE_MODE;
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.PERSISTENCE_MODE;
    } else {
      process.env.PERSISTENCE_MODE = originalMode;
    }
    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('resolve modos válidos e default memory', () => {
    expect(resolvePersistenceMode('memory')).toBe('memory');
    expect(resolvePersistenceMode('write-behind')).toBe('write-behind');
    expect(resolvePersistenceMode('postgres')).toBe('postgres');
    expect(resolvePersistenceMode('outro')).toBe('memory');
    expect(resolvePersistenceMode(undefined)).toBe('memory');
  });

  it('flags de store e prisma', () => {
    expect(usesMemoryStore('memory')).toBe(true);
    expect(usesMemoryStore('write-behind')).toBe(true);
    expect(usesMemoryStore('postgres')).toBe(false);
    expect(connectsPrisma('memory')).toBe(false);
    expect(connectsPrisma('write-behind')).toBe(true);
    expect(connectsPrisma('postgres')).toBe(true);
  });

  it('ensurePersistenceMode respeita valor explícito', async () => {
    await expect(ensurePersistenceMode('memory')).resolves.toBe('memory');
    expect(process.env.PERSISTENCE_MODE).toBe('memory');
    await expect(ensurePersistenceMode('postgres')).resolves.toBe('postgres');
    expect(process.env.PERSISTENCE_MODE).toBe('postgres');
  });

  it('ensurePersistenceMode cai em memory sem DATABASE_URL', async () => {
    delete process.env.PERSISTENCE_MODE;
    await expect(ensurePersistenceMode(undefined, undefined)).resolves.toBe(
      'memory',
    );
    expect(process.env.PERSISTENCE_MODE).toBe('memory');
  });

  it('canReachPostgres retorna false para URL inválida', async () => {
    await expect(canReachPostgres('not-a-url')).resolves.toBe(false);
  });

  it('ensurePersistenceMode usa memory quando a porta não responde', async () => {
    delete process.env.PERSISTENCE_MODE;
    await expect(
      ensurePersistenceMode(
        undefined,
        'postgresql://u:p@127.0.0.1:1/db?schema=public',
      ),
    ).resolves.toBe('memory');
    expect(process.env.PERSISTENCE_MODE).toBe('memory');
  });

  it('ensurePersistenceMode usa postgres quando a porta responde', async () => {
    const net = await import('node:net');
    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('porta de teste indisponível');
      }
      delete process.env.PERSISTENCE_MODE;
      await expect(
        ensurePersistenceMode(
          undefined,
          `postgresql://u:p@127.0.0.1:${address.port}/db?schema=public`,
        ),
      ).resolves.toBe('postgres');
      expect(process.env.PERSISTENCE_MODE).toBe('postgres');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
