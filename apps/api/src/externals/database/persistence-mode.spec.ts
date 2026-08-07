import {
  resolvePersistenceMode,
  usesMemoryStore,
  connectsPrisma,
} from '@/externals/database/persistence-mode';

describe('persistence-mode', () => {
  const original = process.env.PERSISTENCE_MODE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PERSISTENCE_MODE;
    } else {
      process.env.PERSISTENCE_MODE = original;
    }
  });

  it('resolve modos válidos e default postgres', () => {
    expect(resolvePersistenceMode('memory')).toBe('memory');
    expect(resolvePersistenceMode('write-behind')).toBe('write-behind');
    expect(resolvePersistenceMode('postgres')).toBe('postgres');
    expect(resolvePersistenceMode('outro')).toBe('postgres');
    expect(resolvePersistenceMode(undefined)).toBe('postgres');
  });

  it('flags de store e prisma', () => {
    expect(usesMemoryStore('memory')).toBe(true);
    expect(usesMemoryStore('write-behind')).toBe(true);
    expect(usesMemoryStore('postgres')).toBe(false);
    expect(connectsPrisma('memory')).toBe(false);
    expect(connectsPrisma('write-behind')).toBe(true);
    expect(connectsPrisma('postgres')).toBe(true);
  });
});
