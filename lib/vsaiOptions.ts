/**
 * Room types and furniture styles accepted by Virtual Staging AI.
 * Source: the published v1 options example and the v2 FurnitureStyles / RoomType enums.
 * https://docs.virtualstagingai.app/endpoints
 */
export const VSAI_STYLES = [
  "standard",
  "modern",
  "scandinavian",
  "industrial",
  "midcentury",
  "luxury",
  "farmhouse",
  "coastal",
] as const;

export const VSAI_ROOM_TYPES = [
  "living",
  "bed",
  "kitchen",
  "dining",
  "home_office",
  "outdoor",
  "kids_room",
] as const;

export const VSAI_STYLE_LABEL =
  "Modern, Scandinavian, Industrial, Midcentury, Luxury, Farmhouse, Coastal, and Standard";

export function readVsaiApiKey(): string {
  const raw =
    process.env.VSAI_API_KEY ||
    process.env.VIRTUAL_STAGING_AI_API_KEY ||
    process.env.VSAI_KEY ||
    "";
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Api-Key\s+/i, "")
    .trim();
}
