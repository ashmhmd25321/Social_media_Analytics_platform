# Backend API - Social Media Analytics Platform

Express.js backend with TypeScript for the Social Media Analytics Platform.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Redis (optional, for caching)

### Installation

```bash
npm install
```

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=social_media_analytics
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, redis)
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   ├── utils/         # Utility functions
│   └── server.ts      # Server entry point
├── .env.example       # Environment variables template
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
```

## 📝 API Endpoints

### Health Check
- `GET /health` - Server health check
- `GET /` - API information

More endpoints will be added as development progresses.

## 🔧 Development Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🗄️ Database

The application uses MySQL as the primary database. Make sure MySQL is running and the database is created.

```sql
CREATE DATABASE social_media_analytics;
```

## 🔐 Authentication

JWT-based authentication will be implemented. See Phase 2 for authentication implementation.

## 📦 Dependencies

### Main Dependencies
- `express` - Web framework
- `mysql2` - MySQL driver
- `redis` - Redis client
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Dev Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Development server
- `eslint` - Code linting
- `prettier` - Code formatting

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists: `CREATE DATABASE social_media_analytics;`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process using port 5000

