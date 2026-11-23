import type { Metadata } from "next";
import { absolute, SITE_NAME } from "./site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Open Graph for a page that sets its own (Next replaces the layout's openGraph rather than merging),
 * so it keeps the site name, locale and an absolute URL.
 */
export function openGraphFor({ title, description, path, images, type = "website", publishedTime }: { title: string; description?: string; path: string; images?: string[]; type?: "website" | "article"; publishedTime?: string }): OpenGraph {
  return {
    title,
    ...(description ? { description } : {}),
    url: absolute(path),
    siteName: SITE_NAME,
    locale: "vi_VN",
    type,
    ...(images?.length ? { images } : {}),
    ...(type === "article" && publishedTime ? { publishedTime } : {}),
  } as OpenGraph;
}
