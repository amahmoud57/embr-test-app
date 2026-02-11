const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// --- Todo CRUD ---
app.get('/api/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const todo = await prisma.todo.create({ data: { title } });
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    const todo = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: { ...(title !== undefined && { title }), ...(completed !== undefined && { completed }) },
    });
    res.json(todo);
  } catch {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    await prisma.todo.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// --- User + Post endpoints ---
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany({ include: { posts: true } });
  res.json(users);
});

app.get('/api/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(posts);
});

// --- DB info endpoint (for testing) ---
app.get('/api/db/info', async (req, res) => {
  try {
    const todoCount = await prisma.todo.count();
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    res.json({
      tables: { todos: todoCount, users: userCount, posts: postCount },
      databaseUrl: process.env.DATABASE_URL ? '(set)' : '(not set)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Embr Test App running on http://0.0.0.0:${PORT}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '(configured)' : '(not set)'}`);
});
