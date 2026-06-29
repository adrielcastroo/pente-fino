import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

interface CityAgg {
  cidade: string;
  total: number;
}

interface MarkerData extends CityAgg {
  lat: number;
  lng: number;
}

const CACHE_KEY = 'expedicao.geocodeCache.v1';

function loadCache(): Record<string, { lat: number; lng: number } | null> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, { lat: number; lng: number } | null>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

async function geocode(cidade: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${cidade}, Brasil`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = data[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}

export function EntregasMap({ cidades }: { cidades: CityAgg[] }) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  const targets = useMemo(
    () => cidades.filter((c) => c.cidade && c.cidade !== '(sem cadastro)').slice(0, 30),
    [cidades],
  );

  useEffect(() => {
    let cancelled = false;
    const cache = loadCache();

    const run = async () => {
      setLoading(true);
      const out: MarkerData[] = [];
      for (const c of targets) {
        const key = c.cidade.toLowerCase();
        let coord = cache[key];
        if (coord === undefined) {
          try {
            coord = await geocode(c.cidade);
          } catch {
            coord = null;
          }
          cache[key] = coord;
          saveCache(cache);
          // Nominatim free tier: 1 req/s
          await new Promise((r) => setTimeout(r, 1100));
        }
        if (coord) out.push({ ...c, ...coord });
        if (cancelled) return;
        setMarkers([...out]);
      }
      if (!cancelled) setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [targets]);

  const maxTotal = Math.max(1, ...markers.map((m) => m.total));

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={[-15.78, -47.93]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: 'hsl(var(--muted))' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <CircleMarker
            key={m.cidade}
            center={[m.lat, m.lng]}
            radius={6 + (m.total / maxTotal) * 18}
            pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.55, weight: 1 }}
          >
            <Tooltip direction="top">
              <span className="font-medium">{m.cidade}</span> · {m.total} picking{m.total > 1 ? 's' : ''}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {loading && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-md bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <Loader2 className="size-3 animate-spin" /> Geocodificando cidades…
        </div>
      )}
    </div>
  );
}
