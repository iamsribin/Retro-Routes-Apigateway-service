import { generateSignedUrl } from "../services/generateSignedUrl";

export async function recursivelySignImageUrls(obj: any): Promise<void> {
  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    if (
      typeof value === "string" &&
      key.toLowerCase().includes("imageurl") &&
      value.trim() !== ""
    ) {
      obj[key] = await generateSignedUrl(value);
    } else if (typeof value === "object" && value !== null) {
      await recursivelySignImageUrls(value);
    }
  }
}
