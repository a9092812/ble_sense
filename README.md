# Sense BLE Telemetry Dashboard

A production-grade, high-performance telemetry dashboard built with Next.js 15, TypeScript, and Zustand.

## Features

- **Cyberpunk Noir Aesthetics**: Glassmorphism, neon highlights, and dark mode by default.
- **Live Mode**: Real-time telemetry streaming via WebSocket.
- **History Mode**: Query and visualize historical data from TimescaleDB.
- **Sensor Specialization**: Custom visualizations for 8 sensor types (SHT40, Lux, Accelerometer, Soil, etc.).
- **High Performance**: Optimized for 1000+ packets/second with buffering and throttling.
- **Responsive Design**: Works on mobile gateways and desktop terminals.

## Architecture

1. **Dashboard**: Next.js + Tailwind CSS.
2. **State**: Zustand for real-time packet buffering.
3. **Backend**: Gin API + WebSocket Broadcast.
4. **Database**: TimescaleDB for history.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Supported Sensors

- **SHT40**: Temp/Humidity Monitoring
- **LuxSensor**: Ambient Light Detection
- **LIS2DH**: 3-Axis Accelerometer
- **SoilSensor**: NPK + Moisture + pH + Temp
- **SpeedDistance**: Kinetic Tracking
- **AmmoniaSensor**: Gas Concentration
- **TempLogger**: Environmental Logging
- **DataLogger**: High-frequency payload logging with loss detection
