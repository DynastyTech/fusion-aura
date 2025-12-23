# Multiple User Sessions Support

## Current Implementation

The FusionAura platform uses **JWT (JSON Web Tokens)** for authentication, which is **stateless** and supports multiple concurrent sessions.

## How It Works

### Multiple Customers
- ✅ **Multiple customer sessions are fully supported**
- Each customer can log in from different browsers/devices
- Each session has its own JWT token stored in `localStorage`
- Tokens are independent and don't conflict

### Admin Sessions
- ✅ **One admin session at a time** (as requested)
- Admin can log in from one browser/device
- If admin logs in from another browser, the previous session remains valid until token expires
- Admin tokens are validated server-side on each request

## Important Notes

### localStorage Behavior
- `localStorage` is **per-origin** (same domain)
- All tabs/windows in the **same browser** share the same `localStorage`
- This means:
  - If you log in as Admin in Tab 1, then log in as Customer in Tab 2 (same browser), Tab 2's login will overwrite Tab 1's token
  - To have multiple users logged in simultaneously, use:
    - **Different browsers** (Chrome, Firefox, Safari, Edge)
    - **Incognito/Private windows**
    - **Different devices**

### Testing Multiple Sessions

**To test with Admin + Customer simultaneously:**

1. **Option 1: Different Browsers**
   - Open Chrome → Login as Admin
   - Open Firefox → Login as Customer
   - Both sessions work independently

2. **Option 2: Incognito Mode**
   - Open regular Chrome → Login as Admin
   - Open Chrome Incognito → Login as Customer
   - Both sessions work independently

3. **Option 3: Different Devices**
   - Desktop → Login as Admin
   - Mobile/Tablet → Login as Customer

## Real-Time Updates

Currently, order status updates are **not real-time**. When an admin updates an order status:
- The admin sees the change immediately (after page refresh)
- The customer needs to refresh their page to see the update

**Future Enhancement:** To see changes live, we could implement:
- WebSockets for real-time updates
- Server-Sent Events (SSE)
- Polling mechanism

## Session Management

### Token Storage
- Tokens are stored in `localStorage` (client-side)
- Each browser/device has its own `localStorage`
- Tokens are validated on each API request

### Token Expiration
- Tokens don't expire by default (can be configured)
- Invalid tokens are cleared automatically on 401 responses
- Users are redirected to login when token is invalid

## Summary

✅ **Multiple customer sessions:** Fully supported (use different browsers/devices)  
✅ **One admin session:** Supported (admin can log in from one browser)  
⚠️ **Same browser limitation:** localStorage is shared, so only one user per browser  
💡 **Solution:** Use different browsers or incognito mode for testing multiple users

