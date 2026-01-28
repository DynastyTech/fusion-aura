'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { HiMapPin, HiXMark } from 'react-icons/hi2';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: {
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    lat?: number;
    lng?: number;
  }) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback: () => void;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing your address...',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove script as it might be used elsewhere
    };
  }, []);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'za' }, // Restrict to South Africa
        fields: ['address_components', 'formatted_address', 'geometry'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          return;
        }

        // Extract address components
        let streetNumber = '';
        let route = '';
        let city = '';
        let province = '';
        let postalCode = '';

        for (const component of place.address_components || []) {
          const type = component.types[0];
          
          switch (type) {
            case 'street_number':
              streetNumber = component.long_name;
              break;
            case 'route':
              route = component.long_name;
              break;
            case 'locality':
            case 'sublocality':
              city = city || component.long_name;
              break;
            case 'administrative_area_level_1':
              province = component.long_name;
              break;
            case 'postal_code':
              postalCode = component.long_name;
              break;
          }
        }

        const addressLine1 = streetNumber ? `${streetNumber} ${route}` : route || place.formatted_address || '';
        const lat = place.geometry.location?.lat();
        const lng = place.geometry.location?.lng();

        setInputValue(addressLine1);
        setSelectedLocation(lat && lng ? { lat, lng } : null);
        setShowMap(true);

        onChange({
          addressLine1,
          city,
          province,
          postalCode,
          lat,
          lng,
        });
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isLoaded, onChange]);

  // Initialize/Update Map
  useEffect(() => {
    if (!isLoaded || !showMap || !mapRef.current || !selectedLocation) return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: selectedLocation,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        markerRef.current = new window.google.maps.Marker({
          position: selectedLocation,
          map: mapInstanceRef.current,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });

        // Allow marker dragging to adjust location
        markerRef.current.addListener('dragend', async () => {
          const position = markerRef.current.getPosition();
          const lat = position.lat();
          const lng = position.lng();
          
          // Reverse geocode the new position
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              const place = results[0];
              
              let streetNumber = '';
              let route = '';
              let city = '';
              let province = '';
              let postalCode = '';

              for (const component of place.address_components || []) {
                const type = component.types[0];
                
                switch (type) {
                  case 'street_number':
                    streetNumber = component.long_name;
                    break;
                  case 'route':
                    route = component.long_name;
                    break;
                  case 'locality':
                  case 'sublocality':
                    city = city || component.long_name;
                    break;
                  case 'administrative_area_level_1':
                    province = component.long_name;
                    break;
                  case 'postal_code':
                    postalCode = component.long_name;
                    break;
                }
              }

              const addressLine1 = streetNumber ? `${streetNumber} ${route}` : route || place.formatted_address || '';
              setInputValue(addressLine1);
              
              onChange({
                addressLine1,
                city,
                province,
                postalCode,
                lat,
                lng,
              });
            }
          });
        });
      } else {
        mapInstanceRef.current.setCenter(selectedLocation);
        markerRef.current.setPosition(selectedLocation);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [isLoaded, showMap, selectedLocation, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length === 0) {
      setShowMap(false);
      setSelectedLocation(null);
    }
  }, []);

  const clearAddress = useCallback(() => {
    setInputValue('');
    setShowMap(false);
    setSelectedLocation(null);
    onChange({
      addressLine1: '',
      city: '',
      province: '',
      postalCode: '',
    });
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <HiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] 
                     bg-[rgb(var(--card))] text-[rgb(var(--foreground))]
                     focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark
                     transition-all duration-200 ${className}`}
        />
        {inputValue && (
          <button
            type="button"
            onClick={clearAddress}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full 
                     hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <HiXMark className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
          </button>
        )}
      </div>
      
      {!isLoaded && (
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Loading address suggestions...
        </p>
      )}

      {/* Map Preview */}
      {showMap && selectedLocation && (
        <div className="rounded-xl overflow-hidden border border-[rgb(var(--border))]">
          <div 
            ref={mapRef} 
            className="w-full h-48"
          />
          <div className="p-2 bg-[rgb(var(--muted))] text-xs text-[rgb(var(--muted-foreground))]">
            📍 Drag the pin to adjust your exact location
          </div>
        </div>
      )}
    </div>
  );
}
