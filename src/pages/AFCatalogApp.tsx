import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Copy, ClipboardList, Info, Search, Check } from "lucide-react";
import { motion } from "framer-motion";

/**
 * AF Copy-Only Catalog App – Frontend MVP
 * - Read-only UI (no typing into data fields; users only select and copy)
 * - Two entry flows: Wizard (Tier→Garment→Base→Edition→Design) and Design Search
 * - Copy buttons per field + Copy All
 * - Clean, minimal UI using Tailwind + shadcn/ui
 * - Sample in-memory data (replace with Excel/CSV-backed loader later)
 */

const PRODUCTS = [
  {
    id: "P1",
    productNumber: "#1",
    brand: "Bella + Canvas",
    model: "3001U",
    title: "Standard Unisex Tee — Like & Share",
    tier: "Core",
    base: "3001U",
    edition: "Light",
    price: 34.5,
    sku: "AF-TEE-3001U-LS-LIGHT",
    description: `A soft, everyday unisex tee that pairs with anything. Clean and comfy without the fuss.\n\n- 100% combed ring-spun cotton (heathers vary)\n- Midweight feel\n- Ribbed crew neck\n- Side-seamed construction\n- Preshrunk\n\nMade on demand to reduce waste — thanks for choosing small-batch.`,
    tags: ["SS Tee", "Core", "B+C"],
  },
  {
    id: "P4",
    productNumber: "#4",
    brand: "Stanley/Stella",
    model: "STTU169",
    title: "Organic Cotton Tee — Bauhaus Balance",
    tier: "Organic",
    base: "STTU169",
    edition: "Dark",
    price: 42.5,
    sku: "AF-TEE-STTU169-BAUHAUS-DARK",
    description: `Certified organic, structured just right. Designed for a crisp print and a premium hand feel.\n\n- 100% organic ring-spun cotton\n- Medium weight\n- Ribbed crew neck\n- Side-seamed\n- Preshrunk\n\nMade on demand to reduce waste — thanks for choosing small-batch.`,
    tags: ["SS Tee", "Organic", "Stanley/Stella"],
  },
  {
    id: "P2",
    productNumber: "#2",
    brand: "AS Colour",
    model: "5001T",
    title: "Premium Tee — Holy Rollers",
    tier: "Premium",
    base: "5001T",
    edition: "Light",
    price: 42.5,
    sku: "AF-TEE-5001T-HR-LIGHT",
    description: `A modern premium tee with a clean drape and substantial feel. Elevated basics for daily wear.\n\n- Midweight 100% combed cotton\n- Crew neck, ribbed collar\n- Shoulder-to-shoulder taping\n- Side-seamed\n- Preshrunk\n\nMade on demand to reduce waste — thanks for choosing small-batch.`,
    tags: ["SS Tee", "Premium", "AS Colour"],
  },
  {
    id: "W1",
    productNumber: "#31",
    brand: "AS Colour",
    model: "4062",
    title: "Women’s Crop Tee — Minimal Logo",
    tier: "Premium",
    base: "4062",
    edition: "Light",
    price: 39.5,
    sku: "AF-TEE-4062-W-CROP-LOGO",
    description: `A modern twist on the classic tee, this cropped style is cut for a relaxed silhouette with just the right amount of edge. Soft yet structured, it pairs effortlessly with high-waisted jeans, skirts, or joggers.\n\n- Midweight 100% combed cotton (heathers include viscose)\n- 5.3 oz/yd² (180 g/m²)\n- Relaxed fit, cropped length\n- Crew neck, ribbed collar\n- Dropped shoulders\n- Side-seamed\n- Preshrunk\n\nMade on demand to reduce waste — thanks for choosing small-batch.`,
    tags: ["Crop Tee", "Premium", "AS Colour"],
  },
];

const TIERS = [
  { value: "All", label: "All tiers" },
  { value: "Core", label: "Core" },
  { value: "Premium", label: "Premium" },
  { value: "Organic", label: "Organic" },
];

const BASES_BY_TIER: Record<string, string[]> = {
  All: ["3001U", "5001T", "STTU169", "4062"],
  Core: ["3001U"],
  Premium: ["5001T", "4062"],
  Organic: ["STTU169"],
};

