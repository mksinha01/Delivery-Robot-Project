# Campus Delivery Robot (Local)

Run everything on your Windows PC. The web app lets people create orders on a campus map. The robot is controlled by simple transmitter commands: LEFT, RIGHT, FORWARD, BACK. A basic simulator is included for testing.

## Components
- Backend (Node.js + Express + Socket.IO)
- Frontend (Vite + React + TypeScript + Leaflet map)
- Simulator (Node script that receives direction commands and moves a dot)

## Quick start
1. Install Node.js 18+.
2. Open a PowerShell in the repo folder.
3. Install deps and run dev servers:
   - Backend: `cd backend; npm install; npm run dev`
   - Frontend: `cd ../frontend; npm install; npm run dev`
   - Simulator (optional): `cd ../simulator; npm install; npm run start`

Open http://localhost:5173 in your browser.

## Notes
- Orders are stored in memory for simplicity.
- Map data is a simple GeoJSON stub for campus.
- Replace the simulator with your real transmitter later. The backend exposes a `/tx` endpoint and a Socket.IO channel to send LEFT/RIGHT/FORWARD/BACK to the robot.
