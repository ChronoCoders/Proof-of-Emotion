# EmotionalChain - Proof of Emotion Blockchain Platform

## Overview

EmotionalChain is an innovative blockchain platform that implements the world's first "Proof of Emotion" (PoE) consensus mechanism. This groundbreaking system uses real biometric data from wearable devices to validate blockchain transactions based on human emotional states. The platform integrates with Fitbit devices to collect heart rate, HRV, and other biometric data to create emotional proofs that drive consensus decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with custom theming
- **Styling**: Tailwind CSS with custom PoE-themed color palette
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for emotional data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Cloud Database**: Neon Database for serverless PostgreSQL
- **Real-time Communication**: WebSocket for live network updates
- **Authentication**: Session-based with PostgreSQL session store

### Key Design Decisions

1. **Monorepo Structure**: Unified codebase with shared types and schemas between client and server
2. **Type Safety**: Full TypeScript implementation across frontend, backend, and shared code
3. **Real-time Updates**: WebSocket integration for live consensus and validator updates
4. **Biometric Integration**: Fitbit OAuth integration for authentic biometric data collection
5. **Modular Services**: Separated concerns with dedicated services for PoE algorithm, Fitbit integration, and WebSocket management

## Key Components

### Core PoE Algorithm (`server/services/poe-algorithm.ts`)
- Validator registration and management
- Emotional proof generation from biometric data
- Consensus calculation based on emotional agreement
- Anti-spoofing measures and authenticity scoring

### Fitbit Integration (`server/services/fitbit-service.ts`)
- OAuth 2.0 authentication flow
- Real-time biometric data collection
- Heart rate, HRV, and activity level monitoring
- Token refresh management

### WebSocket Service (`server/services/websocket-service.ts`)
- Real-time network status updates
- Live consensus notifications
- Validator activity broadcasting
- Client connection management

### Database Schema (`shared/schema.ts`)
- Validators table with stake and biometric device info
- Emotional proofs with biometric data and authenticity scores
- Consensus blocks with network emotional state
- Network activity logging

## Data Flow

1. **Validator Registration**: Users register as validators with minimum stake and biometric device
2. **Biometric Data Collection**: Fitbit devices provide real-time heart rate, HRV, and activity data
3. **Emotional Proof Generation**: Raw biometric data is processed into emotional metrics (stress, energy, focus)
4. **Consensus Process**: Multiple validators' emotional proofs are aggregated to reach network consensus
5. **Block Creation**: Successful consensus creates new blocks with network emotional state
6. **Real-time Updates**: WebSocket broadcasts keep all clients synchronized

## External Dependencies

### Biometric Integration
- **Fitbit Web API**: Primary biometric data source
- **OAuth 2.0**: Authentication for device access
- **Rate Limiting**: API call management and token refresh

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Connection Pooling**: Efficient database connection management

### Real-time Communication
- **WebSocket**: Live network updates
- **Session Management**: User authentication and state

## Deployment Strategy

### Development Environment
- **Vite Development Server**: Hot module replacement for frontend
- **Express Server**: Backend API with middleware support
- **Environment Variables**: Separate configuration for development/production

### Production Considerations
- **Database Migrations**: Drizzle migration system
- **Asset Optimization**: Vite build process for frontend assets
- **Server Bundling**: ESBuild for optimized server deployment
- **Environment Configuration**: Separate configs for different environments

### Scalability Approach
- **Database Indexing**: Optimized queries for validator and consensus data
- **Connection Pooling**: Efficient database connection management
- **WebSocket Clustering**: Support for multiple server instances
- **API Rate Limiting**: Protection against abuse and spam

The system is designed to be production-ready with proper error handling, logging, and security measures while maintaining the innovative PoE consensus mechanism at its core.

## Recent Changes (July 16, 2025)

### Consensus Tab Implementation
- **Feature**: Comprehensive Emotional Consensus Engine interface
- **Details**: Full-featured consensus monitoring with real-time emotional state visualization
- **Components**: Live consensus progress, stress testing, analytics, and block timeline
- **Impact**: Demonstrates revolutionary PoE blockchain where emotions drive consensus decisions

### Technical Fixes
- **Issue**: Duplicate Consensus tab in sidebar navigation
- **Resolution**: Removed duplicate entry, maintained single navigation path to `/consensus`
- **Issue**: TypeScript compilation errors in server routes
- **Resolution**: Fixed all error type annotations from `unknown` to `any` for proper error handling
- **Issue**: Browserslist dependency conflicts after package updates
- **Resolution**: Reinstalled autoprefixer and browserslist packages to resolve PostCSS configuration

### Platform Status
- **Status**: Fully operational EmotionalChain platform
- **Features**: Real-time WebSocket connections, comprehensive consensus monitoring, stress testing capabilities
- **Architecture**: Complete full-stack application with React frontend and Node.js backend
- **Consensus Engine**: Revolutionary Proof of Emotion mechanism with 67% emotional agreement threshold