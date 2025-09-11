// src/loadBaseProducts.js
// Fetch and parse /data/base_products.csv into JS objects (no libs)

export async function loadBaseProducts() {
  const res = await fetch("/data/base_products.csv", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load base_products.csv: ${res.status}`);
  const text = await res.text();

  const rows = parseCSV(text);
  const header = rows.shift() || [];
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const toBool = (v) => String(v).trim().toLowerCase() === "true";

  return rows
    .filter((r) => r && r.length && r.some((c) => String(c).trim() !== ""))
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
      retail_price: parseFloat(r[idx.retail_price]),
      fit_notes: r[idx.fit_notes],
    }));
}

// Minimal CSV parser with quoted fields + CRLF handling
function parseCSV(src) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        const next = src[i + 1];
        if (next === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") { field += c; } // ignore CR
    }
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) rows.push(row);
  return rows;
}
