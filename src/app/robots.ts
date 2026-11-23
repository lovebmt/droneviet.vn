import type { MetadataRoute } from "next";

/** Private areas no crawler needs. */
const PRIVATE = ["/admin", "/tai-khoan", "/gio-hang", "/thanh-toan", "/api/"];

/**
 * AI assistants that fetch pages to answer or cite in search results: welcome, so Drone Việt
 * shows up (with a link) when people ask ChatGPT, Claude or Perplexity.
 */
const AI_SEARCH_AND_ANSWER = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"];

/**
 * Crawlers that collect pages to train AI models: kept out (owner's choice, 2026-11-24).
 * Google-Extended only controls Gemini training; Google Search and AI Overviews use Googlebot.
 */
const AI_TRAINING = ["GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended", "Applebot-Extended", "Meta-ExternalAgent", "Bytespider", "cohere-training-data-crawler"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_SEARCH_AND_ANSWER, allow: "/", disallow: PRIVATE },
      { userAgent: AI_TRAINING, disallow: "/" },
    ],
    sitemap: "https://www.droneviet.vn/sitemap.xml",
    host: "https://www.droneviet.vn",
  };
}
