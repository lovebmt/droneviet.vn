import type { Metadata } from "next";

// The homepage is also served (not redirected) on apex droneviet.vn for Zalo verification;
// the canonical keeps www as the indexed copy. The v2 homepage replaces this in Plan 3.
export const metadata: Metadata = {
  alternates: { canonical: "https://www.droneviet.vn/" },
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-3xl font-semibold">Drone Việt</h1>
      <p className="mt-4 text-slate-600">Giao diện mới đang được xây dựng.</p>
    </main>
  );
}
