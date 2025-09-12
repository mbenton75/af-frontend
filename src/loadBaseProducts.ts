// src/loadBaseProducts.ts
export type BaseProduct = {
  code: string;
  brand: string;
  model_name: string;
  label: string;
  category: string;
  tier: string;          // may be empty in source → we'll fill from tier_map.csv
  organic: boolean;
  usa_made: boolean;
  active: boolean;
  retail_price: number;
  fit_notes: string;
};

export async function loadBaseProducts(): Promise<BaseProduct[]> {
  // Load base_products and the tier map in parallel
  const [bpRes, tierRes] = await Promise.all([
    fetch("/data/base_products.csv", { cache: "no-store" }),
    fetch("/data/tier_map.csv", { cache: "no-store" }),
  ]);

  if (!bpRes.ok) throw new Error(`Failed to load base_products.csv: ${bpRes.status}`);
  if (!tierRes.ok) throw new Error(`Failed to load tier_map.csv: ${tierRes.status}`);

  const [bpText, tierText] = await Promise.all([bpRes.text(), tierRes.text()]);

  // Build tier map: code -> tier
  const tierRows = parseCSV(tierText);
  const tierHeader = (tierRows.shift() || []).map((h) => h.trim());
  const tIdx = Object.fromEntries(tierHeader.map((h, i) => [h, i])) as Record<string, number>;
  const tierMap = new Map<string, string>();
  tierRows.forEach((r) => {
    const code = (r[tIdx.code] ?? "").trim();
    const tier = (r[tIdx.tier] ?? "").trim();
    if (code) tierMap.set(code, tier);
  });

  // Parse base_products.csv
  const rows = parseCSV(bpText);
  const header = (rows.shift() || []).map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i])) as Record<string, number>;

  const toBool = (v: unknown) => String(v ?? "").trim().toLowerCase() === "true";
  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const items = rows
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .map((r) => {
      const code = (r[idx.code] ?? "").trim();
      const tierFromSource = (r[idx.tier] ?? "").trim();
      const tier = tierFromSource || tierMap.get(code) || ""; // fallback to tier_map
      return {
        code,
        brand: (r[idx.brand] ?? "").trim(),
        model_name: (r[idx.model_name] ?? "").trim(),
        label: (r[idx.label] ?? "").trim(),
        category: (r[idx.category] ?? "").trim(),
        tier,
        organic: toBool(r[idx.organic]),
        usa_made: toBool(r[idx.usa_made]),
        active: toBool(r[idx.active]),
        retail_price: toNum(r[idx.retail_price]),
        fit_notes: (r[idx.fit_notes] ?? "").trim(),
      } as BaseProduct;
    });

  return items;
}

/* -------- tiny CSV parser (quoted fields + CRLF) -------- */
function parseCSV(src: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        const next = src[i + 1];
        if (next === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // ignore
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) rows.push(row);
  return rows;
}
