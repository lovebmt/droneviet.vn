import "reflect-metadata";
import { EntityManager } from "typeorm";
import { ComboItem } from "../catalog/entities/combo-item.entity";
import { Product, ProductKind, ProductStatus, type ProductLevel } from "../catalog/entities/product.entity";
import { Course } from "../courses/entities/course.entity";
import { seedCatalogProducts } from "./seed-catalog";

/**
 * Placeholder content for v2 (spec §16). Insert-only and fill-only:
 * never overwrites prices, stock or any field an admin has already set,
 * so running it twice (or on production) is safe.
 */

const IMAGE_CREDIT = "Ảnh: Igor Savin, Wikimedia Commons, CC BY-SA 3.0";
const PLACEHOLDER = "Đang cập nhật — liên hệ Drone Việt qua Zalo để được tư vấn chi tiết.";

interface Enrichment {
  image: string;
  levels: ProductLevel[];
  specs: Array<{ label: string; value: string }>;
  badge?: string;
  featured?: boolean;
  sortOrder: number;
}

/** Same facts the current public store shows (src/lib/commerce/storefront-catalog.ts). */
const PRODUCT_ENRICHMENT: Record<string, Enrichment> = {
  "dv-primary-lab": { image: "/store/quadcopter-flight-01.jpg", levels: ["tieu-hoc", "thcs"], badge: "Bán chạy", featured: true, sortOrder: 10,
    specs: [{ label: "Đối tượng", value: "Cấp 1-2" }, { label: "Nhóm học", value: "2-4 học sinh" }] },
  "dv-code-fleet": { image: "/store/quadcopter-flight-02.jpg", levels: ["thcs", "thpt"], featured: true, sortOrder: 20,
    specs: [{ label: "Quy mô", value: "5-10 drone" }, { label: "Nội dung", value: "Code + robotics" }] },
  "dv-ai-vision": { image: "/store/quadcopter-flight-03.jpg", levels: ["thpt", "dai-hoc"], badge: "Đặt trước", sortOrder: 30,
    specs: [{ label: "Dữ liệu", value: "Flight logs" }, { label: "Hướng nghiên cứu", value: "AI/IoT" }] },
  "dv-research-platform": { image: "/store/quadcopter-flight-01.jpg", levels: ["dai-hoc"], badge: "Báo giá lab", sortOrder: 40,
    specs: [{ label: "Payload", value: "Camera + sensor" }, { label: "Dữ liệu", value: "Telemetry" }] },
  "dv-instructor-kit": { image: "/store/quadcopter-flight-02.jpg", levels: ["tieu-hoc", "thcs", "thpt"], sortOrder: 50,
    specs: [{ label: "Đào tạo", value: "1-2 ngày" }, { label: "Hỗ trợ", value: "Remote/on-site" }] },
};

interface ComboSeed {
  slug: string;
  name: string;
  nameEn: string;
  summary: string;
  summaryEn: string;
  levels: ProductLevel[];
  image: string;
  sortOrder: number;
  items: Array<{ slug: string; quantity: number; note?: string }>;
}

const COMBOS: ComboSeed[] = [
  { slug: "combo-tieu-hoc", name: "Combo Tiểu học", nameEn: "Primary School Combo", sortOrder: 1,
    summary: "Bộ drone an toàn, giáo trình và đào tạo giáo viên cho một lớp tiểu học. Thành phần chi tiết đang được cập nhật.",
    summaryEn: "Safe drones, curriculum and teacher training for one primary class. Details are being updated.",
    levels: ["tieu-hoc"], image: "/store/quadcopter-flight-01.jpg",
    items: [{ slug: "dv-primary-lab", quantity: 10, note: "1 drone cho 2 học sinh" }, { slug: "dv-instructor-kit", quantity: 1 }] },
  { slug: "combo-stem-lap-trinh", name: "Combo STEM lập trình", nameEn: "STEM Coding Combo", sortOrder: 2,
    summary: "Đội drone lập trình cho lớp THCS – THPT: lập trình, robotics và thi đấu. Thành phần chi tiết đang được cập nhật.",
    summaryEn: "A coding drone fleet for lower and upper secondary classes. Details are being updated.",
    levels: ["thcs", "thpt"], image: "/store/quadcopter-flight-02.jpg",
    items: [{ slug: "dv-code-fleet", quantity: 1 }, { slug: "dv-instructor-kit", quantity: 1 }] },
  { slug: "combo-lop-hoc-quoc-te", name: "Combo Lớp học Quốc tế", nameEn: "International Classroom Combo", sortOrder: 0,
    summary: "Trọn bộ drone, giáo trình tiếng Anh và tiếng Việt, đào tạo giáo viên cho một lớp quốc tế. Thành phần chi tiết đang được cập nhật.",
    summaryEn: "Drones, bilingual curriculum and teacher training for one international class. Details are being updated.",
    levels: ["quoc-te", "thcs", "thpt"], image: "/store/quadcopter-flight-03.jpg",
    items: [{ slug: "dv-code-fleet", quantity: 1 }, { slug: "dv-ai-vision", quantity: 2 }, { slug: "dv-instructor-kit", quantity: 1 }] },
];

