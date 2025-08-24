import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// In-memory stores
const orders = new Map(); // id -> { id, from, to, status }
let nextOrderId = 1;
let robotState = { x: 0, y: 0, heading: 0, mode: 'manual' }; // heading deg

// Socket.IO
io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit('state:init', { robot: robotState, orders: Array.from(orders.values()) });

  socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

function broadcast() {
  io.emit('state:update', { robot: robotState, orders: Array.from(orders.values()) });
}

// REST API
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/orders', (_req, res) => {
  res.json(Array.from(orders.values()));
});

app.post('/orders', (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  const order = { id: String(nextOrderId++), from, to, status: 'queued' };
  orders.set(order.id, order);
  broadcast();
  res.status(201).json(order);
});

app.post('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'not found' });
  order.status = status ?? order.status;
  broadcast();
  res.json(order);
});

// Transmitter endpoint: LEFT/RIGHT/FORWARD/BACK
app.post('/tx', (req, res) => {
  const { cmd } = req.body || {};
  const C = String(cmd || '').toUpperCase();
  const step = 1; // one unit
  const turn = 15; // deg per left/right
  if (!['LEFT','RIGHT','FORWARD','BACK'].includes(C)) {
    return res.status(400).json({ error: 'cmd must be LEFT|RIGHT|FORWARD|BACK' });
  }
  if (C === 'LEFT') robotState.heading = (robotState.heading - turn + 360) % 360;
  if (C === 'RIGHT') robotState.heading = (robotState.heading + turn) % 360;
  if (C === 'FORWARD') {
    const rad = (robotState.heading * Math.PI) / 180;
    robotState.x += Math.cos(rad) * step;
    robotState.y += Math.sin(rad) * step;
  }
  if (C === 'BACK') {
    const rad = (robotState.heading * Math.PI) / 180;
    robotState.x -= Math.cos(rad) * step;
    robotState.y -= Math.sin(rad) * step;
  }
  broadcast();
  res.json({ ok: true, robot: robotState });
});

// Mode switch
app.post('/mode', (req, res) => {
  const { mode } = req.body || {};
  if (!['manual','auto'].includes(mode)) return res.status(400).json({ error: 'mode must be manual|auto' });
  robotState.mode = mode;
  broadcast();
  res.json(robotState);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`backend listening on http://localhost:${PORT}`));
