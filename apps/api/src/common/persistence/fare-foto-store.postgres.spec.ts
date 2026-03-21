import { rmSync } from 'fs';
import { join } from 'path';

const mockEnd = jest.fn<Promise<void>, []>();
const mockQuery = jest.fn<
  Promise<{ rows: Array<{ payload?: unknown }> }>,
  []
>();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    end: mockEnd,
  })),
}));

import { FareFotoStoreService } from './fare-foto-store.service';

describe('FareFotoStoreService in postgres mode', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousPersist = process.env.FARE_FOTO_STORE_PERSIST;
  const previousPath = process.env.FARE_FOTO_STORE_PATH;
  const testFilePath = join(
    process.cwd(),
    'tmp',
    'fare-foto-store.postgres.spec.json',
  );

  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://farefoto:farefoto@localhost:5432/farefoto';
    delete process.env.FARE_FOTO_STORE_PERSIST;
    process.env.FARE_FOTO_STORE_PATH = testFilePath;
    rmSync(testFilePath, { force: true });
    mockEnd.mockReset();
    mockEnd.mockResolvedValue();
    mockQuery.mockReset();
    mockQuery.mockImplementation((queryText?: unknown) => {
      const sql = typeof queryText === 'string' ? queryText : '';

      if (sql.includes('SELECT payload')) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });
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

  it('should load and persist state through PostgreSQL', async () => {
    const store = new FareFotoStoreService();

    await store.onModuleInit();

    store.write('clientes', [
      {
        id: 'cliente-1',
        nome: 'Joao',
        telefone: '11999999999',
        createdAt: new Date('2026-03-21T12:00:00.000Z'),
      },
    ]);

    await store.onApplicationShutdown();

    expect(store.getDriver()).toBe('postgres');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE TABLE IF NOT EXISTS fare_foto_store_snapshots',
      ),
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT payload'),
      ['default'],
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fare_foto_store_snapshots'),
      ['default', expect.stringContaining('"clientes":[{"id":"cliente-1"')],
    );
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should hydrate dates from PostgreSQL payloads', async () => {
    mockQuery.mockImplementation((queryText?: unknown) => {
      const sql = typeof queryText === 'string' ? queryText : '';

      if (sql.includes('SELECT payload')) {
        return Promise.resolve({
          rows: [
            {
              payload: {
                clientes: [
                  {
                    id: 'cliente-1',
                    nome: 'Maria',
                    telefone: '11888888888',
                    createdAt: '2026-03-21T12:00:00.000Z',
                  },
                ],
              },
            },
          ],
        });
      }

      return Promise.resolve({ rows: [] });
    });

    const store = new FareFotoStoreService();

    await store.onModuleInit();

    const clientes = store.read('clientes');

    expect(clientes).toHaveLength(1);
    expect(Object.prototype.toString.call(clientes[0].createdAt)).toBe(
      '[object Date]',
    );
    expect(clientes[0].createdAt.toISOString()).toBe(
      '2026-03-21T12:00:00.000Z',
    );

    await store.onApplicationShutdown();
  });
});
