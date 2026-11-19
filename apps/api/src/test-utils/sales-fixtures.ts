import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from './postgres-container';

/** An ephemeral database with a seller and the catalog rows every test book points to. */
export async function startSalesDatabase() {
  const db: TestDatabase = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  const prisma = new PrismaService();
  const seller = { email: 'v@cmpc.cl', name: 'Vendedora', passwordHash: 'h' };
  const userId = (await db.prisma.user.create({ data: seller })).id;
  const refs = {
    authorId: (await db.prisma.author.create({ data: { name: 'A' } })).id,
    publisherId: (await db.prisma.publisher.create({ data: { name: 'P' } })).id,
    genreId: (await db.prisma.genre.create({ data: { name: 'G' } })).id,
  };
  const addBook = (title: string, stock: number, deletedAt: Date | null = null) =>
    db.prisma.book.create({ data: { title, price: 1000, stock, deletedAt, ...refs } });
  const stop = async () => {
    await prisma.onModuleDestroy();
    await db.stop();
  };
  return { db, prisma, userId, addBook, stop };
}
