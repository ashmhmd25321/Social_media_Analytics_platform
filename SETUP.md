# Setup Instructions

## Quick Setup Guide

### 1. Database Setup

Make sure MySQL is running, then create the database:

```bash
# Option 1: Using MySQL command line
mysql -u root -p < backend/src/config/database-schema.sql

# Option 2: Or connect to MySQL and run:
mysql -u root -p
CREATE DATABASE IF NOT EXISTS social_media_analytics;
USE social_media_analytics;
SOURCE backend/src/config/database-schema.sql;
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials:
# - DB_USER=root
# - DB_PASSWORD=your_mysql_password
# - JWT_SECRET=generate_a_random_secret_key
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:5001

### 4. Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

## Testing

1. Visit http://localhost:3000
2. Click "Sign Up" to create an account
3. Login with your credentials
4. Access the dashboard
5. Go to Settings to update profile

## Troubleshooting

- **Database connection error**: Make sure MySQL is running and credentials are correct in `.env`
- **Port already in use**: Change PORT in backend `.env` or kill the process using the port
- **Frontend can't connect to backend**: Check FRONTEND_URL in backend `.env` matches frontend URL

