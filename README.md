# Social Media Analytics Platform

A comprehensive web application for managing, analyzing, and optimizing social media presence across multiple platforms with real-time analytics and actionable insights.

## 🚀 Project Structure

```
Social Media Analytics Web/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── IMPLEMENTATION_PHASES.md  # Detailed implementation plan
└── README.md          # This file
```

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library
- **State Management:** (To be implemented)

### Backend
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript
- **Database:** MySQL
- **Cache:** Redis
- **Authentication:** JWT

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MySQL (v8.0 or higher)
- Redis (optional, for caching)

## 🏗️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Social\ Media\ Analytics\ Web
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Then start the development server
npm run dev
```

The backend API will be available at `http://localhost:5001`

## 📁 Project Structure Details

### Frontend Structure
```
frontend/
├── app/               # Next.js app directory
│   ├── globals.css    # Global styles
│   └── page.tsx       # Home page
├── components/        # React components
│   ├── ui/           # UI component library
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── lib/              # Utilities and helpers
│   └── design-system.ts  # Design tokens
└── styles/           # Additional styles
```

### Backend Structure
```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Express middleware
│   ├── models/      # Database models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   └── server.ts     # Server entry point
└── dist/             # Compiled TypeScript
```

## 🎨 Design System

The application uses a modern design system with:
- **Primary Colors:** Blue/Purple gradient
- **Typography:** Inter (body) and Poppins (headings)
- **Components:** Custom UI component library
- **Spacing:** Consistent spacing scale
- **Shadows:** Subtle shadows for depth

See `frontend/lib/design-system.ts` for design tokens.

## 📝 Development Scripts

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Backend
```bash
npm run dev        # Start development server with nodemon
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=social_media_analytics
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## 📊 Implementation Phases

See [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) for detailed phase-by-phase implementation plan.

**Current Phase:** Phase 1 - Foundation & Project Setup ✅

## 🤝 Contributing

1. Follow the code style guidelines
2. Run linting before committing
3. Write meaningful commit messages
4. Test your changes thoroughly

## 📄 License

ISC

## 👥 Authors

- Mohomed Ashfak

---

**Status:** 🚧 In Development - Phase 1 Complete

