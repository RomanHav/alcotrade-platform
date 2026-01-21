/**
 * Utility function to revalidate cache on the main site
 * @param tags - Array of cache tags to invalidate
 * @param entity - Entity name for logging (e.g., 'articles', 'products')
 */
export async function revalidateCache(tags: string[], entity: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const apiSecret = process.env.API_SECRET
  
  if (!apiSecret) {
    console.warn(`[Revalidate] API_SECRET not configured for ${entity}`)
    return
  }

  const isProduction = baseUrl.includes('vercel.app') || baseUrl.includes('netlify.app') || !baseUrl.includes('localhost')
  const revalidateUrl = `${baseUrl}/api/revalidate`

  // Skip revalidate in development if main site is not running locally
  if (!isProduction && baseUrl === 'http://localhost:3000') {
    console.log(`[Revalidate] Skipping revalidate for ${entity} in development mode (main site not running locally)`)
    return
  }

  console.log(`[Revalidate] Starting revalidation for ${entity} with tags:`, tags)

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const revalidateResponse = await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': apiSecret,
        },
        body: JSON.stringify({ tags }),
        // Увеличиваем timeout для production
        signal: AbortSignal.timeout(isProduction ? 30000 : 10000),
      })

      if (revalidateResponse.ok) {
        const result = await revalidateResponse.json()
        console.log(`[Revalidate] ✓ Revalidate successful for ${entity}`, result)
        return
      } else {
        const errorText = await revalidateResponse.text()
        lastError = new Error(
          `HTTP ${revalidateResponse.status}: ${errorText}`
        )
        console.warn(
          `[Revalidate] Attempt ${attempt}/${maxRetries} failed for ${entity}:`,
          lastError.message
        )
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(
        `[Revalidate] Attempt ${attempt}/${maxRetries} request failed for ${entity}:`,
        lastError.message
      )

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`[Revalidate] Waiting ${delay}ms before retry...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Log final failure
  console.error(
    `[Revalidate] ✗ Failed to revalidate ${entity} after ${maxRetries} attempts:`,
    lastError?.message
  )

 
}
