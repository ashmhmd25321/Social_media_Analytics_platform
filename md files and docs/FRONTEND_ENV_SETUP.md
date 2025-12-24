# Frontend Environment Setup - Fix "Failed to fetch" Error

## 🔴 The Problem

You're seeing: **"Failed to fetch"** error when trying to log in.

This typically means:
1. Frontend can't reach the backend server
2. CORS configuration issue
3. Backend server not running or not responding
4. Environment variables not set correctly

---

## ✅ Quick Fix

### Step 1: Create Frontend `.env.local` File

1. **Navigate to the `frontend` folder:**
   ```bash
   cd frontend
   ```

2. **Create a new file called `.env.local`:**
   - Create this file in the `frontend` directory (same level as `package.json`)
   - Add these contents:
   ```env
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   
   # Frontend URL
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
   ```

3. **Save the file**

### Step 2: Verify Backend is Running

1. **Check if backend is running:**
   - Open a terminal
   - Navigate to `backend` folder
   - Run: `npm run dev`
   - You should see: `🚀 Server is running on http://localhost:5001`

2. **Test backend health:**
   - Open browser: http://localhost:5001/health
   - Should return: `{"status":"healthy","timestamp":"..."}`

### Step 3: Restart Frontend

1. **Stop the frontend server** (Ctrl+C)
2. **Restart it:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Clear browser cache** (optional):
   - Press `Ctrl+Shift+Delete`
   - Clear cached files
   - Or use Incognito mode

### Step 4: Test Login Again

1. Go to: http://localhost:3000/auth/login
2. Try logging in
3. Should work now! ✅

---

## 🔍 Detailed Troubleshooting

### Issue 1: Backend Not Running

**Symptoms:**
- "Failed to fetch" error
- Network tab shows connection refused

**Solution:**
1. Go to `backend` folder
2. Run: `npm run dev`
3. Wait for: `🚀 Server is running on http://localhost:5001`
4. Try again

### Issue 2: Wrong Port Number

**Symptoms:**
- Backend running on different port
- Frontend trying wrong URL

**Solution:**
1. **Check backend `.env`:**
   ```env
   PORT=5001
   BACKEND_URL=http://localhost:5001
   FRONTEND_URL=http://localhost:3000
   ```

2. **Check frontend `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

3. **Make sure ports match!**

### Issue 3: CORS Error

**Symptoms:**
- Browser console shows CORS error
- "Access-Control-Allow-Origin" error

**Solution:**
1. **Check backend `server.ts`:**
   - Should have:
   ```typescript
   const corsOptions = {
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
   };
   app.use(cors(corsOptions));
   ```

2. **Verify backend `.env`:**
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

3. **Restart backend** after changing `.env`

### Issue 4: Environment Variables Not Loading

**Symptoms:**
- Frontend still using wrong URL
- Changes to `.env.local` not taking effect

**Solution:**
1. **Next.js requires restart** after changing `.env.local`
2. **Stop frontend** (Ctrl+C)
3. **Start again:**
   ```bash
   npm run dev
   ```

4. **Verify in browser console:**
   - Open DevTools → Console
   - Check network requests
   - Should show requests to `http://localhost:5001/api`

---

## 📋 Complete Setup Checklist

### Backend Setup:
- [ ] Backend `.env` has `PORT=5001`
- [ ] Backend `.env` has `BACKEND_URL=http://localhost:5001`
- [ ] Backend `.env` has `FRONTEND_URL=http://localhost:3000`
- [ ] Backend server is running (`npm run dev`)
- [ ] Backend shows: `🚀 Server is running on http://localhost:5001`
- [ ] Backend health check works: http://localhost:5001/health

### Frontend Setup:
- [ ] Frontend `.env.local` file exists
- [ ] Frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- [ ] Frontend server is running (`npm run dev`)
- [ ] Frontend shows: `Ready on http://localhost:3000`
- [ ] Browser console shows no CORS errors

### Testing:
- [ ] Can access: http://localhost:5001/health
- [ ] Can access: http://localhost:3000
- [ ] Login page loads
- [ ] Login request goes to: `http://localhost:5001/api/auth/login`
- [ ] No "Failed to fetch" error

---

## 🛠️ Manual Test

### Test Backend Directly:

1. **Open browser:**
   - Go to: http://localhost:5001/health
   - Should see: `{"status":"healthy","timestamp":"..."}`

2. **Test login endpoint (using browser console or Postman):**
   ```javascript
   fetch('http://localhost:5001/api/auth/login', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       email: 'test@example.com',
       password: 'test123'
     })
   })
   .then(res => res.json())
   .then(data => console.log(data))
   .catch(err => console.error(err))
   ```

### Test Frontend Connection:

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Try to log in**
4. **Check the request:**
   - URL should be: `http://localhost:5001/api/auth/login`
   - Status should be: `200` (if credentials correct) or `401` (if wrong)
   - Should NOT be: `Failed` or `CORS error`

---

## 🎯 Common Solutions

### Solution 1: Create `.env.local` File

**If file doesn't exist:**
1. Create `frontend/.env.local`
2. Add: `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
3. Restart frontend

### Solution 2: Restart Both Servers

**If changes not taking effect:**
1. Stop backend (Ctrl+C)
2. Stop frontend (Ctrl+C)
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`
5. Wait for both to be ready
6. Try again

### Solution 3: Check Firewall/Antivirus

**If connection still fails:**
1. Check Windows Firewall
2. Check antivirus blocking localhost
3. Try disabling temporarily to test

### Solution 4: Use 127.0.0.1 Instead of localhost

**If localhost doesn't work:**
1. Change `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5001/api
   ```
2. Change backend `.env`:
   ```env
   BACKEND_URL=http://127.0.0.1:5001
   FRONTEND_URL=http://127.0.0.1:3000
   ```
3. Restart both servers

---

## 📝 File Locations

### Backend `.env`:
```
backend/.env
```

### Frontend `.env.local`:
```
frontend/.env.local
```

**Note:** `.env.local` is gitignored, so you need to create it manually.

---

## ✅ Expected Result

After following these steps:

1. ✅ Backend running on port 5001
2. ✅ Frontend running on port 3000
3. ✅ Frontend can connect to backend
4. ✅ Login works without "Failed to fetch" error
5. ✅ Network requests show `200` or `401` (not `Failed`)

---

## 🆘 Still Not Working?

If you're still seeing "Failed to fetch":

1. **Check browser console** for detailed error
2. **Check Network tab** to see the actual request
3. **Verify backend is actually running:**
   - Open: http://localhost:5001/health
   - Should return JSON, not error page
4. **Check for port conflicts:**
   - Make sure nothing else is using port 5001
   - Make sure nothing else is using port 3000

---

**Last Updated:** 2024  
**Status:** Ready to Fix ✅

