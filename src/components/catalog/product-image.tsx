import Image from "next/image";

/** Product photo or a neutral placeholder; images are never stretched. */
export function ProductImage({ src, alt, sizes, className = "", priority = false }: { src: string | null; alt: string; sizes: string; className?: string; priority?: boolean }) {
  if (!src) {
    return <div aria-hidden="true" className={`grid place-items-center rounded-xl bg-white/70 text-sm text-muted ${className}`}>Ảnh đang cập nhật</div>;
  }
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
