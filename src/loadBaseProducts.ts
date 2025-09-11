// src/loadBaseProducts.ts
export type BaseProduct = {
  code: string;
  brand: string;
  model_name: string;
  label: string;
  category: string;
  tier: string;
  organic: boolean;
  usa_made: boolean;
  active: boolean;
  retail_price: number;
  fit_notes: string;
};

export async function loadBaseProducts(): Promise<BaseProduct[]> {
  const res = await fetch("/data/base_products.csv", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load base_products.csv: ${res.status}`);
  const text = await res.text();

  const rows = parseCSV(text);
  const header = rows.shift() || [];
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i])) as Record<string, number>;

  const toBool = (v: unknown) => String(v ?? "").trim().toLowerCase() === "true";
  const toNum = (v: unknown) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : 0;
  };

  return rows
    .filter(r => r && r.length && r.some(c => String(c ?? "").trim() !== ""))
    .map((r) => ({
      code: r[idx.code],
      brand: r[idx.brand],
      model_name: r[idx.model_name],
      label: r[idx.label],
      category: r[idx.category],
      tier: r[idx.tier],
      organic: toBool(r[idx.organic]),
      usa_made: toBool(r[idx.usa_made]),
      active: toBool(r[idx.active]),
      retail_price: toNum(r[idx.retail_price]),
      fit_notes: r[idx.fit_notes],
    })) as BaseProduct[];
}

// Minimal CSV parser with quoted-field + CRLF handling
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
        if (next === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore CR */ }
      else { field += c; }
    }
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) rows.push(row);
  return rows;
}
