import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { msmeApi, bdspApi, settingsApi } from '../../lib/api';
import { Map as MapIcon, Layers, Filter, Building2, Users2 } from 'lucide-react';
import { Link } from 'wouter';

declare global {
  interface Window { L: any; }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const msmeLayerRef = useRef<any>(null);
  const bdspLayerRef = useRef<any>(null);

  const [showMSMEs, setShowMSMEs] = useState(true);
  const [showBDSPs, setShowBDSPs] = useState(true);
  const [filters, setFilters] = useState({ countyId: '', msmeCategory: '' });
  const [selectedCount, setSelectedCount] = useState<{ msmes: number; bdsps: number }>({ msmes: 0, bdsps: 0 });

  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: msmeMapData } = useQuery({ queryKey: ['msme-map', filters], queryFn: () => msmeApi.mapData(filters).then(r => r.data.data) });
  const { data: bdspMapData } = useQuery({ queryKey: ['bdsp-map'], queryFn: () => bdspApi.mapData().then(r => r.data.data) });

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      await import('leaflet').then((L) => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
          center: [6.428055, -9.429499], // Liberia center
          zoom: 7,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        // Add Liberia country outline hint
        map.setMaxBounds([[4.0, -12.0], [8.8, -7.3]]);

        mapInstance.current = map;
      });
    };

    loadLeaflet();
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  // Update MSME markers
  useEffect(() => {
    if (!mapInstance.current || !msmeMapData) return;
    import('leaflet').then(L => {
      if (msmeLayerRef.current) msmeLayerRef.current.remove();
      if (!showMSMEs) return;

      const markers: any[] = [];
      msmeMapData.forEach((msme: any) => {
        if (!msme.gpsLatitude || !msme.gpsLongitude) return;
        const color = msme.msmeCategory === 'MICRO' ? '#6b7280' : msme.msmeCategory === 'SMALL' ? '#2563eb' : '#7c3aed';
        const marker = L.circleMarker([msme.gpsLatitude, msme.gpsLongitude], {
          radius: 7,
          fillColor: color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        }).bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px">
            <strong style="font-size:13px">${msme.businessName}</strong>
            <div style="margin-top:4px;font-size:11px;color:#6b7280">${msme.county?.name || ''} County</div>
            <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
              <span style="background:${color};color:#fff;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600">${msme.msmeCategory}</span>
              ${msme.isYouthLed ? '<span style="background:#d97706;color:#fff;padding:2px 8px;border-radius:9999px;font-size:10px">Youth</span>' : ''}
              ${msme.isWomenLed ? '<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:9999px;font-size:10px">Women</span>' : ''}
            </div>
            <a href="/msmes/${msme.id}" style="display:block;margin-top:8px;color:#1e3a5f;font-size:11px;font-weight:600">View Profile →</a>
          </div>
        `);
        markers.push(marker);
      });

      msmeLayerRef.current = L.layerGroup(markers).addTo(mapInstance.current);
      setSelectedCount(prev => ({ ...prev, msmes: markers.length }));
    });
  }, [msmeMapData, showMSMEs]);

  // Update BDSP markers
  useEffect(() => {
    if (!mapInstance.current || !bdspMapData) return;
    import('leaflet').then(L => {
      if (bdspLayerRef.current) bdspLayerRef.current.remove();
      if (!showBDSPs) return;

      const markers: any[] = [];
      bdspMapData.forEach((bdsp: any) => {
        if (!bdsp.gpsLatitude || !bdsp.gpsLongitude) return;
        const marker = L.marker([bdsp.gpsLatitude, bdsp.gpsLongitude], {
          icon: L.divIcon({
            className: '',
            html: `<div style="width:24px;height:24px;background:#0369a1;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <strong style="font-size:13px">${bdsp.providerName}</strong>
            <div style="margin-top:4px;font-size:11px;color:#6b7280">${bdsp.county?.name || ''} County</div>
            <span style="background:#0369a1;color:#fff;padding:2px 8px;border-radius:9999px;font-size:10px;display:inline-block;margin-top:6px">${bdsp.providerType?.replace(/_/g,' ')}</span>
            <a href="/bdsps/${bdsp.id}" style="display:block;margin-top:8px;color:#1e3a5f;font-size:11px;font-weight:600">View Profile →</a>
          </div>
        `);
        markers.push(marker);
      });

      bdspLayerRef.current = L.layerGroup(markers).addTo(mapInstance.current);
      setSelectedCount(prev => ({ ...prev, bdsps: markers.length }));
    });
  }, [bdspMapData, showBDSPs]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><MapIcon size={22} className="text-primary-600" />GIS Map</h1>
          <p className="page-subtitle">Geographic visualization of MSMEs and BDSPs across Liberia</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Layer toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showMSMEs} onChange={e => setShowMSMEs(e.target.checked)} className="rounded" />
              <span className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={14} className="text-primary-600" />MSMEs <span className="chip chip-blue">{selectedCount.msmes}</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showBDSPs} onChange={e => setShowBDSPs(e.target.checked)} className="rounded" />
              <span className="flex items-center gap-1.5 text-sm font-medium"><Users2 size={14} className="text-info-600" />BDSPs <span className="chip chip-blue">{selectedCount.bdsps}</span></span>
            </label>
          </div>

          <div className="flex gap-3 flex-wrap items-center ml-auto">
            <select className="form-input text-sm" style={{ width: 160 }} value={filters.countyId} onChange={e => setFilters(f => ({ ...f, countyId: e.target.value }))}>
              <option value="">All Counties</option>
              {(counties || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-input text-sm" style={{ width: 140 }} value={filters.msmeCategory} onChange={e => setFilters(f => ({ ...f, msmeCategory: e.target.value }))}>
              <option value="">All Categories</option>
              <option value="MICRO">Micro</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Legend */}
      <div className="card mt-4 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Map Legend</p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-medium mb-1.5">MSME Category</p>
            <div className="flex gap-3">
              {[['Micro', '#6b7280'], ['Small', '#2563eb'], ['Medium', '#7c3aed']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full border border-white" style={{ background: color, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-1.5">Service Providers</p>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-info-600">
                <span className="text-white text-xs">👥</span>
              </div>
              <span>BDSP (Blue icon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
