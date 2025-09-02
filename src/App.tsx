import { useEffect, useState } from "react";

/** Clipboard helper with newline + fallback */
async function robustCopy(text: string) {
  const payload = text.replace(/\r?\n/g, "\r\n"); // normalize for Windows
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

type Product = {
  sku: string;
  title: string;
  price: string;       // comes in as a formatted string from products.json
  description: string; // includes \n line breaks
};

/** Renders first line as a paragraph and the rest as bullets */
function Desc({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [first, ...bullets] = lines;

  return (
    <>
      {first && <p className="desc">{first}</p>}
      {bullets.length > 0 && (
        <ul className="features">
          {bullets.map((l, i) => (
            <li key={i}>{l.replace(/^-+\s*/, "")}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProductCard({
  p,
  onCopied,
}: {
  p: Product;
  onCopied: (text: string, label: string) => void;
}) {
  const [status, setStatus] = useState("");

  const notify = (label: string, ok: boolean) => {
    setStatus(ok ? `${label} copied ✔` : `Clipboard blocked — allow and try again`);
    setTimeout(() => setStatus(""), 1200);
  };

  const copy = async (label: string, text: string) => {
    const ok = await robustCopy(text);
    onCopied(text, label);
    notify(label, ok);
  };

  const copyAll = () => {
    const text = [p.title, `Price: ${p.price}`, `SKU: ${p.sku}`, "", p.description].join("\n");
    return copy("All fields", text);
  };

  return (
    <div className="card">
      <div className="row">
        <div>
          <div className="sku">SKU: <span>{p.sku}</span></div>
          <h3>{p.title}</h3>
          <div className="price">{p.price} <span className="muted">(incl. ship)</span></div>
        </div>
        <div className="status">{status}</div>
      </div>

      <Desc text={p.description} />

      <div className="btns">
        <button onClick={() => copy("Title", p.title)}>Copy Title</button>
        <button onClick={() => copy("Description", p.description)}>Copy Description</button>
        <button onClick={() => copy("SKU", p.sku)}>Copy SKU</button>
        <button className="primary" onClick={copyAll}>Copy All</button>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastCopied, setLastCopied] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/products.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Product[];
        setProducts(data);
        setError(null);
      } catch (e: any) {
        setError(`Could not load products.json (${e?.message ?? "unknown error"})`);
        setProducts([]);
      }
    })();
  }, []);

  return (
    <div className="wrap">
      <header>
        <div className="logo">AF</div>
        <div>
          <div className="title">ArtsyFartsy Catalog</div>
          <div className="subtitle">Copy-only MVP</div>
        </div>
      </header>

      <div style={{ border: "1px dashed #e5e7eb", padding: 12, borderRadius: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Last copied preview</div>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{lastCopied || "—"}</pre>
      </div>

      {error && (
        <div style={{ background: "#fff2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <main>
        {products.map((p) => (
          <ProductCard
            key={p.sku}
            p={p}
            onCopied={(text, label) => setLastCopied(`(${label})\n${text}`)}
          />
        ))}
      </main>
    </div>
  );
}
