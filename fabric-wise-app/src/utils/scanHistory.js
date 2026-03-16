import { getDeviceId } from './deviceId';

const API = 'https://bw9pa5pj4j.execute-api.us-east-1.amazonaws.com';

export async function saveScan(product) {
  const deviceId = getDeviceId();
  try {
    const res = await fetch(`${API}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        barcode:        product.barcode || '',
        name:           product.name    || '',
        brand:          product.brand   || '',
        source:         product.source  || '',
        imageUrl:       product.imageUrl || '',
        materialsRaw:   product.materialsRaw || '',
        matchedFabrics: (product.matchedFabrics || []).map(f => ({
          id:          f.id,
          name:        f.name,
          isoCode:     f.isoCode,
          healthScore: f.healthScore,
          category:    f.category,
        })),
      }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function loadScans() {
  const deviceId = getDeviceId();
  try {
    const res = await fetch(`${API}/scans?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.scans || [];
  } catch {
    return [];
  }
}

export async function deleteScan(scanId) {
  const deviceId = getDeviceId();
  try {
    const res = await fetch(
      `${API}/scans/${encodeURIComponent(scanId)}?deviceId=${encodeURIComponent(deviceId)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}
