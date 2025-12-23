# Google Maps API Setup Guide

## Overview

FusionAura uses Google Maps Geocoding API to convert GPS coordinates to addresses when users click "Use Current Location" during checkout.

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Geocoding API"
   - Click "Enable"

4. Create an API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. (Recommended) Restrict the API Key:
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Geocoding API"
   - Under "Application restrictions", you can restrict by IP or HTTP referrer for security

## Step 2: Add API Key to Environment Variables

Add the following to your `.env` file in the project root:

```env
# Google Maps (for geocoding/address lookup)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Example:**
```env
GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuv
```

## Step 3: Restart the API Server

After adding the API key, restart your API server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Step 4: Test the Feature

1. Go to checkout page
2. Click "Use Current Location" button
3. Allow location access when prompted
4. Your address fields should be automatically filled!

## Pricing

Google Maps Geocoding API has a free tier:
- **$5.00 per 1,000 requests** after free tier
- **$200 free credit per month** (covers ~40,000 requests)
- For most small to medium stores, this is effectively free

## Security Notes

- The API key is stored on the backend (server-side)
- Never expose your API key in frontend code
- Consider restricting the API key by IP address in production
- Monitor usage in Google Cloud Console

## Troubleshooting

### "Google Maps API key not configured"
- Make sure `GOOGLE_MAPS_API_KEY` is set in your `.env` file
- Restart the API server after adding the key

### "Could not find address for this location"
- The location might be too imprecise
- Try again or enter address manually
- Make sure Geocoding API is enabled in Google Cloud Console

### Location permission denied
- User needs to allow location access in browser
- Some browsers require HTTPS for geolocation (except localhost)

## Alternative: Free Geocoding Services

If you prefer not to use Google Maps, you can use:
- **OpenStreetMap Nominatim** (free, no API key needed)
- **Mapbox Geocoding API** (free tier available)

Let me know if you'd like to switch to a free alternative!

