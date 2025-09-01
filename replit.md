# Overview

This is a virtual try-on web application that allows users to upload photos of themselves and see how Zara clothing items would look on them. The app features a modern React frontend with an Express backend, using AI-powered virtual try-on technology to generate realistic clothing overlays on user photos.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing with pages for home, try-on workflow, and results viewing
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **File Upload**: React Dropzone for drag-and-drop file upload functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js server providing REST API endpoints
- **Language**: TypeScript with ESM modules for modern JavaScript features
- **Database**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Handling**: Multer middleware for multipart file uploads with local filesystem storage
- **Session Management**: In-memory storage with pluggable interface for future database integration

## Data Layer
- **Database Schema**: Three main entities - products (clothing items), upload sessions (user photos), and try-on jobs (processing requests)
- **Storage Strategy**: Local file system for development with abstracted storage interface ready for S3-compatible cloud storage
- **Data Validation**: Zod schemas for runtime type checking and validation across the application

## Virtual Try-On Processing
- **Job Queue**: Asynchronous job processing system for handling virtual try-on requests
- **Status Tracking**: Real-time job status updates (queued, processing, succeeded, failed) with polling mechanism
- **Result Storage**: Generated try-on images stored with URLs for client access

## Security and Validation
- **File Type Validation**: Server-side MIME type checking and file size limits (10MB for images)
- **Input Sanitization**: Zod validation schemas prevent malformed data from reaching the database
- **CORS Configuration**: Proper cross-origin resource sharing setup for API access

## Development Workflow
- **Build System**: Vite for frontend bundling with hot module replacement in development
- **Type Safety**: Shared TypeScript types between frontend and backend ensuring consistency
- **Path Aliases**: Clean import paths using TypeScript path mapping for better code organization