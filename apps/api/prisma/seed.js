// Idempotent seed: safe to run on every container start.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// One demo account per role (credentials overridable through the environment).
const DEMO_USERS = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cmpc.cl',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    name: 'Administrador',
    role: 'ADMIN',
  },
  {
    email: process.env.SEED_USER_EMAIL ?? 'usuario@cmpc.cl',
    password: process.env.SEED_USER_PASSWORD ?? 'Usuario123!',
    name: 'Usuario',
    role: 'USER',
  },
];

const BOOKS = require('./seed-data/books');

const connect = (name) => ({ connectOrCreate: { where: { name }, create: { name } } });

async function seedUsers() {
  for (const { email, password, name, role } of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, passwordHash, role },
    });
  }
}

async function seedBooks() {
  if ((await prisma.book.count()) > 0) return;
  for (const [title, author, publisher, genre, price, stock] of BOOKS) {
    await prisma.book.create({
      data: {
        title,
        price,
        stock,
        isAvailable: stock > 0, // expand phase: kept in sync until is_available is dropped
        author: connect(author),
        publisher: connect(publisher),
        genre: connect(genre),
      },
    });
  }
}

seedUsers()
  .then(seedBooks)
  .then(() => console.log('Seed completed'))
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
