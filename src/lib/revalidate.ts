// src/lib/revalidate.ts
/**
 * Utility function to revalidate cache on the main site
 * @param tags - Array of cache tags to invalidate
 * @param entity - Entity name for logging (e.g., 'articles', 'products')
 */
export async function revalidateCache(tags: string[], entity: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const isProduction = baseUrl.includes('vercel.app') || baseUrl.includes('netlify.app') || !baseUrl.includes('localhost');
  const revalidateUrl = `${baseUrl}/api/revalidate`;

  // Skip revalidate in development if main site is not running locally
  if (!isProduction && baseUrl === 'http://localhost:3000') {
    console.log(`Skipping revalidate for ${entity} in development mode (main site not running locally)`);
    return;
  }

  console.log(`Invalidating ${entity} cache...`);

  try {
    const revalidateResponse = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.API_SECRET!
      },
      body: JSON.stringify({ tags })
    });

    if (revalidateResponse.ok) {
      console.log(`Revalidate successful for ${entity}`);
    } else {
      console.warn(`Revalidate failed for ${entity}: ${revalidateResponse.status}`);
    }
  } catch (error) {
    console.warn(`Revalidate request failed for ${entity}:`, error);
    // Don't fail the operation if revalidate fails
  }
}