export type Descriptions = Record<string, string>;

export async function loadDescriptions(): Promise<Descriptions> {
  try {
    const res = await fetch("/data/descriptions.json", { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as Descriptions;
  } catch {
    return {};
  }
}
