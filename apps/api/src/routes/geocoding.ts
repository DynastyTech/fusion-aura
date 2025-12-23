import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function geocodingRoutes(fastify: FastifyInstance) {
  // Reverse geocode coordinates to address
  fastify.post(
    '/reverse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = reverseGeocodeSchema.parse(request.body);
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      // Try Google Maps first if API key is available
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${body.lat},${body.lng}&key=${apiKey}&result_type=street_address|premise|subpremise|route`;
          
          const response = await fetch(url);
          const data = await response.json();

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;

            // Extract address components
            let streetNumber = '';
            let route = '';
            let city = '';
            let province = '';
            let postalCode = '';
            let country = 'ZA';

            addressComponents.forEach((component: any) => {
              const types = component.types;
              
              if (types.includes('street_number')) {
                streetNumber = component.long_name;
              } else if (types.includes('route')) {
                route = component.long_name;
              } else if (types.includes('locality') || types.includes('sublocality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                province = component.long_name;
              } else if (types.includes('postal_code')) {
                postalCode = component.long_name;
              } else if (types.includes('country')) {
                country = component.short_name;
              }
            });

            // Combine street number and route
            const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim() || result.formatted_address.split(',')[0];

            return reply.send({
              success: true,
              data: {
                addressLine1,
                city: city || '',
                province: province || '',
                postalCode: postalCode || '',
                country: country || 'ZA',
                formattedAddress: result.formatted_address,
              },
            });
          }
        } catch (error: any) {
          console.error('Google Maps geocoding error:', error);
          // Fall through to OpenStreetMap
        }
      }

      // Fallback to OpenStreetMap Nominatim (free, no API key needed)
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${body.lat}&lon=${body.lng}&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'FusionAura-Ecommerce/1.0', // Required by Nominatim
          },
        });
        const data = await response.json();

        if (data && data.address) {
          const addr = data.address;
          
          // Extract address components from OpenStreetMap format
          const addressLine1 = [
            addr.house_number,
            addr.road,
            addr.house,
          ].filter(Boolean).join(' ').trim() || addr.road || '';

          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const province = addr.state || addr.region || '';
          const postalCode = addr.postcode || '';
          const country = addr.country_code?.toUpperCase() || 'ZA';

          return reply.send({
            success: true,
            data: {
              addressLine1: addressLine1 || data.display_name.split(',')[0],
              city: city || '',
              province: province || '',
              postalCode: postalCode || '',
              country: country,
              formattedAddress: data.display_name,
            },
          });
        }
      } catch (error: any) {
        console.error('OpenStreetMap geocoding error:', error);
      }

      // If both fail
      return reply.status(400).send({
        success: false,
        error: 'Could not find address for this location. Please enter it manually.',
      });
    }
  );
}

