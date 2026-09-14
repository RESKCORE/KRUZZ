import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Harden HTML against XSS by escaping special characters, quotes, and backticks.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

/**
 * Sanitize an SVG string to remove any script tags, foreignObjects,
 * event handlers (on*), unsafe URLs, or DOM clobbering IDs before mounting into the DOM.
 */
export function sanitizeSvg(rawSvg: string): string {
  if (!rawSvg) return "";

  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawSvg, "image/svg+xml");

      // If parser encountered XML errors, return empty
      const parserError = doc.querySelector("parsererror");
      if (parserError) return "";

      // 1. Remove dangerous elements
      const dangerousTags = ["script", "foreignobject", "iframe", "object", "embed", "style"];
      for (const tag of dangerousTags) {
        const elements = doc.querySelectorAll(tag);
        elements.forEach((el) => el.remove());
      }

      // 2. Remove dangerous attributes (on*, javascript:, vbscript:, data:text/html, etc.)
      const allElements = doc.querySelectorAll("*");
      const clobberingIds = new Set([
        "window",
        "document",
        "location",
        "cookie",
        "body",
        "top",
        "parent",
      ]);

      allElements.forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value.toLowerCase().trim();

          // Strip event handlers
          if (name.startsWith("on")) {
            el.removeAttribute(attr.name);
            continue;
          }

          // Strip dangerous URLs in href or xlink:href
          if (name === "href" || name.endsWith(":href")) {
            if (
              value.startsWith("javascript:") ||
              value.startsWith("vbscript:") ||
              value.startsWith("data:text/html") ||
              value.startsWith("//")
            ) {
              el.removeAttribute(attr.name);
              continue;
            }
          }

          // Neutralize DOM clobbering on IDs
          if (name === "id" && clobberingIds.has(value)) {
            el.removeAttribute(attr.name);
          }
        }
      });

      return new XMLSerializer().serializeToString(doc.documentElement);
    } catch {
      return "";
    }
  }

  // Fallback stripping for non-DOM/SSR environments
  return rawSvg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignobject[\s\S]*?<\/foreignobject>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?<\/embed>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(
      /(href|xlink:href)\s*=\s*(['"])\s*(javascript:|vbscript:|data:text\/html|\/\/).*?\2/gi,
      "",
    )
    .replace(/\sid\s*=\s*(['"])(window|document|location|cookie|body)\1/gi, "");
}

/**
 * Validate and sanitize URLs ensuring only safe protocols (http, https, mailto) are permitted.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("//")
  ) {
    return "";
  }
  try {
    const parsed = new URL(trimmed, "https://kruzz.dev");
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

/**
 * Strip raw executable HTML from user-supplied markdown text.
 */
export function sanitizeMarkdownText(rawMarkdown: string): string {
  if (!rawMarkdown) return "";
  return rawMarkdown
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?<\/embed>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
}

/**
 * Validate that an internal redirect URL is safe and relative (starts with a single slash).
 * Prevents open-redirect vulnerabilities.
 */
export function sanitizeInternalRedirect(url?: string | null): string {
  if (!url || typeof url !== "string") return "/dashboard";
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return "/dashboard";
  }
  return trimmed;
}
