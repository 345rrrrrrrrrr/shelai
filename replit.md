# AI Shell Commander

## Overview

AI Shell Commander is a Gemini-powered terminal assistant that provides an intelligent interface for executing shell commands and managing files. The application combines AI-driven command analysis with traditional terminal functionality, offering a safe and user-friendly way to interact with the system.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom terminal-themed color variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini API for command analysis and code generation
- **Session Management**: In-memory storage with optional database persistence
- **API Design**: RESTful endpoints for commands, files, and system status

### Database Schema
- **Commands Table**: Stores command history with input, output, AI flags, and status
- **Files Table**: Tracks file metadata including name, path, content, and type
- **System Status Table**: Maintains AI model status, shell access, and safety settings

## Key Components

### Terminal Interface
- Real-time command execution with AI analysis
- Support for both direct shell commands and natural language requests
- Command history with status tracking and filtering
- Safety checks for dangerous operations

### File Management System
- Directory browsing with file type detection
- File content reading and editing capabilities
- Create, update, and delete operations
- Integration with code editor for syntax highlighting

### AI Command Analysis
- Google Gemini integration for command interpretation
- Safety level classification (safe, warning, dangerous)
- Natural language to shell command translation
- Code generation and suggestions

### System Status Monitoring
- Real-time AI model connectivity status
- Shell access permissions tracking
- Safety mode configuration
- Working directory monitoring

## Data Flow

1. **Command Input**: User enters command or natural language request
2. **AI Analysis**: Gemini API analyzes input for safety and intent
3. **Command Execution**: Safe commands are executed via child process
4. **Response Processing**: Output is captured and stored in database
5. **UI Updates**: Frontend receives real-time updates via polling
6. **History Management**: All interactions are logged for future reference

## External Dependencies

### AI Services
- **Google Gemini API**: Command analysis, code generation, and natural language processing
- **API Key Management**: Environment variable based configuration

### Database
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **Connection Pooling**: Managed through @neondatabase/serverless

### Development Tools
- **Replit Integration**: Development environment support and cartographer plugin
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- Express server with middleware for logging and error handling
- Environment-specific configurations for database and API keys

### Production Build
- Vite builds static frontend assets to `dist/public`
- ESBuild compiles server code to `dist/index.js`
- Single node process serves both static files and API endpoints

### Database Management
- Drizzle migrations stored in `./migrations` directory
- Schema definitions in `./shared/schema.ts`
- Push-based deployment with `db:push` command

## Environment Verification

The system has been verified to be fully connected to Replit's shell environment:
- ✅ Working directory: `/home/runner/workspace` 
- ✅ User context: `runner` (Replit's standard user)
- ✅ Shell commands execute in actual Replit environment
- ✅ File operations work with real filesystem
- ✅ AI integration functional with Google Gemini API

## Changelog

```
Changelog:
- July 08, 2025. Initial setup and Replit environment verification
- Verified shell connection to Replit's actual environment
- Enhanced command safety with expanded allowed commands list
- Added shell connection test endpoint for diagnostics
- COMPLETED: Removed all security restrictions per user request
- COMPLETED: Fixed AI command execution flow - natural language now generates and executes shell commands
- COMPLETED: Verified conversational AI capabilities working in terminal
- COMPLETED: Demonstrated data collection from external APIs with file storage
- PROJECT STATUS: Fully functional AI shell commander with unrestricted capabilities
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```