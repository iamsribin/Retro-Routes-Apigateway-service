import { generateSignedUrl } from "../services/generateSignedUrl";

export async function recursivelySignImageUrls(obj: any): Promise<void> {
  const entries = Object.entries(obj);

  for (const [key, value] of entries) {
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      (
        key.toLowerCase().includes("image") || 
        key.toLowerCase().endsWith("imageurl") ||
        key.toLowerCase().endsWith("image")
      )
    ) {
      obj[key] = await generateSignedUrl(value);
    } else if (typeof value === "object" && value !== null) {
      await recursivelySignImageUrls(value);
    }
  }
}

