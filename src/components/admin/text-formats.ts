/** Plain-text formats so staff edit specs and FAQ in a textarea instead of nested forms. */
type Specs = Array<{ group: string; items: Array<{ label: string; value: string }> }>;
type Faq = Array<{ q: string; a: string }>;

const DEFAULT_GROUP = "Thông tin chính";

/** "## Nhóm" starts a group; "Nhãn: Giá trị" adds a row. Rows before any heading go to "Thông tin chính". */
export function specsFromText(text: string): Specs {
  const groups: Specs = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^##\s*(.+)$/.exec(line);
    if (heading) {
      groups.push({ group: heading[1].trim(), items: [] });
      continue;
    }
    const sep = line.indexOf(":");
    if (sep <= 0) continue;
    if (!groups.length) groups.push({ group: DEFAULT_GROUP, items: [] });
    groups[groups.length - 1].items.push({ label: line.slice(0, sep).trim(), value: line.slice(sep + 1).trim() });
  }
  return groups.filter((g) => g.items.length);
}

export function specsToText(specs: Specs): string {
  return specs.map((g) => [`## ${g.group}`, ...g.items.map((i) => `${i.label}: ${i.value}`)].join("\n")).join("\n\n");
}

/** "Hỏi: …" then "Đáp: …" (the answer may continue on following lines). */
export function faqFromText(text: string): Faq {
  const out: Faq = [];
  let current: { q: string; a: string } | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const q = /^Hỏi:\s*(.*)$/i.exec(line);
    const a = /^Đáp:\s*(.*)$/i.exec(line);
    if (q) {
      current = { q: q[1], a: "" };
      out.push(current);
    } else if (a && current) {
      current.a = a[1];
    } else if (line && current?.a) {
      current.a += `\n${line}`;
    }
  }
  return out.filter((f) => f.q && f.a);
}

export function faqToText(faq: Faq): string {
  return faq.map((f) => `Hỏi: ${f.q}\nĐáp: ${f.a}`).join("\n\n");
}

export const linesFromText = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
