// Temporary debug file to check API_URL value
// Add this to your login/register page temporarily to debug

export function debugApiUrl() {
  if (typeof window !== 'undefined') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('🔍 DEBUG - NEXT_PUBLIC_API_URL value:', apiUrl);
    console.log('🔍 DEBUG - Type:', typeof apiUrl);
    console.log('🔍 DEBUG - Length:', apiUrl?.length);
    console.log('🔍 DEBUG - First 50 chars:', apiUrl?.substring(0, 50));
    console.log('🔍 DEBUG - Last 50 chars:', apiUrl?.substring(Math.max(0, (apiUrl?.length || 0) - 50)));
    console.log('🔍 DEBUG - Includes POST?', apiUrl?.includes('POST'));
    console.log('🔍 DEBUG - Includes https?', apiUrl?.includes('https'));
    console.log('🔍 DEBUG - Full value (JSON):', JSON.stringify(apiUrl));
  }
}

