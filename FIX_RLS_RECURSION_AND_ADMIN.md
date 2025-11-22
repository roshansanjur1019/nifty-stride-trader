# Fix: RLS Infinite Recursion & Admin Panel Issues

## 🔍 Problems Identified

1. **RLS Infinite Recursion**: "infinite recursion detected in policy for relation 'profiles'"
   - Admin check queries `profiles` table
   - But querying `profiles` triggers the policy
   - Which checks admin by querying `profiles` again
   - **Infinite loop!**

2. **Admin Route Redirects**: `/admin` goes to home page
   - Frontend needs rebuild

3. **Broker Account Failing**: 200 edge function error
   - Caused by broken RLS policies

## ✅ Solution: Separate Admin Edge Function

### Step 1: Fix RLS Policies (Remove Recursion)

**Run this migration in Supabase SQL Editor:**

```sql
-- File: supabase/migrations/20251123000001_fix_admin_rls_recursion.sql
-- This removes the recursive admin checks from RLS policies
```

**What it does:**
- Removes admin checks from RLS policies (they cause recursion)
- Restores original user-only policies
- Admin access will use Edge Functions with service role (bypasses RLS)

### Step 2: Deploy Admin Edge Function

**Created:** `supabase/functions/admin-users/index.ts`

**This edge function:**
- Uses service role to bypass RLS
- Checks admin status without recursion
- Handles all admin operations:
  - `getAllUsers` - Get all users
  - `updateUserSubscription` - Change user plan
  - `toggleUserActive` - Enable/disable users
  - `getStats` - Get platform statistics
  - `getSettings` - Get admin settings
  - `updateSetting` - Update platform settings

**Deploy it:**
```bash
# Using Supabase CLI
supabase functions deploy admin-users

# Or deploy via Supabase Dashboard
# Go to: Edge Functions → Create Function → admin-users
# Copy contents from: supabase/functions/admin-users/index.ts
```

### Step 3: Rebuild Frontend

**On server:**
```bash
cd /opt/nifty-stride-trader
docker compose build --no-cache frontend
docker compose up -d frontend
```

**Or push changes:**
```bash
git add .
git commit -m "Fix RLS recursion and add admin edge function"
git push origin main
```

## 🔧 How It Works Now

### Before (Broken):
```
User queries profiles → RLS policy checks if admin → Queries profiles → RLS policy checks... → INFINITE LOOP
```

### After (Fixed):
```
User queries profiles → RLS policy: "Is this my own profile?" → Yes/No (no recursion)

Admin operations → Edge Function → Service Role → Bypasses RLS → Direct database access
```

## 📋 Migration Steps

### 1. Run Fix Migration

**In Supabase SQL Editor:**
1. Go to: **SQL Editor**
2. Run: `supabase/migrations/20251123000001_fix_admin_rls_recursion.sql`
3. This fixes the RLS recursion

### 2. Deploy Admin Edge Function

**Option A: Supabase CLI**
```bash
supabase functions deploy admin-users
```

**Option B: Supabase Dashboard**
1. Go to: **Edge Functions**
2. Click **"Create Function"**
3. Name: `admin-users`
4. Copy code from: `supabase/functions/admin-users/index.ts`
5. Deploy

### 3. Rebuild Frontend

```bash
cd /opt/nifty-stride-trader
docker compose build --no-cache frontend
docker compose up -d frontend
```

## ✅ Benefits

1. **No RLS Recursion** - Admin checks don't query profiles in RLS
2. **Separate Admin Function** - Admin operations isolated from user operations
3. **Broker Accounts Work** - Original RLS policies restored
4. **Secure** - Admin operations use service role, properly authenticated

## 🎯 After Fix

1. ✅ Broker accounts will work again
2. ✅ Admin panel accessible at `/admin`
3. ✅ No more RLS recursion errors
4. ✅ All admin operations work via edge function

## 🔍 Verify Fix

**Check broker accounts:**
- Try adding broker account → Should work now

**Check admin panel:**
- Navigate to `/admin` → Should load (after frontend rebuild)
- Admin operations → Should work via edge function

**Check RLS:**
- No more "infinite recursion" errors
- User queries work normally

