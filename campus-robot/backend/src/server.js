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
const orders = new Map(); // id -> { id, from, to, status, path }
let nextOrderId = 1;
let robotState = { x: 0, y: 0, heading: 0, mode: 'manual', status: 'ready' }; // heading deg

// Campus map - coordinates for pathfinding
const CAMPUS_LOCATIONS = {
  'Library': { x: 10, y: 15 },
  'Student Center': { x: -5, y: 20 },
  'Engineering Building': { x: 20, y: 10 },
  'Dining Hall': { x: -10, y: 5 },
  'Dormitory A': { x: 15, y: -10 },
  'Dormitory B': { x: -15, y: -5 },
  'Sports Complex': { x: 25, y: -15 },
  'Admin Building': { x: 0, y: 30 },
  'Lab Building': { x: -20, y: 15 },
  'Parking Lot': { x: 30, y: 0 },
  'CSVTU UTD 1 Building': { x: 35, y: 20 }
};

// Enhanced pathfinding algorithm
function calculateOptimalPath(fromLoc, toLoc) {
  const from = CAMPUS_LOCATIONS[fromLoc];
  const to = CAMPUS_LOCATIONS[toLoc];
  
  if (!from || !to) return [];
  
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const path = [];
  
  // Calculate required movements and turns
  if (dx !== 0) {
    const direction = dx > 0 ? 'EAST' : 'WEST';
    const turns = dx > 0 ? 'RIGHT' : 'LEFT';
    path.push({ cmd: turns, description: `Turn ${direction.toLowerCase()}`, duration: 500 });
    
    for (let i = 0; i < Math.abs(dx); i++) {
      path.push({ 
        cmd: 'FORWARD', 
        description: `Move ${direction.toLowerCase()} (${i + 1}/${Math.abs(dx)})`,
        duration: 800
      });
    }
  }
  
  if (dy !== 0) {
    const direction = dy > 0 ? 'NORTH' : 'SOUTH';
    const turns = dy > 0 ? 'RIGHT' : 'LEFT';
    path.push({ cmd: turns, description: `Turn ${direction.toLowerCase()}`, duration: 500 });
    
    for (let i = 0; i < Math.abs(dy); i++) {
      path.push({ 
        cmd: 'FORWARD', 
        description: `Move ${direction.toLowerCase()} (${i + 1}/${Math.abs(dy)})`,
        duration: 800
      });
    }
  }
  
  return path;
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.emit('state:init', { 
    robot: robotState, 
    orders: Array.from(orders.values()),
    locations: CAMPUS_LOCATIONS 
  });

  socket.on('robot:manual-control', async (data) => {
    const { cmd } = data;
    await executeCommand(cmd);
  });

  socket.on('robot:execute-path', async (data) => {
    const { orderId } = data;
    const order = orders.get(orderId);
    if (order && order.path) {
      await executePathSequence(order.path, orderId);
    }
  });

  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

function broadcast() {
  io.emit('state:update', { 
    robot: robotState, 
    orders: Array.from(orders.values()),
    locations: CAMPUS_LOCATIONS 
  });
}

// Execute a single robot command
async function executeCommand(cmd) {
  const C = String(cmd || '').toUpperCase();
  const step = 1; // one unit
  const turn = 15; // deg per left/right
  
  if (!['LEFT','RIGHT','FORWARD','BACK'].includes(C)) {
    throw new Error('cmd must be LEFT|RIGHT|FORWARD|BACK');
  }
  
  // Update robot status
  robotState.status = 'moving';
  broadcast();
  
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
  
  // Simulate command execution time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  robotState.status = 'ready';
  broadcast();
}

// Execute a complete path sequence
async function executePathSequence(path, orderId) {
  const order = orders.get(orderId);
  if (!order) return;
  
  order.status = 'in-progress';
  robotState.mode = 'auto';
  robotState.status = 'executing-path';
  broadcast();
  
  try {
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      await executeCommand(step.cmd);
      await new Promise(resolve => setTimeout(resolve, step.duration || 500));
    }
    
    order.status = 'completed';
    robotState.status = 'ready';
    console.log(`✅ Order ${orderId} completed successfully`);
    
  } catch (error) {
    order.status = 'failed';
    robotState.status = 'error';
    console.error(`❌ Order ${orderId} failed:`, error.message);
  }
  
  robotState.mode = 'manual';
  broadcast();
}

// REST API
app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.get('/locations', (_req, res) => {
  res.json(CAMPUS_LOCATIONS);
});

app.get('/orders', (_req, res) => {
  res.json(Array.from(orders.values()));
});

app.post('/orders', (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  
  // Calculate path for this order
  const path = calculateOptimalPath(from, to);
  const distance = path.filter(step => step.cmd === 'FORWARD').length;
  const estimatedTime = path.reduce((sum, step) => sum + (step.duration || 500), 0);
  
  const order = { 
    id: String(nextOrderId++), 
    from, 
    to, 
    status: 'queued',
    path,
    distance,
    estimatedTime,
    createdAt: new Date().toISOString()
  };
  
  orders.set(order.id, order);
  broadcast();
  
  console.log(`📦 New order created: ${order.id} (${from} → ${to})`);
  res.status(201).json(order);
});

app.post('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.status = status ?? order.status;
  broadcast();
  res.json(order);
});

app.post('/orders/:id/execute', async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  if (order.status !== 'queued') {
    return res.status(400).json({ error: 'Order is not in queued status' });
  }
  
  // Start path execution asynchronously
  executePathSequence(order.path, order.id);
  
  res.json({ message: 'Path execution started', order });
});

// Transmitter endpoint: LEFT/RIGHT/FORWARD/BACK
app.post('/tx', async (req, res) => {
  const { cmd } = req.body || {};
  
  try {
    await executeCommand(cmd);
    res.json({ ok: true, robot: robotState, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mode switch
app.post('/mode', (req, res) => {
  const { mode } = req.body || {};
  if (!['manual','auto'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be manual|auto' });
  }
  
  robotState.mode = mode;
  broadcast();
  res.json(robotState);
});

// Robot status endpoint
app.get('/robot', (_req, res) => {
  res.json(robotState);
});

// Reset robot position
app.post('/robot/reset', (req, res) => {
  const { x = 0, y = 0, heading = 0 } = req.body || {};
  robotState.x = x;
  robotState.y = y;
  robotState.heading = heading;
  robotState.status = 'ready';
  broadcast();
  res.json(robotState);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Campus Delivery Robot Backend running on http://localhost:${PORT}`);
  console.log(`📍 ${Object.keys(CAMPUS_LOCATIONS).length} campus locations mapped`);
  console.log(`🤖 Robot ready for commands at (${robotState.x}, ${robotState.y})`);
});
