import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { FareFotoStoreService } from './fare-foto-store.service';

describe('FareFotoStoreService', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousPersist = process.env.FARE_FOTO_STORE_PERSIST;
  const previousPath = process.env.FARE_FOTO_STORE_PATH;
  const testFilePath = join(process.cwd(), 'tmp', 'fare-foto-store.spec.json');

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    process.env.FARE_FOTO_STORE_PERSIST = 'true';
    process.env.FARE_FOTO_STORE_PATH = testFilePath;
    rmSync(testFilePath, { force: true });
  });

  afterAll(() => {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }

    if (previousPersist === undefined) {
      delete process.env.FARE_FOTO_STORE_PERSIST;
    } else {
      process.env.FARE_FOTO_STORE_PERSIST = previousPersist;
    }

    if (previousPath === undefined) {
      delete process.env.FARE_FOTO_STORE_PATH;
    } else {
      process.env.FARE_FOTO_STORE_PATH = previousPath;
    }

    rmSync(testFilePath, { force: true });
  });

  it('should persist state to disk and reload dates correctly', () => {
    const store = new FareFotoStoreService();
    const createdAt = new Date('2026-03-21T12:00:00.000Z');

    store.write('clientes', [
      {
        id: 'cliente-1',
        nome: 'Joao',
        telefone: '11999999999',
        createdAt,
      },
    ]);

    expect(existsSync(testFilePath)).toBe(true);

    const reloadedStore = new FareFotoStoreService();
    const clientes = reloadedStore.read('clientes');

    expect(clientes).toHaveLength(1);
    expect(Object.prototype.toString.call(clientes[0].createdAt)).toBe(
      '[object Date]',
    );
    expect(clientes[0].createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('should return clones so callers do not mutate the store accidentally', () => {
    const store = new FareFotoStoreService();

    store.write('clientes', [
      {
        id: 'cliente-1',
        nome: 'Joao',
        telefone: '11999999999',
        createdAt: new Date('2026-03-21T12:00:00.000Z'),
      },
    ]);

    const clientes = store.read('clientes');
    clientes[0].nome = 'Maria';

    expect(store.read('clientes')[0].nome).toBe('Joao');
  });
});
