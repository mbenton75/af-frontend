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

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [rows]);

  const basesForCategory = useMemo(
    () => rows.filter((r) => r.category === category),
    [rows, category]
  );

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (error) return <p style={{ padding: 16, color: "#b00" }}>Error: {error}</p>;
  if (!category) return <p style={{ padding: 16 }}>No active base products found.</p>;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>
        ArtsyFartsy — Product Uniformity (Step 4)
      </h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Pick a garment type, then see the available base options from your CSV.
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
        <ul>
          {basesForCategory.map((b) => (
            <li key={b.code}>
              {b.label}
              {` — $${b.retail_price.toFixed(2)}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

