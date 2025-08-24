import axios from 'axios'
import { io } from 'socket.io-client'

const BACKEND = 'http://localhost:3001'

// Connect to websocket for real-time updates
const socket = io(BACKEND)

socket.on('connect', () => {
  console.log('🔌 Simulator connected to backend')
})

socket.on('state:update', (data) => {
  const { robot } = data
  console.log(`🤖 Robot at (${robot.x.toFixed(1)}, ${robot.y.toFixed(1)}) heading ${robot.heading}° [${robot.mode}]`)
})

// Enhanced movement functions
async function forward() {
  console.log('▲ Moving forward...')
  await axios.post(`${BACKEND}/tx`, { cmd: 'FORWARD' })
}

async function back() {
  console.log('▼ Moving backward...')
  await axios.post(`${BACKEND}/tx`, { cmd: 'BACK' })
}

async function left() {
  console.log('◀ Turning left...')
  await axios.post(`${BACKEND}/tx`, { cmd: 'LEFT' })
}

async function right() {
  console.log('▶ Turning right...')
  await axios.post(`${BACKEND}/tx`, { cmd: 'RIGHT' })
}

async function turnRight() { 
  await right() 
}

async function turnLeft() { 
  await left() 
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Test patterns
async function squarePattern() {
  console.log('🔲 Starting square pattern...')
  for (let i = 0; i < 4; i++) {
    console.log(`Side ${i + 1}/4`)
    for (let j = 0; j < 5; j++) {
      await forward()
      await sleep(300)
    }
    await turnRight()
    await sleep(500)
  }
  console.log('✅ Square pattern completed!')
}

async function zigzagPattern() {
  console.log('〰️ Starting zigzag pattern...')
  for (let i = 0; i < 3; i++) {
    // Move forward
    for (let j = 0; j < 3; j++) {
      await forward()
      await sleep(200)
    }
    
    // Turn (alternate direction)
    if (i % 2 === 0) {
      await turnRight()
      await sleep(300)
      await forward()
      await sleep(200)
      await turnRight()
    } else {
      await turnLeft()
      await sleep(300)
      await forward()
      await sleep(200)
      await turnLeft()
    }
    await sleep(300)
  }
  console.log('✅ Zigzag pattern completed!')
}

async function deliverySimulation() {
  console.log('📦 Starting delivery simulation...')
  
  // Create a test order
  const order = await axios.post(`${BACKEND}/orders`, {
    from: 'Library',
    to: 'Student Center'
  })
  console.log(`📋 Created order: ${order.data.id}`)
  
  // Simulate manual pickup
  console.log('🚚 Simulating pickup at Library...')
  await turnRight()
  await sleep(500)
  
  for (let i = 0; i < 8; i++) {
    await forward()
    await sleep(400)
  }
  
  console.log('📦 Package picked up! Heading to Student Center...')
  await turnLeft()
  await sleep(500)
  
  for (let i = 0; i < 12; i++) {
    await forward()
    await sleep(400)
  }
  
  console.log('✅ Delivery completed!')
  
  // Update order status
  await axios.post(`${BACKEND}/orders/${order.data.id}/status`, {
    status: 'completed'
  })
}

async function testAllCommands() {
  console.log('🧪 Testing all robot commands...')
  
  const commands = ['FORWARD', 'LEFT', 'FORWARD', 'RIGHT', 'BACK', 'RIGHT', 'FORWARD', 'LEFT']
  
  for (const cmd of commands) {
    console.log(`Executing: ${cmd}`)
    await axios.post(`${BACKEND}/tx`, { cmd })
    await sleep(600)
  }
  
  console.log('✅ All commands tested!')
}

// Main simulator menu
async function main() {
  console.log('\n🤖 Campus Delivery Robot Simulator')
  console.log('=====================================')
  console.log('Available test patterns:')
  console.log('1. Square pattern (simple)')
  console.log('2. Zigzag pattern (complex)')
  console.log('3. Delivery simulation (realistic)')
  console.log('4. Test all commands')
  console.log('5. Custom square (old pattern)')
  
  // For demo, run the delivery simulation
  console.log('\n🚀 Running delivery simulation...\n')
  
  try {
    await deliverySimulation()
  } catch (error) {
    console.error('❌ Simulation failed:', error.message)
  }
  
  console.log('\n✨ Simulation complete! Check the web interface at http://localhost:5173')
}

// Start with a small delay to ensure backend is ready
setTimeout(main, 1000)
