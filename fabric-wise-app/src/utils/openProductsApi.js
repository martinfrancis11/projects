import { fabrics } from '../data/fabrics';

// FabricIntel Lambda proxy — handles UPCitemdb + Open Products Facts server-side (no CORS issues)
const BARCODE_API = 'https://bw9pa5pj4j.execute-api.us-east-1.amazonaws.com/barcode';

/**
 * Scan all text fields of an API product for fiber keywords.
 * Returns array of matched fabric objects (deduplicated), ordered by specificity
 * (organic cotton matched before regular cotton).
 */
export function detectFabrics(productText) {
  if (!productText) return [];
  const lower = productText.toLowerCase();

  // Order matters: more specific entries first (organic-cotton before regular-cotton,
  // bamboo-viscose before viscose/regular)
  const ordered = [
    fabrics.find(f => f.id === 'organic-cotton'),
    fabrics.find(f => f.id === 'bamboo-viscose'),
    fabrics.find(f => f.id === 'tencel'),
    fabrics.find(f => f.id === 'hemp'),
    fabrics.find(f => f.id === 'regular-cotton'),
    fabrics.find(f => f.id === 'spandex'),
    fabrics.find(f => f.id === 'acrylic'),
    fabrics.find(f => f.id === 'nylon'),
    fabrics.find(f => f.id === 'polyester'),
  ];

  const matched = [];
  for (const fabric of ordered) {
    if (!fabric) continue;
    const hit = fabric.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (hit && !matched.find(m => m.id === fabric.id)) {
      matched.push(fabric);
    }
  }

  // Also match by ISO code (e.g. "PES", "CO", "PA") — only as standalone tokens
  for (const fabric of fabrics) {
    if (matched.find(m => m.id === fabric.id)) continue;
    const code = fabric.isoCode.toLowerCase();
    // Match ISO code as a word boundary to avoid false positives
    const regex = new RegExp(`\\b${code}\\b`);
    if (regex.test(lower)) {
      matched.push(fabric);
    }
  }

  return matched;
}


/**
 * Fetch a product by barcode via the FabricIntel Lambda proxy.
 * The proxy handles UPCitemdb + Open Products Facts server-side,
 * bypassing CORS restrictions.
 * Returns null if not found.
 */
export async function fetchProductByBarcode(barcode) {
  try {
    const res = await fetch(`${BARCODE_API}/${encodeURIComponent(barcode)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found) return null;

    const combinedText = data.combinedText || [data.name, data.brand, data.categories, data.materialsRaw].filter(Boolean).join(' ');
    return {
      ...data,
      combinedText,
      matchedFabrics: detectFabrics(combinedText),
    };
  } catch {
    return null;
  }
}
