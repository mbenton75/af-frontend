import { useEffect, useMemo, useState } from "react";
import { loadBaseProducts, type BaseProduct } from "./loadBaseProducts";

// Human labels for the category codes in your CSV
const CATEGORY_LABEL: Record<string, string> = {
  short_tee: "Short Sleeve",
  long_tee: "Long Sleeve",
  hoodie: "Unisex Hoodie",
  crew: "Sweatshirt",
  tank: "Tank",
  crop: "Crop Tee",
};

export default function App() {
  const [rows, setRows] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);

  // Load CSV once
  useEffect(() => {
    (async () => {
      try {
        const data = await loadBaseProducts();
        const active = data.filter((r) => r.active);
        setRows(active);
        setCategory(active[0]?.category ?? null);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // All categories present in CSV (for the chips)
  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [rows]);

  // Bases for the currently selected category
  const basesForCategory = useMemo(
    () => rows.filter((r) => r.category === category),
    [rows, category]
  );

  // Keep a valid base selected when category changes
  useEffect(() => {
    if (!category) return;
    const first = rows.find((r) => r.category === category);
    if (first) setSelectedBase(first.code);
  }, [category, rows]);

  const base = useMemo(
    () => rows.find((r) => r.code === selectedBase) || null,
    [rows, selectedBase]
  );

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (error) return <p style={{ padding: 16, color: "#b00" }}>Error: {error}</p>;
  if (!category) return <p style={{ padding: 16 }}>No active base products found.</p>;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>
        ArtsyFartsy — Product Uniformity (Step 5)
      </h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Pick a garment type, choose a base, then copy the formatted description.
      </p>

      {/* Type of garment chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {categories.map((c) => {
          const active = c === category;
          const label = CATEGORY_LABEL[c] ?? c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: active ? "1px solid #111" : "1px solid #ddd",
                background: active ? "#111" : "#fff",
                color: active ? "#fff" : "#111",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Base options for selected type */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>
          Base options for <em>{CATEGORY_LABEL[category] ?? category}</em>
        </h2>
        <div style={{ display: "grid", gap: 8 }}>
          {basesForCategory.map((b) => {
            const active = b.code === selectedBase;
            return (
              <button
                key={b.code}
                onClick={() => setSelectedBase(b.code)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: active ? "1.5px solid #111" : "1px solid #ddd",
                  background: active ? "#f5f5f5" : "#fff",
                  cursor: "pointer",
                }}
              >
                {b.label}
                {` — $${b.retail_price.toFixed(2)}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Copy block */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Copy block (read-only)</h2>
        <div
          style={{
            whiteSpace: "pre-wrap",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "#fafafa",
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {base ? buildCopyBlock(base) : "Select a base above to preview."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => base && copyToClipboard(buildDescription(base))}
            style={primaryBtn}
            disabled={!base}
          >
            Copy description
          </button>
          <button
            onClick={() => base && copyToClipboard(buildCopyBlock(base))}
            style={secondaryBtn}
            disabled={!base}
          >
            Copy all
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function copyToClipboard(text: string) {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  } else {
    legacyCopy(text);
  }
}
function legacyCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function buildCopyBlock(b: BaseProduct): string {
  const header =
    `Base Product Name: ${b.label}\n` +
    `Base Product Code: ${b.code}\n` +
    `Retail Price: $${b.retail_price.toFixed(2)}\n` +
    `Tags used: ${[
      b.tier,
      b.organic ? "organic" : null,
      b.usa_made ? "usa_made" : null,
    ]
      .filter(Boolean)
      .join(", ")}`;

  return `${header}\n\n${buildDescription(b)}`;
}

// Small, safe description. We can swap in richer per-base text later.
function buildDescription(b: BaseProduct): string {
  if (b.code === "AS4062") {
    return (
      "A modern cropped tee with a relaxed silhouette that pairs easily with high-waisted bottoms.\n" +
      "- Midweight combed cotton (heathers may vary)\n" +
      "- Relaxed fit, cropped length\n" +
      "- Ribbed crew neck, side-seamed\n" +
      "- Preshrunk to minimize shrinkage"
    );
  }
  // Generic fallback using your CSV fields
  return `- ${b.fit_notes || "Comfortable everyday fit"}\n- Brand: ${b.brand} ${b.model_name}`;
}

/* button styles */
const primaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
};
