# Cloudinary Setup Guide

## Overview

FusionAura uses **Cloudinary** for image hosting and management. Cloudinary provides a free tier that includes:
- 25GB storage
- 25GB bandwidth per month
- Full API access (upload, delete, transform)
- Image optimization and CDN delivery

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Get Your API Credentials

1. After logging in, go to your **Dashboard**
2. You'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these three values

## Step 3: Add Credentials to Environment Variables

Add the following to your `.env` file in the project root:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=my-fusionaura-store
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Step 4: Restart the API Server

After adding the credentials, restart your API server:

```bash
# Stop the current API server (Ctrl+C)
# Then restart it
cd apps/api
npm run dev
```

## Step 5: Test Image Upload

1. Log in as admin at `http://localhost:3000/login`
2. Go to "Add New Product"
3. Click the upload area and select an image
4. The image should upload to Cloudinary and display in the preview

## Features

### Image Upload
- **Max file size**: 10MB per image
- **Supported formats**: JPEG, PNG, WEBP, GIF
- **Max images per product**: 5
- **Automatic optimization**: Images are automatically optimized for web delivery

### Image Management
- Images are stored in the `fusionaura/products` folder on Cloudinary
- Images are automatically resized to max 1200x1200px
- Images are delivered via Cloudinary's CDN for fast loading

### API Endpoints

**Upload Image** (Admin only):
```
POST /api/upload/image
Content-Type: multipart/form-data
Body: file (image file)
```

**Delete Image** (Admin only):
```
DELETE /api/upload/image/:publicId
```

## Troubleshooting

### "Cloudinary not configured" error
- Make sure you've added all three environment variables to `.env`
- Restart the API server after adding credentials
- Check that the credentials are correct (no extra spaces)

### Upload fails
- Check file size (must be under 10MB)
- Check file format (JPEG, PNG, WEBP, or GIF only)
- Verify you're logged in as admin
- Check browser console for detailed error messages

### Images not displaying
- Check that the Cloudinary URL is accessible
- Verify the image was uploaded successfully
- Check browser console for CORS or loading errors

## Free Tier Limits

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: Unlimited
- **API requests**: Unlimited

For most small to medium e-commerce stores, the free tier is sufficient. If you need more, Cloudinary offers paid plans starting at $99/month.

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control. The API Secret is sensitive and should be kept private.

The API endpoints are protected by authentication - only admin users can upload/delete images.

