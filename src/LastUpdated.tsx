import React from "react";

export default function LastUpdated() {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    fetch("/data/meta.json", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const iso = j?.last_updated;
        if (iso) {
          const d = new Date(iso);
          setText(`Last updated: ${d.toLocaleString()}`);
        }
      })
      .catch(() => {});
  }, []);

  if (!text) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        padding: "4px 8px",
        fontSize: 12,
        background: "white",
        borderRadius: 6,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        opacity: 0.8,
        zIndex: 50,
      }}
    >
      {text}
    </div>
  );
}
