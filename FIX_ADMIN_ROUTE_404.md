# Fix: Admin Route Showing 404

## 🔍 Problem

The `/admin` route is showing "Page not found" even though it's configured in `App.tsx`.

## ✅ Solution: Rebuild Frontend

The frontend container was built before the admin route was added. You need to rebuild it.

### Quick Fix (On Server)

**SSH into your server and run:**

```bash
cd /opt/nifty-stride-trader

# Rebuild frontend with new admin route
docker compose build --no-cache frontend

# Restart frontend
docker compose up -d frontend

# Wait a few seconds
sleep 5

# Check if it's running
docker compose ps frontend
```

### Or Redeploy via Pipeline

**Push your changes and the pipeline will rebuild automatically:**

```bash
git add .
git commit -m "Add admin panel"
git push origin main
```

The deployment pipeline will:
1. Pull latest code
2. Rebuild frontend (includes new AdminDashboard component)
3. Restart containers

## 🔍 Verify Route is Working

**After rebuild:**

1. **Hard refresh browser:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Navigate to:** `https://skyspear.in/admin`
3. **Should show:** Admin Dashboard (or redirect to login if not admin)

## 📋 Why This Happens

- React Router routes are compiled into the frontend build
- The frontend container was built before `/admin` route existed
- Old build doesn't know about the new route → shows 404
- Rebuilding includes the new route in the bundle

## ✅ After Rebuild

The admin panel should be accessible at:
- `https://skyspear.in/admin`
- Or click "Admin Panel" button in dashboard (if you're admin)

## 🔧 If Still Not Working

1. **Check browser console (F12)** for errors
2. **Check frontend logs:**
   ```bash
   docker compose logs frontend --tail=50
   ```
3. **Verify route in code:**
   - Check `src/App.tsx` has `/admin` route
   - Check `src/pages/AdminDashboard.tsx` exists

