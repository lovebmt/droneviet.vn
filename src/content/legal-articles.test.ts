import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const article = (slug: string) => readFileSync(`content/phap-ly/${slug}/index.md`, "utf8");

describe("legal articles", () => {
  it("say every drone must be registered, whatever its weight", () => {
    const text = article("quy-dinh-phap-ly-drone");
    expect(text).not.toMatch(/từ 0,25 kg trở lên dùng cho lớp học cần được đăng ký/);
    expect(text).toMatch(/Mọi drone, kể cả drone dưới 0,25 kg, đều phải đăng ký/);
  });
});
