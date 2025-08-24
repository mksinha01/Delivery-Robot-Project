# 🤖 Campus Delivery Robot System

A complete delivery robot control system with web interface, pathfinding, and real-time tracking. Perfect for campus delivery automation!

## ✨ Features

- 🎮 **Manual Control**: Use WASD or arrow keys to control the robot
- 🗺️ **Campus Mapping**: Pre-defined campus locations with coordinates
- 📦 **Order Management**: Create and track delivery orders
- 🚀 **Pathfinding**: Automatic route calculation between locations
- ⚡ **Real-time Updates**: Live robot position and status via WebSocket
- 🎯 **Robot Commands**: Transmits LEFT, RIGHT, FORWARD, BACK commands
- 📱 **Cool UI**: Modern, responsive interface with gradients and animations

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Robot/Sim     │
│  (React+Vite)   │◄──►│ (Node.js+WS)    │◄──►│  (Commands)     │
│  localhost:5173 │    │ localhost:3001  │    │  Hardware/Test  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```powershell
.\setup.ps1
```

### Option 2: Manual Setup
1. **Install Node.js 18+** from [nodejs.org](https://nodejs.org)

2. **Start Backend** (Terminal 1):
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend** (Terminal 2):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. **Test with Simulator** (Terminal 3):
   ```powershell
   cd simulator
   npm install
   npm run start
   ```

5. **Open the Web App**: http://localhost:5173

## 🎮 How to Use

### Manual Control
- Use **WASD** or **Arrow Keys** to drive the robot
- Click control buttons in the interface
- Switch between Manual/Auto modes

### Creating Delivery Orders
1. Select **pickup location** from dropdown
2. Select **delivery location** from dropdown  
3. Click **"📋 Create Order"**
4. Watch the order appear in the orders list

### Campus Locations
The system includes 10 pre-mapped campus locations:
- 📚 Library
- 🏫 Student Center  
- 🔬 Engineering Building
- 🍽️ Dining Hall
- 🏠 Dormitory A & B
- 🏃 Sports Complex
- 🏢 Admin Building
- 🧪 Lab Building
- 🚗 Parking Lot

## 🛠️ Technical Details

### Robot Commands
The system transmits these commands to control the robot:
- `LEFT` - Turn left 15 degrees
- `RIGHT` - Turn right 15 degrees  
- `FORWARD` - Move forward 1 unit
- `BACK` - Move backward 1 unit

### API Endpoints
- `POST /tx` - Send robot command
- `GET /orders` - List all orders
- `POST /orders` - Create new order
- `GET /robot` - Get robot status
- `POST /robot/reset` - Reset robot position

### Real-time Communication
- **WebSocket** connection for live updates
- **Socket.IO** for reliable messaging
- Broadcasts robot position and order status

## 🎯 Connecting Real Hardware

Replace the simulator with your actual robot transmitter:

1. **Connect your robot transmitter** to the same network
2. **Configure robot endpoint** to call `POST http://localhost:3001/tx`
3. **Send commands** in JSON format: `{"cmd": "FORWARD"}`
4. **Receive commands** and translate to your robot's protocol

Example integration:
```javascript
// Your robot controller
async function sendToRobot(command) {
    // Translate to your robot's protocol
    switch(command) {
        case 'FORWARD': await robotHardware.moveForward(); break;
        case 'LEFT': await robotHardware.turnLeft(); break;
        // ... etc
    }
}
```

## 📁 Project Structure

```
campus-robot/
├── 📱 frontend/          # React web interface
│   ├── src/App.tsx       # Main application
│   ├── src/style.css     # Styling
│   └── package.json      # Dependencies
├── 🖥️ backend/           # Node.js API server
│   ├── src/server.js     # Express + Socket.IO
│   └── package.json      # Dependencies  
├── 🤖 simulator/         # Test robot simulator
│   ├── src/sim.js        # Movement patterns
│   └── package.json      # Dependencies
├── 📋 README.md          # This file
└── ⚙️ setup.ps1          # Automated setup script
```

## 🌟 Next Steps

- **Add path optimization** algorithms
- **Implement obstacle avoidance**  
- **Add delivery confirmation**
- **Create admin dashboard**
- **Add GPS integration**
- **Build mobile app**

## 🔧 Troubleshooting

**Port conflicts**: Change ports in the source files if needed
**Connection issues**: Ensure all services are running
**Browser errors**: Clear cache and reload

---

Built with ❤️ for campus delivery automation. Ready to revolutionize your campus logistics! 🚚✨
