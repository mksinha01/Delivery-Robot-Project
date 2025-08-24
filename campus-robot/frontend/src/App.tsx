import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './style.css'

// Simple blue dot icon
const robotIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiM0NjhDRkYiIC8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjQiIGZpbGw9IiNmZmYiIC8+Cjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const BACKEND = 'http://localhost:3001'

// Campus locations mapping
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
}

function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  useEffect(() => {
    const s = io(BACKEND)
    setSocket(s)
    return () => {
      s.close()
    }
  }, [])
  return socket
}

type RobotState = { x: number; y: number; heading: number; mode: 'manual' | 'auto' }

type Order = { id: string; from: string; to: string; status: string }

export default function App() {
  const socket = useSocket()
  const [robot, setRobot] = useState<RobotState>({ x: 0, y: 0, heading: 0, mode: 'manual' })
  const [orders, setOrders] = useState<Order[]>([])
  const [from, setFrom] = useState('Library')
  const [to, setTo] = useState('Student Center')

  useEffect(() => {
    if (!socket) return
    const init = (data: any) => {
      setRobot(data.robot)
      setOrders(data.orders)
    }
    const upd = (data: any) => {
      setRobot(data.robot)
      setOrders(data.orders)
    }
    socket.on('state:init', init)
    socket.on('state:update', upd)
    return () => {
      socket.off('state:init', init)
      socket.off('state:update', upd)
    }
  }, [socket])

  // Keyboard controls: arrows + WASD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') tx('LEFT')
      if (k === 'arrowright' || k === 'd') tx('RIGHT')
      if (k === 'arrowup' || k === 'w') tx('FORWARD')
      if (k === 'arrowdown' || k === 's') tx('BACK')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tx = async (cmd: 'LEFT' | 'RIGHT' | 'FORWARD' | 'BACK') => {
    await axios.post(`${BACKEND}/tx`, { cmd })
  }

  const toggleMode = async () => {
    const next = robot.mode === 'manual' ? 'auto' : 'manual'
    await axios.post(`${BACKEND}/mode`, { mode: next })
  }

  const createOrder = async () => {
    const { data } = await axios.post(`${BACKEND}/orders`, { from, to })
    console.log('created order', data)
  }

  // Map projection: arbitrary campus center
  const center = useMemo(() => ({ lat: 37.7749, lng: -122.4194 }), [])
  const robotLatLng = useMemo(() => {
    const scale = 0.0002 // degrees per unit
    return L.latLng(center.lat + robot.y * scale, center.lng + robot.x * scale)
  }, [robot, center])

  return (
    <div className="app">
      <header className="topbar">
        <h1>🤖 Campus Delivery Robot</h1>
        <div className="controls">
          <button onClick={() => tx('LEFT')}>⟲ Left</button>
          <button onClick={() => tx('FORWARD')}>↑ Forward</button>
          <button onClick={() => tx('RIGHT')}>⟳ Right</button>
          <button onClick={() => tx('BACK')}>↓ Back</button>
          <button className="mode-button" onClick={toggleMode}>
            Mode: {robot.mode.toUpperCase()}
          </button>
        </div>
      </header>

      <main className="main">
        <section className="map">
          <MapContainer center={[center.lat, center.lng]} zoom={18} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <Marker position={robotLatLng} icon={robotIcon}>
              <Popup>
                x: {robot.x.toFixed(1)}, y: {robot.y.toFixed(1)}
                <br /> heading: {robot.heading}°
              </Popup>
            </Marker>
          </MapContainer>
        </section>

        <section className="sidebar">
          <h3>🤖 Robot Status</h3>
          <div className="robot-info">
            <div className="robot-stats">
              <div>Position: ({robot.x.toFixed(1)}, {robot.y.toFixed(1)})</div>
              <div>Heading: {robot.heading}°</div>
              <div>Mode: {robot.mode.toUpperCase()}</div>
            </div>
          </div>

          <h3>📦 Create Order</h3>
          <div className="form">
            <label>
              📍 From Location
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                {Object.keys(CAMPUS_LOCATIONS).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </label>
            <label>
              🎯 To Location
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                {Object.keys(CAMPUS_LOCATIONS).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </label>
            <button onClick={createOrder}>📋 Add Order</button>
          </div>

          <h3>📋 Orders</h3>
          <ul className="orders">
            {orders.map((o) => (
              <li key={o.id}>
                <strong>#{o.id}</strong> {o.from} → {o.to}
                <br/>
                <span className={`order-status ${o.status.replace(/[^a-z]/g, '-')}`}>
                  {o.status.toUpperCase()}
                </span>
              </li>
            ))}
            {orders.length === 0 && (
              <li style={{ color: '#666', fontStyle: 'italic' }}>
                No orders yet. Create your first delivery order above!
              </li>
            )}
          </ul>
        </section>
      </main>

      <footer className="footer">
        🎮 Use arrow keys or WASD to control robot manually | 🗺️ Select locations to create delivery orders
      </footer>
    </div>
  )
}
