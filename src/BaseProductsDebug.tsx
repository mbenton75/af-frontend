import React from "react";
import { loadBaseProducts, type BaseProduct } from "./loadBaseProducts";

export default function BaseProductsDebug(): JSX.Element {
  const [rows, setRows] = React.useState<BaseProduct[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await loadBaseProducts();
        setRows(data);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ padding: 12 }}>Loading base products…</p>;
  if (error) return <p style={{ padding: 12, color: "#b00" }}>Error: {error}</p>;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2 style={{ margin: 0 }}>Base Products (debug)</h2>
      <p style={{ marginTop: 4 }}>
        Loaded: <strong>{rows.length}</strong>
      </p>
      <ul>
        {rows.map((b) => (
          <li key={b.code}>
            {b.label}
            {` — $${(b.retail_price ?? 0).toFixed(2)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
