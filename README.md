# Smart Home UIA

A comprehensive smart home automation system with real-time device control, AI-powered security, and intelligent automation. Built with modern technologies for scalability and reliability.

![Python](https://img.shields.io/badge/Python-3.12+-3776ab?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009485?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

## Overview

Smart Home UIA is a full-featured IoT automation platform designed to manage and control smart devices in your home. It provides real-time monitoring, intelligent automation rules, AI-powered security features, and a modern user interface for complete home automation control.

The system integrates multiple components including a scalable REST API backend, responsive web frontend, MQTT-based IoT communication, and edge computing for local inference and privacy.

## Key Features

- **Device Management**: Control multiple device types including lights, fans, sensors, cameras, and servos
- **Real-time Monitoring**: Live sensor data streaming for temperature, humidity, motion, and light detection
- **Intelligent Automation**: Schedule-based automation rules with configurable triggers and actions
- **Face Recognition Security**: AI-powered face detection and recognition for security monitoring
- **Alert System**: Threshold-based alerts with customizable notification rules
- **WebSocket Real-time Updates**: Live data synchronization across all connected clients
- **Responsive UI**: Modern web interface with Neo-Brutalism design style
- **User Authentication**: Secure JWT-based authentication with Supabase
- **Multi-Device Support**: Manage multiple devices from a single centralized dashboard

## Architecture

The system follows a modular, microservices-oriented architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite)                       │
│         Modern Web UI - 8 Pages/Routes                  │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/Axios + WebSocket
┌─────────────────▼───────────────────────────────────────┐
│         FastAPI Backend (Port 8000)                      │
│     • 9 REST API Routers                                │
│     • Service Layer with DI Container                   │
│     • Repository Pattern (Supabase)                     │
│     • APScheduler for Automation                        │
└─────────────────┬───────────────────────────────────────┘
                  │ MQTT Protocol
┌─────────────────▼───────────────────────────────────────┐
│      MQTT Broker - Mosquitto (Ports 1883/9001)         │
│    Bridge between Backend & IoT Devices                │
└──┬──────────────────────────────────┬───────────────────┘
   │                                   │
   ▼                                   ▼
IoT Devices/Firmware            Edge ML Processing
Smart Sensors & Actuators       Face Detection Service
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local development)
- Node.js 18+ (for frontend development)
- Git

### Using Docker Compose (Recommended)

Clone the repository and start all services:

```bash
git clone https://github.com/Trung4n/smart-home-uia.git
cd smart-home-uia
```

Create required environment files:

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

Start all services:

```bash
docker-compose up -d
```

Access the application:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- MQTT Broker: localhost:1883 (TCP) / localhost:9001 (WebSocket)

### Local Development Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run development server
python run.py

