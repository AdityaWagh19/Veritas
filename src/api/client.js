const BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Health check endpoint to verify API and model availability.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) return { status: "error", models_loaded: false };
    return await res.json();
  } catch (err) {
    return { status: "offline", models_loaded: false, error: err.message };
  }
}

/**
 * Classify text, retrieve similar news, and explain lexical features.
 */
export async function analyseArticle(payload) {
  const res = await fetch(`${BASE_URL}/api/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to analyze article. Please try again.");
  }
  return data;
}

/**
 * Fetch performance metrics for the Dashboard view.
 */
export async function getMetrics() {
  const res = await fetch(`${BASE_URL}/api/metrics`);
  if (!res.ok) {
    throw new Error("Unable to fetch performance metrics.");
  }
  return await res.json();
}

/**
 * Fetch sample articles for quick demo testing.
 */
export async function getSamples() {
  try {
    const res = await fetch(`${BASE_URL}/api/samples`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Extract article headline and text from a public web URL.
 */
export async function extractFromUrl(url) {
  const res = await fetch(`${BASE_URL}/api/extract-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to extract article from URL.");
  }
  return data;
}

