// Idempotent seed: safe to run on every container start.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@cmpc.cl';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

const BOOKS = require('./seed-data/books');

const connect = (name) => ({ connectOrCreate: { where: { name }, create: { name } } });

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, name: 'Administrator', passwordHash, role: 'ADMIN' },
  });
}

async function seedBooks() {
  if ((await prisma.book.count()) > 0) return;
  for (const [title, author, publisher, genre, price, isAvailable] of BOOKS) {
    await prisma.book.create({
      data: {
        title,
        price,
        isAvailable,
        author: connect(author),
        publisher: connect(publisher),
        genre: connect(genre),
      },
    });
  }
}

seedAdmin()
  .then(seedBooks)
  .then(() => console.log('Seed completed'))
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
