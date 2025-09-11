// src/loadProducts.ts
export type Product = {
  sku: string;
  base_code: string;
  title: string;
  color: string;
  size: string;
  image_src: string;
  enabled: boolean;
};

export async function loadProducts(): Promise<Product[]> {
  const res = await fetch("/data/products.csv", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load products.csv: ${res.status}`);
  const text = await res.text();

  const rows = parseCSV(text);
  const header = rows.shift() || [];
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i])) as Record<string, number>;

  const toBool = (v: unknown) => String(v ?? "").trim().toLowerCase() === "true";

  return rows
    .filter((r) => r && r.length && r.some((c) => String(c ?? "").trim() !== ""))
    .map((r) => ({
      sku: r[idx.sku],
      base_code: r[idx.base_code],
      title: r[idx.title],
      color: r[idx.color],
      size: r[idx.size],
      image_src: r[idx.image_src],
      enabled: toBool(r[idx.enabled]),
    })) as Product[];
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
