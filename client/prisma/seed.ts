import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    username: 'admin',
    email: 'admin@admin.com',
  },
];

const tradings = [
  {
    title: 'Trading 1',
    content: 'First trading from DB.',
    status: 'DONE' as const,
    deadline: new Date().toISOString().split('T')[0],
    buy: 499,
  },
  {
    title: 'Trading 2',
    content: 'Second trading from DB.',
    status: 'OPEN' as const,
    deadline: new Date().toISOString().split('T')[0],
    buy: 399,
  },
  {
    title: 'Trading 3',
    content: 'Third trading from DB.',
    status: 'IN_PROGRESS' as const,
    deadline: new Date().toISOString().split('T')[0],
    buy: 599,
  },
];

const comments = [
  { content: 'First comment from DB.' },
  { content: 'Second comment from DB.' },
  { content: 'Third comment from DB.' },
];

const seed = async () => {
  const t0 = performance.now();
  console.log('DB Seed: Started ...');

  await prisma.comment.deleteMany();
  await prisma.trading.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash('dongkimha');

  const dbUsers = await prisma.user.createManyAndReturn({
    data: users.map((user) => ({
      ...user,
      passwordHash,
    })),
  });

  const dbTradings = await prisma.trading.createManyAndReturn({
    data: tradings.map((trading) => ({
      ...trading,
      userId: dbUsers[0].id,
    })),
  });

  await prisma.comment.createMany({
    data: comments.map((comment) => ({
      ...comment,
      tradingId: dbTradings[0].id,
    })),
  });

  const t1 = performance.now();
  console.log(`DB Seed: Finished (${t1 - t0}ms)`);
};

seed();
