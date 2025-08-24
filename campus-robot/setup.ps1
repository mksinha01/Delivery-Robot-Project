#!/usr/bin/env powershell

# Campus Delivery Robot - Windows Setup Script
Write-Host "🤖 Setting up Campus Delivery Robot System..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend setup failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Frontend setup  
Write-Host "Setting up frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend setup failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Simulator setup
Write-Host "Setting up simulator..." -ForegroundColor Cyan
Set-Location simulator
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Simulator setup failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n🚀 To start the system:" -ForegroundColor Yellow
Write-Host "1. Start backend:   cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start frontend:  cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Run simulator:   cd simulator && npm run start" -ForegroundColor White
Write-Host "`n🌐 Open http://localhost:5173 in your browser" -ForegroundColor Cyan
Write-Host "`n📋 Features:" -ForegroundColor Yellow
Write-Host "• Manual robot control (WASD/Arrow keys)" -ForegroundColor White
Write-Host "• Campus location mapping" -ForegroundColor White
Write-Host "• Delivery order management" -ForegroundColor White
Write-Host "• Real-time robot tracking" -ForegroundColor White
Write-Host "• Pathfinding visualization" -ForegroundColor White