const COURSE_ENRICHMENT: Record<string, { level: string; certificateTrack: string; durationHours: number }> = {
  "drone-nhap-mon-cap-1": { level: "co-ban", certificateTrack: "lam-quen", durationHours: 12 },
  "lap-trinh-drone-cap-2": { level: "nang-cao", certificateTrack: "lap-trinh", durationHours: 24 },
  "du-an-drone-cap-3": { level: "chung-chi", certificateTrack: "chung-chi-dieu-khien", durationHours: 36 },
};

const isEmpty = (value: unknown) => value === null || value === undefined || (Array.isArray(value) && value.length === 0);

/** Sets only fields that are still empty; returns true when something changed. */
function fill<T extends object>(entity: T, values: Partial<T>): boolean {
  let changed = false;
  for (const [key, value] of Object.entries(values) as Array<[keyof T, T[keyof T]]>) {
    if (isEmpty(entity[key])) {
      entity[key] = value;
      changed = true;
    }
  }
  return changed;
}

export async function seedV2(manager: EntityManager): Promise<void> {
  const products = manager.getRepository(Product);

  // A brand-new database gets the original catalog first; afterwards that seed never runs again.
  if ((await products.count()) === 0) {
    await seedCatalogProducts(manager);
  }

  for (const [slug, data] of Object.entries(PRODUCT_ENRICHMENT)) {
    const product = await products.findOneBy({ slug });
    if (!product) continue;
    // featured/sortOrder are only set on the first enrichment, so an admin's later choice sticks.
    const firstTime = isEmpty(product.gallery);
    const changed = fill(product, {
      coverImageUrl: data.image,
      gallery: [{ url: data.image, alt: `${product.name}. ${IMAGE_CREDIT}` }],
      levels: data.levels,
      specs: [{ group: "Thông tin chính", items: data.specs }],
      badge: data.badge ?? null,
    });
    if (firstTime) {
      product.featured = data.featured ?? product.featured;
      product.sortOrder = data.sortOrder;
    }
    if (changed) await products.save(product);
  }

  const comboItems = manager.getRepository(ComboItem);
  for (const combo of COMBOS) {
    let product = await products.findOneBy({ slug: combo.slug });
    if (!product) {
      product = await products.save(
        products.create({
          slug: combo.slug,
          name: combo.name,
          nameEn: combo.nameEn,
          summary: combo.summary,
          summaryEn: combo.summaryEn,
          kind: ProductKind.COMBO,
          status: ProductStatus.PUBLISHED,
          levels: combo.levels,
          coverImageUrl: combo.image,
          gallery: [{ url: combo.image, alt: `${combo.name}. ${IMAGE_CREDIT}` }],
          inTheBox: [PLACEHOLDER],
          faq: [{ q: "Combo có xuất hóa đơn VAT và hỗ trợ đấu thầu không?", a: PLACEHOLDER }],
          specs: [],
          compatibleWith: [],
          featured: true,
          sortOrder: combo.sortOrder,
        }),
      );
    }

    if ((await comboItems.countBy({ comboId: product.id })) === 0) {
      const members = await Promise.all(combo.items.map((item) => products.findOneBy({ slug: item.slug })));
      await comboItems.save(
        combo.items.flatMap((item, index) =>
          members[index]
            ? [comboItems.create({ comboId: product!.id, productId: members[index]!.id, quantity: item.quantity, note: item.note ?? null, sortOrder: index })]
            : [],
        ),
      );
    }
  }

  const courses = manager.getRepository(Course);
  for (const [slug, data] of Object.entries(COURSE_ENRICHMENT)) {
    const course = await courses.findOneBy({ slug });
    if (!course) continue;
    const changed = fill(course, {
      descriptionMarkdown: `Đang cập nhật nội dung chi tiết của khóa học.\n\n${PLACEHOLDER}`,
      certificateTrack: data.certificateTrack,
      durationHours: data.durationHours,
    });
    if (course.level === "co-ban" && data.level !== "co-ban") {
      course.level = data.level;
    }
    if (changed || data.level !== "co-ban") await courses.save(course);
  }
}

async function main(): Promise<void> {
  const { appDataSource } = await import("./data-source.js");
  await appDataSource.initialize();
  await appDataSource.transaction((manager) => seedV2(manager));
  await appDataSource.destroy();
}

if (require.main === module) {
  void main();
}
