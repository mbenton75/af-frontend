import React from "react";
import { loadBaseProducts } from "./loadBaseProducts";

type BaseProduct = {
  code: string; label: string; retail_price: number;
  category: string; tier: string; organic: boolean; usa_made: boolean; active: boolean;
};

export default function BaseProductsDebug() {
  const [rows, setRows] = React.useState<BaseProduct[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await loadBaseProducts();
        setRows(data as BaseProduct[]);
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
      <p style={{ marginTop: 4
