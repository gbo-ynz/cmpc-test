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
const AUTHORS = require('./seed-data/authors');
const PUBLISHERS = require('./seed-data/publishers');
const GENRES = require('./seed-data/genres');

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
        author: connect(author),
        publisher: connect(publisher),
        genre: connect(genre),
      },
    });
  }
  await seedAuthorDetails();
  await seedPublisherCountries();
  await seedGenreDescriptions();
}

// Only runs with the books (new databases): it never overwrites details edited by an admin.
async function seedAuthorDetails() {
  for (const [name, birthDate, biography] of AUTHORS) {
    await prisma.author.updateMany({
      where: { name },
      data: { birthDate: birthDate ? new Date(`${birthDate}T00:00:00Z`) : null, biography },
    });
  }
}

// Same rule as the author details: only on new databases, never over an admin's edits.
async function seedPublisherCountries() {
  for (const [name, country] of PUBLISHERS) {
    await prisma.publisher.updateMany({ where: { name }, data: { country } });
  }
}

// Same rule as the other details: only on new databases, never over an admin's edits.
async function seedGenreDescriptions() {
  for (const [name, description] of GENRES) {
    await prisma.genre.updateMany({ where: { name }, data: { description } });
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
