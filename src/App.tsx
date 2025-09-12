import LastUpdated from "./LastUpdated";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { loadBaseProducts, type BaseProduct } from "./loadBaseProducts";
import { loadProducts, type Product } from "./loadProducts";
import { loadDescriptions } from "./loadDescriptions";

// Human labels for the category codes in your CSV
const CATEGORY_LABEL: Record<string, string> = {
  short_tee: "Short Sleeve",
  long_tee: "Long Sleeve",
  hoodie: "Unisex Hoodie",
  crew: "Sweatshirt",
  tank: "Tank",
  crop: "Crop Tee",
};
const TIER_LABEL: Record<string, string> = {
  std: "Std",
  mid: "Mid",
  premium_non_org: "Premium",
  premium_org: "Premium +",
  heavy_top: "Mid",         // choose what you prefer for this one
  alt_mid_triblend: "Mid",  // fallback label
};

type FeatureCode = "organic" | "usa_made" | "triblend";

// --- NEW: normalizes description spacing ---
function tidy(text: string): string {
  return text
    .replace(/\r\n/g, "\n")     // normalize Windows line endings
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines → just 2
    .replace(/[ \t]+\n/g, "\n") // trim trailing spaces before newline
    .trim();
}

export default function App() {
  const [bases, setBases] = useState<BaseProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [features, setFeatures] = useState<Set<FeatureCode>>(new Set());

  // simple filter query for the grid
  const [filterText, setFilterText] = useState("");

  // Load CSVs + descriptions once
  useEffect(() => {
    (async () => {
      try {
        const [bp, pr, desc] = await Promise.all([
          loadBaseProducts(),
          loadProducts(),
          loadDescriptions(),
        ]);
        const activeBases = bp.filter((r) => r.active);
        setBases(activeBases);
        setProducts(pr.filter((p) => p.enabled));
        setDescriptions(desc || {});
        setCategory(activeBases[0]?.category ?? null);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Category chips
  const categories = useMemo(() => {
    const set = new Set<string>();
    bases.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [bases]);

  // Bases for selected category
  const basesForCategory = useMemo(
    () => bases.filter((r) => r.category === category),
    [bases, category]
  );

  // Keep a valid base selected when category changes
  useEffect(() => {
    if (!category) return;
    const first = bases.find((r) => r.category === category);
    if (first) setSelectedBase(first.code);
    setFeatures(new Set()); // reset feature toggles when switching type
    setFilterText(""); // also clear the grid filter
  }, [category, bases]);

  const base = useMemo(
    () => bases.find((r) => r.code === selectedBase) || null,
    [bases, selectedBase]
  );

  // Feature availability (drives chip disabled state)
  const canOrganic = basesForCategory.some((b) => b.organic);
  const canUSAMade = basesForCategory.some((b) => b.usa_made);
  const canTriblend =
    (category === "short_tee" || category === "tank") &&
    basesForCategory.some(
      (b) =>
        /triblend/i.test(b.label) ||
        /tri[- ]?blend/i.test(b.fit_notes ?? "") ||
        (b.tier as any) === "alt_mid_triblend"
    );

  function toggleFeature(code: FeatureCode, enabled: boolean) {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  // Products filtered by selected base
  const productsForBase = useMemo(
    () => products.filter((p) => p.base_code === selectedBase && p.enabled),
    [products, selectedBase]
  );

  // text filter applied to the base’s products
  const visibleProducts = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return productsForBase;
    return productsForBase.filter((p) =>
      [p.sku, p.title, p.color, p.size]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [productsForBase, filterText]);

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (error) return <p style={{ padding: 16, color: "#b00" }}>Error: {error}</p>;
  if (!category) return <p style={{ padding: 16 }}>No active base products found.</p>;

  // --- Use Shopify description (tidied) if available ---
  const rawDesc = base ? (descriptions[base.code] || "") : "";
  const descText = tidy(rawDesc);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>ArtsyFartsy — Product Uniformity</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Pick a garment type, choose a base, toggle special features, then copy.
      </p>

      <LastUpdated />

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

      {/* Special feature chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <Chip
          label="Organic"
          active={features.has("organic")}
          disabled={!canOrganic}
          onClick={() => canOrganic && toggleFeature("organic", !features.has("organic"))}
        />
        <Chip
          label="Made in USA"
          active={features.has("usa_made")}
          disabled={!canUSAMade}
          onClick={() => canUSAMade && toggleFeature("usa_made", !features.has("usa_made"))}
        />
        <Chip
          label="Triblend"
          active={features.has("triblend")}
          disabled={!canTriblend}
          onClick={() => canTriblend && toggleFeature("triblend", !features.has("triblend"))}
        />
      </div>
      {!canUSAMade && (
        <p style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
          “Made in USA” will auto-enable when a USA base exists for this type.
        </p>
      )}

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
            whiteSpace: "pre-line", // was "pre-wrap"; pre-line makes spacing feel tighter
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "#fafafa",
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          {base
            ? buildCopyBlock(base, features, descText || buildDescription(base))
            : "Select a base above to preview."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => base && copyToClipboard(descText || buildDescription(base))}
            style={primaryBtn}
            disabled={!base}
          >
            Copy description
          </button>
          <button
            onClick={() =>
              base && copyToClipboard(buildCopyBlock(base, features, descText || buildDescription(base)))
            }
            style={secondaryBtn}
            disabled={!base}
          >
            Copy all
          </button>
        </div>
      </div>

      {/* Image grid controls */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Current inventory (selected base)</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by color, size, or SKU…"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              width: 320,
            }}
          />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              style={{ ...secondaryBtn, padding: "6px 10px" }}
            >
              Clear
            </button>
          )}
          <span style={{ color: "#666", fontSize: 12 }}>
            {visibleProducts.length} matching
          </span>
        </div>

        {visibleProducts.length === 0 ? (
          <p style={{ color: "#777" }}>No products match your filter.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {visibleProducts.map((p) => (
              <figure
                key={p.sku}
                style={{
                  margin: 0,
                  border: "1px solid #e8e8e8",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={p.image_src}
                  alt={p.title}
                  loading="lazy"
                  width={600}
                  height={600}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/img/fallback.svg";
                  }}
                />
                <figcaption style={{ padding: 8, fontSize: 12, color: "#333" }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.sku}</div>
                  <div style={{ color: "#666" }}>{p.title}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: active ? "1px solid #111" : "1px solid #ddd",
        background: disabled ? "#f3f3f3" : active ? "#111" : "#fff",
        color: disabled ? "#999" : active ? "#fff" : "#111",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

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

function buildCopyBlock(
  b: BaseProduct,
  features: Set<FeatureCode>,
  body: string
): string {
  // Combine base's inherent flags with user-selected features
  const tags = new Set<string>([b.tier]);
  if (b.organic || features.has("organic")) tags.add("organic");
  if (b.usa_made || features.has("usa_made")) tags.add("usa_made");
  if (features.has("triblend")) tags.add("triblend");

  const header =
    `Base Product Name: ${b.label}\n` +
    `Base Product Code: ${b.code}\n` +
    `Retail Price: $${b.retail_price.toFixed(2)}\n` +
    `Tier: ${TIER_LABEL[b.tier] ?? b.tier}\n` +
    `Tags used: ${Array.from(tags).join(", ")}`;

  return `${header}\n\n${body}`;
}

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
  return `- ${b.fit_notes || "Comfortable everyday fit"}\n- Brand: ${b.brand} ${b.model_name}`;
}

/* button styles */
const primaryBtn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
const secondaryBtn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
};

