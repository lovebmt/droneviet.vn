"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "./product-image";

/** Main photo plus thumbnails; with no photos it shows the neutral placeholder. */
export function Gallery({ images, name }: { images: Array<{ url: string; alt: string }>; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;
  return (
    <div>
      <ProductImage src={current?.url ?? null} alt={current?.alt || name} sizes="(min-width: 1024px) 50vw, 100vw" priority className="aspect-[4/3] w-full bg-sky-50" />
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label="Ảnh sản phẩm">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={`relative block h-16 w-20 overflow-hidden rounded-xl ring-2 ${i === active ? "ring-sky" : "ring-transparent hover:ring-line"}`}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