# Server will be available at http://localhost:8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Application will be available at http://localhost:5173
```

#### MQTT Broker

Start the MQTT broker (required for communication):

```bash
cd mqtt-broker
docker-compose up -d
```

Or use the provided broker configuration in `mqtt-broker/config/mosquitto.conf`

## Project Structure

```
smart-home-uia/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                  # Application entry point
│   │   ├── api/                     # REST API routes
│   │   │   ├── router.py            # Route aggregator
│   │   │   └── endpoints/           # Endpoint handlers
│   │   ├── services/                # Business logic
│   │   │   ├── device_service.py
│   │   │   ├── sensor_service.py
│   │   │   ├── automation_engine.py
│   │   │   ├── face_recognition_queue.py
│   │   │   └── ...
│   │   ├── repositories/            # Data access layer
│   │   ├── schemas/                 # Pydantic models
│   │   ├── core/                    # Core utilities
│   │   │   ├── config.py            # Configuration
│   │   │   ├── container.py         # DI container
│   │   │   ├── exceptions.py        # Custom exceptions
│   │   │   └── security.py          # Auth logic
│   │   ├── mqtt/                    # MQTT client
│   │   └── websocket/               # WebSocket managers
│   ├── requirements.txt              # Python dependencies
│   ├── dockerfile                    # Container configuration
│   └── run.py                        # Server startup script
│
├── frontend/                         # React + TypeScript Frontend
│   ├── src/
│   │   ├── main.tsx                 # Application entry
│   │   ├── App.tsx                  # Root component
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Devices.tsx
│   │   │   ├── Environment.tsx
│   │   │   ├── Security.tsx
│   │   │   └── ...
│   │   ├── components/              # Reusable components
│   │   ├── services/                # API clients
│   │   ├── store/                   # State management
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   └── types/                   # TypeScript types
│   ├── public/                       # Static assets
│   ├── package.json                 # Dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── dockerfile                   # Container configuration
│   └── nginx.conf                   # Production web server config
│
├── mqtt-broker/                     # Mosquitto MQTT Broker
│   ├── config/
│   │   ├── mosquitto.conf           # Broker configuration
│   │   └── passwd                   # User credentials
│   ├── data/                         # Persistent message storage
│   ├── log/                          # Broker logs
│   └── docker-compose.yml
│
├── firmware/                         # IoT Device Simulator
│   ├── run.py                        # Mock device launcher
│   ├── requirements.txt
│   ├── config.py                     # Device configuration
│   └── mock/                         # Mock device implementations
│       └── sensors/                  # Sensor simulators
│
├── docs/                             # Documentation
│   ├── database/                     # Database schema docs
│   ├── ui/                           # UI design documentation
│   └── usecases/                     # Use case specifications
│
├── docker-compose.yml               # Multi-service orchestration
├── commitlint.config.js             # Commit message rules
├── package.json                      # Root workspace config
└── LICENSE                           # MIT License
```

## Technology Stack

### Backend

| Component            | Technology            | Version |
| -------------------- | --------------------- | ------- |
| Framework            | FastAPI               | 0.135.1 |
| Server               | Uvicorn               | -       |
| Database             | Supabase (PostgreSQL) | -       |
| IoT Messaging        | Paho MQTT             | 2.1.0   |
| Task Scheduling      | APScheduler           | 3.11.2  |
| Dependency Injection | dependency-injector   | 4.49.0  |
| ML Framework         | TensorFlow/Keras      | -       |
| Face Detection       | MediaPipe             | -       |
| Validation           | Pydantic              | -       |

### Frontend

| Component            | Technology       | Version |
| -------------------- | ---------------- | ------- |
| Framework            | React            | 19.2.4  |
| Language             | TypeScript       | 5.9.3   |
| Build Tool           | Vite             | 8.0.0   |
| Router               | React Router DOM | 7.13.1  |
| HTTP Client          | Axios            | 1.14.0  |
| Backend-as-a-Service | Supabase         | 2.99.2  |
| Linter               | ESLint           | 9.39.4  |

## API Endpoints

### Devices

- `GET /api/devices` - List all devices
- `POST /api/devices` - Create new device
- `GET /api/devices/{id}` - Get device details
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device

### Sensors

- `GET /api/sensors` - List sensor configurations
- `GET /api/sensor-logs` - Query historical sensor data
- `POST /api/sensor-logs` - Record new sensor reading

### Device Control

- `POST /api/device-controls` - Send control command
- `GET /api/device-controls/{id}` - Get control history

### Automation

- `GET /api/automation-rules` - List automation rules
- `POST /api/automation-rules` - Create automation rule
- `PUT /api/automation-rules/{id}` - Update rule
- `DELETE /api/automation-rules/{id}` - Delete rule

### Alerts

- `GET /api/alert-thresholds` - List alert thresholds
- `POST /api/alert-thresholds` - Create alert threshold
- `PUT /api/alert-thresholds/{id}` - Update threshold

### Notifications

- `GET /api/notifications` - Get system notifications

### Face Recognition

- `POST /api/faces` - Upload face for recognition
- `POST /api/faces/recognize` - Recognize face in image

### Real-time

- `WebSocket /api/ws/system` - System events and updates
- `WebSocket /api/ws/camera` - Camera stream and face detection

## Configuration

### Backend Environment Variables

```env
# Application Settings
APP_NAME=SmartHomeUIA
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
DEBUG=true

# Authentication
SKIP_AUTH_FOR_TESTING=false

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_JWT_SECRET=your_jwt_secret

