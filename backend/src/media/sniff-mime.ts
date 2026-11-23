/** Detects the real file type from its first bytes; the name and declared type are never trusted. */
export type AllowedMime =
  | "image/webp"
  | "image/avif"
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf";

export const EXTENSION_BY_MIME: Record<AllowedMime, string> = {
  "image/webp": "webp",
  "image/avif": "avif",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export function sniffMime(bytes: Buffer): AllowedMime | null {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString("ascii");

  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) {
    return "image/avif";
  }
  if (bytes.length >= 5 && ascii(0, 5) === "%PDF-") {
    return "application/pdf";
  }
  const head = bytes.subarray(0, 4096).toString("utf8").replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) {
    return "image/svg+xml";
  }
  return null;
}

/** SVG can carry script; reject anything that could execute in a browser. */
export function isUnsafeSvg(bytes: Buffer): boolean {
  const text = bytes.toString("utf8");
  return /<script[\s>]/i.test(text) || /\son[a-z]+\s*=/i.test(text) || /javascript:/i.test(text) || /<foreignObject[\s>]/i.test(text);
}