function toPlainText(htmlOrText: string) {
  const doc = new DOMParser().parseFromString(htmlOrText, "text/html");
  return doc.body.textContent || htmlOrText;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

const priceStr = (n: number) => `$${n.toFixed(2)}`;

function buildCopyAll(p: Product): string {
  return [
    p.title,
    `Price: ${priceStr(p.price)}`,
    `SKU: ${p.sku}`,
    "",
    toPlainText(p.description),
  ].join("\n");
}

type Product = typeof PRODUCTS[number];

function ProductCard({ p }: { p: Product }) {
  const { toast } = useToast();

  const handleCopy = async (label: string, text: string) => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? "Copied" : "Couldn’t copy",
      description: ok ? `${label} sent to clipboard.` : `Select & copy manually.`,
      action: ok ? (
        <ToastAction altText="OK"><Check className="h-4 w-4" /></ToastAction>
      ) : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground">{p.productNumber} • {p.brand} {p.model}</div>
              <h3 className="text-lg font-semibold leading-snug mt-1">{p.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{p.tier}</Badge>
                {p.tags.map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm text-muted-foreground">SKU</div>
              <div className="font-mono text-sm">{p.sku}</div>
              <div className="mt-2 text-sm text-muted-foreground">Price</div>
              <div className="font-semibold">{priceStr(p.price)} <span className="text-xs text-muted-foreground">(incl. ship)</span></div>
            </div>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {p.description}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Button variant="secondary" className="justify-center" onClick={() => handleCopy("Title", p.title)}>
              <Copy className="mr-2 h-4 w-4" /> Copy Title
            </Button>
            <Button variant="secondary" className="justify-center" onClick={() => handleCopy("Description", toPlainText(p.description))}>
              <ClipboardList className="mr-2 h-4 w-4" /> Copy Description
            </Button>
            <Button variant="secondary" className="justify-center" onClick={() => handleCopy("SKU", p.sku)}>
              <Copy className="mr-2 h-4 w-4" /> Copy SKU
            </Button>
            <Button variant="secondary" className="justify-center" onClick={() => handleCopy("Title + Description", `${p.title}\n\n${toPlainText(p.description)}`)}>
              <Copy className="mr-2 h-4 w-4" /> Copy Both
            </Button>
            <Button className="justify-center" onClick={() => handleCopy("All fields", buildCopyAll(p))}>
              <Copy className="mr-2 h-4 w-4" /> Copy All
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WizardFlow() {
  const [tier, setTier] = useState<string>("All");
  const [base, setBase] = useState<string>("All");

  const bases = useMemo(() => {
    return ["All", ...(BASES_BY_TIER[tier] ?? [])];
  }, [tier]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => (tier === "All" || p.tier === tier) && (base === "All" || p.base === base));
  }, [tier, base]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">Tier</div>
          <Select value={tier} onValueChange={(v) => { setTier(v); setBase("All"); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Base (auto-restricted by tier)</div>
          <Select value={base} onValueChange={setBase}>
            <SelectTrigger>
              <SelectValue placeholder="Select base" />
            </SelectTrigger>
            <SelectContent>
              {bases.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => <ProductCard key={p.id} p={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4"/> No matches for this combination.</div>
      )}
    </div>
  );
}

function DesignSearch() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PRODUCTS.filter(p => {
      const byTier = tier === "All" || p.tier === tier;
      if (!byTier) return false;
      if (!needle) return true;
      const hay = `${p.title} ${p.brand} ${p.model} ${p.sku} ${p.tags.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q, tier]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-2">
          <div className="text-sm font-medium">Search designs / SKUs</div>
          <div className="relative">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type design name, SKU, brand, model…" className="pl-9" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Tier</div>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger>
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => <ProductCard key={p.id} p={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4"/> No results. Try a shorter query.</div>
      )}
    </div>
  );
}

export default function AFCatalogApp() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black/90 text-white grid place-items-center font-bold">AF</div>
            <div>
              <div className="font-semibold leading-tight">ArtsyFartsy Catalog</div>
              <div className="text-xs text-muted-foreground">Copy-only tool • Excel-driven (coming soon)</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">v0.1.0</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="wizard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wizard">Wizard</TabsTrigger>
            <TabsTrigger value="search">Design Search</TabsTrigger>
          </TabsList>
          <TabsContent value="wizard" className="mt-6">
            <WizardFlow />
          </TabsContent>
          <TabsContent value="search" className="mt-6">
            <DesignSearch />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
