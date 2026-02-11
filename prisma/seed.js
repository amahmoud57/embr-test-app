const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create todos
  const todos = await Promise.all([
    prisma.todo.create({ data: { title: 'Set up Embr project', completed: true } }),
    prisma.todo.create({ data: { title: 'Configure Prisma with PostgreSQL', completed: true } }),
    prisma.todo.create({ data: { title: 'Test database provisioning', completed: false } }),
    prisma.todo.create({ data: { title: 'Deploy to production', completed: false } }),
    prisma.todo.create({ data: { title: 'Verify schema sync works', completed: false } }),
  ]);

  console.log(`Created ${todos.length} todos`);

  // Create users with posts
  const alice = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
      posts: {
        create: [
          { title: 'Getting started with Embr', content: 'Embr makes deployment easy!', published: true },
          { title: 'Prisma + PostgreSQL', content: 'Schema management is automatic.', published: true },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@example.com',
      posts: {
        create: [
          { title: 'Database seeding', content: 'Seeds run on first deployment.', published: false },
        ],
      },
    },
  });

  console.log(`Created users: ${alice.name}, ${bob.name}`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
