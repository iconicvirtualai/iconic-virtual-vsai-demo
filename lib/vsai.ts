const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY || "";

export async function fetchVsai(path: string, init?: RequestInit) {
  if (!VSAI_API_KEY) {
    throw new Error("VSAI API key not configured");
  }

  const resp = await fetch(`${VSAI_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Api-key ${VSAI_API_KEY}`,
      ...(init?.headers || {}),
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `VSAI ${path} failed: ${resp.status} ${text.slice(0, 200)}`
    );
  }

  return resp.json();
}

function extractOutputUrl(output: any): string | undefined {
  if (!output) return undefined;
  if (typeof output === "string" && output.trim()) return output;

  const keys = [
    "url",
    "image_url",
    "output_url",
    "result_image_url",
    "result_url",
    "download_url",
    "public_url",
    "rendered_url",
    "viewable_url",
  ];

  for (const key of keys) {
    const value = output[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  if (Array.isArray(output.outputs) && output.outputs.length > 0) {
    const nested = extractOutputUrl(output.outputs[0]);
    if (nested) return nested;
  }

  if (Array.isArray(output.media) && output.media.length > 0) {
    const nested = extractOutputUrl(output.media[0]);
    if (nested) return nested;
  }

  return undefined;
}

export function pickFirstOutputUrl(outputs: any[]): string | undefined {
  if (!Array.isArray(outputs)) return undefined;
  for (const output of outputs) {
    const url = extractOutputUrl(output);
    if (url) return url;
  }
  return undefined;
}
