# Admin Panel Setup Guide

## 🎯 Overview

The admin panel provides complete control over:
- **User Management**: View all users, manage subscriptions, enable/disable trial accounts
- **Platform Settings**: Configure trial duration, max users, feature flags
- **System Monitoring**: Track users, brokers, trades, and platform health
- **Audit Logging**: Track all admin actions

## 🚀 Setup Steps

### Step 1: Run Database Migration

The migration adds:
- `is_admin` field to profiles table
- `admin_settings` table for platform configuration
- `admin_audit_log` table for tracking admin actions
- Updated RLS policies to allow admin access

**Run migration:**
```bash
# If using Supabase CLI
supabase migration up

# Or apply directly in Supabase SQL Editor
# Copy contents of: supabase/migrations/20251123000000_add_admin_support.sql
```

### Step 2: Create First Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (replace `YOUR_USER_EMAIL` with your email):

```sql
-- Make your user an admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'YOUR_USER_EMAIL@example.com';
```

**Option B: Via SQL Directly**

```sql
-- Find your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update profile (replace USER_ID with actual ID)
UPDATE public.profiles
SET is_admin = true
WHERE user_id = 'USER_ID';
```

### Step 3: Access Admin Panel

1. Log in to your account (the one you made admin)
2. Navigate to: `https://skyspear.in/admin`
3. You should see the Admin Dashboard

## 📋 Admin Panel Features

### 1. User Management Tab

**Features:**
- View all registered users
- See subscription plan (trial/basic/premium)
- View account status (active/inactive)
- **Change subscription plan** - Click dropdown to change
- **Enable/Disable users** - Toggle switch to activate/deactivate
- **View creation date** - See when user registered

**Actions:**
- **Change to Trial**: Sets plan to "trial" with 7-day expiry
- **Change to Basic/Premium**: Sets plan and removes expiry
- **Toggle Active**: Enable/disable user access

### 2. Platform Settings Tab

**Configurable Settings:**
- **Trial Duration**: Default trial period in days (default: 7)
- **Max Trial Users**: Maximum number of trial users allowed
- **Platform Enabled**: Master switch to enable/disable platform
- **Maintenance Mode**: Put platform in maintenance mode
- **Auto-Execute Enabled**: Enable/disable auto-execute feature globally
- **Max Strategies Per User**: Limit strategies per user (default: 5)

**How to Use:**
- Change values and they save automatically
- Settings are stored in `admin_settings` table
- All changes are logged in audit log

### 3. System Monitoring Tab

**Metrics Displayed:**
- Total Users: All registered users
- Trial Users: Users currently on trial
- Active Brokers: Connected broker accounts
- Total Trades: All-time trade count

**Future Enhancements:**
- Real-time activity feed
- Error monitoring
- Performance metrics
- System health status

## 🔒 Security Features

### Row Level Security (RLS)

- **Admin-only access**: Only users with `is_admin = true` can access admin panel
- **Admin can view all data**: Admins can see all users, trades, brokers
- **Audit logging**: All admin actions are logged
- **Service role required**: Some operations require service role key

### Audit Logging

All admin actions are automatically logged:
- User subscription changes
- User activation/deactivation
- Settings updates
- Timestamp, IP address, user agent

**View audit logs:**
```sql
SELECT * FROM admin_audit_log 
ORDER BY created_at DESC 
LIMIT 100;
```

## 🎯 Common Admin Tasks

### Enable Trial for New User

1. Go to **User Management** tab
2. Find the user
3. Click subscription dropdown → Select **"Trial"**
4. User gets 7-day trial automatically

### Extend Trial Period

1. Go to **User Management** tab
2. Find the user
3. Change subscription to **"Trial"** (resets to 7 days)
4. Or manually update expiry in database

### Disable User Account

1. Go to **User Management** tab
2. Find the user
3. Toggle **"Active"** switch to OFF
4. User can't log in until reactivated

### Enable/Disable Platform

1. Go to **Platform Settings** tab
2. Toggle **"Platform Enabled"** switch
3. When disabled, users see maintenance message

### View All Users

1. Go to **User Management** tab
2. See complete list of all users
3. Filter/sort by plan, status, date

## 📊 Database Schema

### New Tables

**admin_settings:**
- `setting_key` (TEXT, UNIQUE): Setting identifier
- `setting_value` (JSONB): Setting value
- `updated_by` (UUID): Admin who updated
- `updated_at` (TIMESTAMP): Last update time

**admin_audit_log:**
- `admin_user_id` (UUID): Admin who performed action
- `action_type` (TEXT): Type of action
- `target_user_id` (UUID): User affected (if applicable)
- `details` (JSONB): Action details
- `ip_address` (TEXT): Admin's IP
- `user_agent` (TEXT): Browser info
- `created_at` (TIMESTAMP): When action occurred

### Updated Tables

**profiles:**
- `is_admin` (BOOLEAN): Admin flag
- `is_active` (BOOLEAN): Account active status
- `notes` (TEXT): Admin notes about user

## 🔧 API Endpoints (Future)

For programmatic access, you can create Supabase Edge Functions:

```typescript
// Example: Update user subscription
const { data, error } = await supabase.rpc('update_user_subscription', {
  target_user_id: 'user-id',
  new_plan: 'premium',
  expires_at: null
});
```

## 🚨 Important Notes

1. **First Admin**: Must be created manually via SQL
2. **Security**: Admin panel checks `is_admin` flag on every load
3. **Audit Trail**: All actions are logged - cannot be deleted
4. **RLS Policies**: Updated to allow admins to view all data
5. **Service Role**: Some operations may require service role key

## 🎯 Next Steps

1. ✅ Run migration
2. ✅ Create first admin user
3. ✅ Access `/admin` route
4. ✅ Test user management features
5. ✅ Configure platform settings

## 📝 Example: Making Multiple Admins

```sql
-- Make multiple users admins
UPDATE public.profiles
SET is_admin = true
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
```

## 🔍 Troubleshooting

**Can't access admin panel:**
- Check if `is_admin = true` in profiles table
- Verify you're logged in with correct account
- Check browser console for errors

**Settings not saving:**
- Check Supabase RLS policies
- Verify service role key is set
- Check browser console for errors

**Users not showing:**
- Verify RLS policies are updated
- Check if admin flag is set correctly
- Refresh page

