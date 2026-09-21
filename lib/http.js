// Reads a fetch Response body as JSON without ever throwing on a
// non-JSON reply. A raw `response.json()` call crashes with a confusing,
// browser-specific error ("Unexpected token 'R', "Request En"... is not
// valid JSON" on Chrome, "The string did not match the expected pattern."
// on Safari/WebKit) whenever something between the browser and our API
// route -- the host, a proxy, a size limit -- returns plain text or HTML
// instead of JSON. This normalizes that into a readable error message.
export async function safeJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: response.ok
        ? "The server sent back an unexpected response. Please try again."
        : `Something went wrong (error ${response.status}). Please check your connection and try again.`,
    };
  }
}
