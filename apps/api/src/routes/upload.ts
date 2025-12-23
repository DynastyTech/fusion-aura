import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { config } from '../config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload image (admin only)
  fastify.post(
    '/image',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!data.mimetype || !allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type. Only images (JPEG, PNG, WEBP, GIF) are allowed.',
        });
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (data.file.bytesRead > maxSize) {
        return reply.status(400).send({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        });
      }

      try {
        // Convert file buffer to stream
        const buffer = await data.toBuffer();
        const stream = Readable.from(buffer);

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'fusionaura/products',
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.pipe(uploadStream);
        });

        return reply.send({
          success: true,
          data: {
            url: (uploadResult as any).secure_url,
            publicId: (uploadResult as any).public_id,
            width: (uploadResult as any).width,
            height: (uploadResult as any).height,
          },
        });
      } catch (error: any) {
        request.log.error('Cloudinary upload error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to upload image: ' + (error.message || 'Unknown error'),
        });
      }
    }
  );

  // Delete image (admin only)
  fastify.delete(
    '/image/:publicId',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { publicId: string };
      const publicId = decodeURIComponent(params.publicId);

      try {
        const result = await cloudinary.uploader.destroy(publicId);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        request.log.error('Cloudinary delete error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete image: ' + (error.message || 'Unknown error'),
        });
      }
    }
  );
}

