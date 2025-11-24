# Quick Diagnostic & Fix Guide

## Issue: "No hotels found" or 500 Internal Server Error

### Step 1: Check Server is Running
Open the terminal where you ran `cd server` and `npm run dev`. You should see:
```
Server running on port 5000
```

If you see errors, restart the server:
```bash
# Stop the server (Ctrl+C)
cd server
npm run dev
```

### Step 2: Verify .env File
Check that `server/.env` exists and contains:
```
ETG_KEY_ID=your_key_id_here
ETG_API_KEY=your_api_key_here
```

**IMPORTANT**: Make sure there are NO spaces around the `=` sign!

### Step 3: Test Backend Directly
Open a NEW terminal and run:
```bash
cd server
node -e "require('dotenv').config(); console.log('ETG_KEY_ID:', process.env.ETG_KEY_ID); console.log('ETG_API_KEY:', process.env.ETG_API_KEY ? 'SET' : 'NOT SET');"
```

You should see:
```
ETG_KEY_ID: 13816
ETG_API_KEY: SET
```

If you see `undefined`, your `.env` file is not being loaded!

### Step 4: Test API Endpoint
In a NEW terminal:
```bash
curl -X POST http://localhost:5000/api/search -H "Content-Type: application/json" -d "{\"ids\":[\"test_hotel_do_not_book\"],\"checkin\":\"2026-01-01\",\"checkout\":\"2026-01-05\",\"guests\":[{\"adults\":2,\"children\":[]}],\"residency\":\"us\"}"
```

You should see JSON hotel data, NOT an error.

### Step 5: Check Browser Console
1. Open http://localhost:5173
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Try searching for hotels
5. Look for red error messages

Common errors:
- `500 Internal Server Error` → Backend issue (check server terminal)
- `Network Error` → Backend not running
- `CORS Error` → Backend CORS not configured

### Step 6: Restart Everything
If still not working:
```bash
# Terminal 1 - Stop and restart backend
cd server
# Press Ctrl+C to stop
npm run dev

# Terminal 2 - Stop and restart frontend
cd client
# Press Ctrl+C to stop
npm run dev
```

### Step 7: Use Correct Dates
Make sure your dates are in the FUTURE:
- ✅ Check-in: `2026-01-01` (good)
- ❌ Check-in: `2025-11-24` (today - might cause issues)

### Step 8: Try the Automated Test
This bypasses the frontend entirely:
```bash
cd server
node scripts/certification_test.js
```

If this works but the web app doesn't, the issue is in the frontend.
If this fails, the issue is in the backend/API credentials.

---

## Quick Fix Checklist
- [ ] Server is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] `.env` file exists in `server/` directory
- [ ] `.env` has correct `ETG_KEY_ID` and `ETG_API_KEY`
- [ ] Dates are in the future (2026+)
- [ ] No errors in browser console
- [ ] No errors in server terminal

---

## Still Not Working?
Share the error message from:
1. Browser console (F12 → Console tab)
2. Server terminal output
3. Result of Step 3 (checking .env loading)