# MQTT Configuration
MQTT_BROKER=mosquitto
MQTT_PORT=1883
MQTT_USER=username
MQTT_PASSWORD=password

# AI/ML Models
EDGE_MODEL_PATH=/models/face_detector.tflite
EDGE_MODEL_URL=https://example.com/face_detector.tflite
AI_MODEL_PATH=/models/
AI_STORAGE_PATH=/data/

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
VITE_API_BASE_URL=http://localhost:8000/api
```

## Features in Detail

### Device Management

The system supports multiple device types with specific capabilities:

- **Lights**: Turn on/off, change color
- **Fans**: Turn on/off, adjust speed
- **Sensors**: Monitor temperature, humidity, motion, light intensity
- **Cameras**: Live streaming with face detection
- **Servos**: Precise angle control

Each device operates in either Manual or Auto mode for flexible control.

### Automation Engine

Create sophisticated automation rules with:

- Schedule-based triggers (cron expressions)
- Condition-based execution
- Multiple actions per rule
- Notification on rule execution

Example: Turn on lights and set temperature at sunset daily, or activate alarm when motion detected between 10 PM and 6 AM.

### Face Recognition System

Privacy-focused face recognition using:

- MediaPipe for lightweight edge detection
- Local embedding generation
- Real-time camera monitoring
- Alert system for unknown persons

### Sensor Data Analytics

Historical data logging for trend analysis:

- Temperature and humidity tracking
- Motion detection history
- Energy consumption insights
- Custom time-range queries

### Alert System

Intelligent alerting based on thresholds:

- Temperature out of range
- Unusual motion detection patterns
- Face recognition alerts
- Device malfunction notifications

## Database Schema

The system uses PostgreSQL via Supabase with the following core tables:

- `devices` - Smart device configurations and status
- `sensors` - Sensor metadata and properties
- `sensor_logs` - Historical sensor readings
- `alert_thresholds` - Alert condition definitions
- `device_controls` - Control command history
- `notifications` - System notifications and alerts
- `automation_rules` - Automation schedules and actions
- `face_embeddings` - Face recognition training data

## Development Guide

### Adding a New API Endpoint

1. Create a router in `backend/app/api/endpoints/`
2. Define Pydantic schemas in `backend/app/schemas/`
3. Implement business logic in `backend/app/services/`
4. Register data access in `backend/app/repositories/`
5. Wire dependencies in `backend/app/core/container.py`

### Adding a New Device Type

1. Define the device type in `backend/app/core/enums.py`
2. Create service logic in `backend/app/services/device_service.py`
3. Add MQTT handlers in `backend/app/mqtt/client.py`
4. Create UI component in `frontend/src/components/`

### Frontend Component Structure

Components follow a modular pattern with:

- Functional components with hooks
- Custom hooks for API calls
- Local state management with useState
- Context API for global state when needed

## Production Deployment

### Using Docker Compose

```bash
# Build all services
docker-compose build

# Start services in production mode
docker-compose up -d

# View logs
docker-compose logs -f be
docker-compose logs -f fe
```

### Manual Deployment

1. Deploy backend to cloud service (AWS, Azure, GCP)
2. Deploy frontend to CDN or static hosting
3. Configure Supabase database
4. Set up MQTT broker on a dedicated instance
5. Configure DNS and SSL certificates

## Contributing

We welcome contributions! The project uses conventional commit messages:

```bash
git checkout -b feature/your-feature-name
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

Commit Types:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Nguyen Trung An

## Support

For issues, questions, or suggestions, please open an issue on [GitHub Issues](https://github.com/Trung4n/smart-home-uia/issues).

## Roadmap

Future enhancements planned for the system:

- Advanced machine learning for predictive automation
- Voice control integration (Google Home, Alexa)
- Mobile app for iOS and Android
- Enhanced energy consumption analytics
- Multi-site management for multiple properties
- Advanced user role and permission system
- Historical data export and reporting
- Cloud backup and disaster recovery

## Acknowledgments

Built with modern web technologies and best practices for IoT automation. Thanks to the community projects that made this possible.
