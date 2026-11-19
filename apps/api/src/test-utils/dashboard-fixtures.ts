import type { PrismaClient } from '@prisma/client';

/**
 * Active: Novela x2 (stock 2 and 0), Ensayo x1 (stock 1); one deleted Novela that must not count.
 * Sales: 2 pending, 2 completed (1000.50 + 2500), 1 cancelled. Users: 2 active, 1 deactivated.
 * Audit: 12 entries, one per minute; the newest two come without an author.
 */
export async function seedDashboardData(prisma: PrismaClient): Promise<void> {
  const base = { passwordHash: 'h', role: 'USER' as const };
  const [ana, beto] = await Promise.all([
    prisma.user.create({ data: { ...base, email: 'ana@cmpc.cl', name: 'Ana' } }),
    prisma.user.create({ data: { ...base, email: 'beto@cmpc.cl', name: 'Beto' } }),
    prisma.user.create({
      data: { ...base, email: 'baja@cmpc.cl', name: 'Baja', deletedAt: new Date() },
    }),
  ]);
  const author = await prisma.author.create({ data: { name: 'Autor' } });
  const publisher = await prisma.publisher.create({ data: { name: 'Editorial' } });
  const [novela, ensayo] = await Promise.all(
    ['Novela', 'Ensayo', 'Vacío'].map((name) => prisma.genre.create({ data: { name } })),
  );
  const refs = { authorId: author.id, publisherId: publisher.id };
  const book = (title: string, genreId: string, price: number, stock: number, gone = false) =>
    prisma.book.create({
      data: { title, genreId, price, stock, deletedAt: gone ? new Date() : null, ...refs },
    });
  await Promise.all([
    book('A', novela.id, 1000, 2),
    book('B', novela.id, 500, 0),
    book('C', ensayo.id, 2000, 1),
    book('D', novela.id, 9999, 5, true),
  ]);
  const now = new Date();
  const closing = {
    PENDING: {},
    COMPLETED: { paymentMethod: 'CASH' as const, completedAt: now },
    CANCELLED: { cancelledAt: now },
  };
  const sale = (status: keyof typeof closing, total: number) =>
    prisma.sale.create({ data: { status, total, createdById: ana.id, ...closing[status] } });
  await Promise.all([
    sale('PENDING', 1),
    sale('PENDING', 2),
    sale('COMPLETED', 1000),
    sale('COMPLETED', 2500),
    sale('CANCELLED', 9000),
  ]);
  for (let minute = 0; minute < 12; minute += 1) {
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Book',
        userId: minute < 10 ? beto.id : null,
        metadata: { title: `Libro ${minute}` },
        createdAt: new Date(Date.UTC(2026, 2, 10, 12, minute)),
      },
    });
  }
}
