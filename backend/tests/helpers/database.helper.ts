import { PrismaClient } from '@prisma/client';

export class DatabaseTestHelper {
  constructor(private prisma: PrismaClient) {}

  /**
   * Clears the database by truncating all tables.
   * Uses TRUNCATE CASCADE to ensure relationships are handled correctly.
   */
  async clearDatabase(): Promise<void> {
    // Only allow clearing the database in the test environment
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearDatabase() can only be called in the test environment');
    }

    const tableNames = await this.prisma.$queryRaw<
      Array<{ tablename: string; schemaname: string }>
    >`
      SELECT tablename, schemaname
      FROM pg_tables
      WHERE schemaname IN ('identity', 'astrology', 'content')
    `;

    for (const { tablename, schemaname } of tableNames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "${schemaname}"."${tablename}" CASCADE;`
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error truncating table ${schemaname}.${tablename}`, error);
        }
      }
    }
  }
}
