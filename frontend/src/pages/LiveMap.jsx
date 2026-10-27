import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import client, { getImageUrl } from '../api/client';
import {
  MapPin,
  Radio,
  Flame,
  AlertCircle,
  CheckCircle2,
  Filter,
  Crosshair,
  Battery,
  ShieldCheck,
  RefreshCw,
  Eye,
} from 'lucide-react';

// Custom Leaflet DivIcons with Military HUD Styling
const createDroneIcon = (droneId, status, battery) => {
  const isAlert = battery <= 20;
  return L.divIcon({
    className: 'custom-drone-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(6, 182, 212, 0.2);
          border: 2px solid ${isAlert ? '#ef4444' : '#06b6d4'};
          display: flex; align-items: center; justify-content: center;
          color: ${isAlert ? '#ef4444' : '#22d3ee'};
          box-shadow: 0 0 12px ${isAlert ? 'rgba(239,68,68,0.6)' : 'rgba(6,182,212,0.6)'};
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
        <div style="
          margin-top: 2px; background: #070a12; border: 1px solid #1e293b;
          padding: 1px 4px; border-radius: 3px; font-family: monospace;
          font-size: 9px; font-weight: bold; color: #38bdf8; white-space: nowrap;
        ">
          ${droneId} [${battery}%]
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createVictimIcon = (status, count) => {
  let color = '#ef4444'; // unconfirmed
  let glow = 'rgba(239, 68, 68, 0.7)';
  let label = 'VICTIM';

  if (status === 'confirmed') {
    color = '#f59e0b';
    glow = 'rgba(245, 158, 11, 0.7)';
    label = 'CONFIRMED';
  } else if (status === 'rescued') {
    color = '#10b981';
    glow = 'rgba(16, 185, 129, 0.7)';
    label = 'RESCUED';
  } else if (status === 'false_positive') {
    color = '#64748b';
    glow = 'rgba(100, 116, 139, 0.4)';
    label = 'FALSE';
  }

  return L.divIcon({
    className: 'custom-victim-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="
          width: 26px; height: 26px; border-radius: 50%;
          background: ${color}22;
          border: 2px solid ${color};
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; font-weight: 900; font-family: monospace; font-size: 11px;
          box-shadow: 0 0 10px ${glow};
        ">
          ${count}
        </div>
        <div style="
          margin-top: 2px; background: #0b0f19; border: 1px solid ${color}66;
          padding: 1px 3px; border-radius: 2px; font-family: monospace;
          font-size: 8px; font-weight: bold; color: ${color}; white-space: nowrap;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Component to dynamically recenter map
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
}

const LiveMap = () => {
  const [drones, setDrones] = useState([]);
  const [missions, setMissions] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showDrones, setShowDrones] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Target for focus
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const fetchMapData = async () => {
    try {
      const [dRes, mRes, detRes] = await Promise.all([
        client.get('/drones'),
        client.get('/missions'),
        client.get('/detections?limit=100'),
      ]);

      if (dRes.data.success) setDrones(dRes.data.data);
      if (mRes.data.success) setMissions(mRes.data.data);
      if (detRes.data.success) setDetections(detRes.data.data);
    } catch (err) {
      console.error('Error loading map GIS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 8000);
    return () => clearInterval(interval);
  }, []);

  const updateDetectionStatus = async (id, status) => {
    try {
      const res = await client.patch(`/detections/${id}/status`, { status });
      if (res.data.success) {
        fetchMapData();
      }
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const filteredDetections = detections.filter((d) => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Map Control Bar */}
      <div className="tac-card rounded-lg p-3 border border-[#182642] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>GIS THEATER TACTICAL MAP</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-3 text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrones}
                onChange={(e) => setShowDrones(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>UAVs ({drones.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showMissions}
                onChange={(e) => setShowMissions(e.target.checked)}
                className="accent-amber-400"
              />
              <span>Disaster Zones ({missions.length})</span>
            </label>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">VICTIM FILTER:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090f1d] border border-[#223658] text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Detections ({detections.length})</option>
            <option value="unconfirmed">Unconfirmed Only</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="rescued">Rescued Only</option>
          </select>

          <button
            onClick={fetchMapData}
            className="p-1.5 bg-[#121c2e] hover:bg-[#1a2a47] border border-slate-700 text-cyan-400 rounded transition"
            title="Refresh GIS Feeds"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas and Sidebar Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[72vh]">
        {/* Leaflet Map Canvas (3 Columns) */}
        <div className="lg:col-span-3 h-full rounded-lg overflow-hidden border border-[#182642] relative bg-[#070a12]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapCenterController center={mapCenter} zoom={mapZoom} />

            {/* Satellite / Dark Tactical Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {/* Mission Epicenters Circles */}
            {showMissions &&
              missions.map((mission) => {
                if (!mission.location?.lat || !mission.location?.lng) return null;
                const isOngoing = mission.status === 'active';
                return (
                  <React.Fragment key={mission._id}>
                    <Circle
                      center={[mission.location.lat, mission.location.lng]}
                      radius={isOngoing ? 1400 : 800}
                      pathOptions={{
                        color: isOngoing ? '#f59e0b' : '#3b82f6',
                        fillColor: isOngoing ? '#f59e0b' : '#3b82f6',
                        fillOpacity: 0.12,
                        weight: 1.5,
                        dashArray: isOngoing ? '6, 6' : undefined,
                      }}
                    />
                    <Marker
                      position={[mission.location.lat, mission.location.lng]}
                      icon={L.divIcon({
                        className: 'mission-marker',
                        html: `
                          <div style="
                            background: #0f172a; border: 2px solid ${isOngoing ? '#f59e0b' : '#3b82f6'};
                            color: #f8fafc; font-family: monospace; font-size: 10px; font-weight: bold;
                            padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
                            transform: translate(-50%, -50%); white-space: nowrap;
                          ">
                            ★ [ZONE] ${mission.title.substring(0, 22)}...
                          </div>
                        `,
                      })}
                    >
                      <Popup>
                        <div className="font-mono text-xs space-y-1.5 p-1 text-slate-100">
                          <div className="font-bold text-amber-400 text-sm">{mission.title}</div>
                          <div className="text-slate-300 text-[11px]">{mission.location.address}</div>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                              {mission.disasterType}
                            </span>
                            <span className="text-slate-400 uppercase">STATUS: {mission.status}</span>
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            COORDINATES: {mission.location.lat.toFixed(5)}, {mission.location.lng.toFixed(5)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

            {/* Drone Fleet Markers */}
            {showDrones &&
              drones.map((drone) => {
                if (!drone.currentLocation?.lat || !drone.currentLocation?.lng) return null;
                return (
                  <Marker
                    key={drone._id}
                    position={[drone.currentLocation.lat, drone.currentLocation.lng]}
                    icon={createDroneIcon(drone.droneId, drone.status, drone.batteryLevel)}
                    eventHandlers={{
                      click: () => setSelectedEntity({ type: 'drone', data: drone }),
                    }}
                  >
                    <Popup>
                      <div className="font-mono text-xs space-y-2 p-1">
                        <div className="font-bold text-cyan-400 text-sm flex items-center justify-between">
                          <span>{drone.droneId}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                            drone.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {drone.status}
                          </span>
                        </div>
                        <div className="text-slate-300">{drone.name}</div>
                        <div className="text-slate-400 text-[11px]">MODEL: {drone.model}</div>
                        <div className="text-slate-400 text-[11px] flex items-center justify-between">
                          <span>BATTERY:</span>
                          <span className={drone.batteryLevel <= 20 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {drone.batteryLevel}%
                          </span>
                        </div>
                        <div className="text-cyan-300 text-[10px]">
                          LAT: {drone.currentLocation.lat.toFixed(5)} | LNG: {drone.currentLocation.lng.toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Victim Detection Pins */}
            {filteredDetections.map((detection) => {
              if (!detection.gpsLocation?.lat || !detection.gpsLocation?.lng) return null;
              return (
                <Marker
                  key={detection._id}
                  position={[detection.gpsLocation.lat, detection.gpsLocation.lng]}
                  icon={createVictimIcon(detection.status, detection.victimCount)}
                  eventHandlers={{
                    click: () => setSelectedEntity({ type: 'detection', data: detection }),
                  }}
                >
                  <Popup>
                    <div className="font-mono text-xs space-y-2 p-1 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className="font-bold text-red-400">
                          {detection.victimCount} VICTIM(S) IDENTIFIED
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                          {detection.status}
                        </span>
                      </div>

                      {detection.processedImageUrl && (
                        <div className="border border-slate-700 rounded overflow-hidden">
                          <img
                            src={getImageUrl(detection.processedImageUrl)}
                            alt="Recon"
                            className="h-28 w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>RECON ASSET: {detection.droneId}</div>
                        <div>
                          GPS: {detection.gpsLocation.lat.toFixed(5)}, {detection.gpsLocation.lng.toFixed(5)}
                        </div>
                        <div>TIME: {new Date(detection.detectedAt).toLocaleTimeString()}</div>
                      </div>

                      {/* Triage Actions */}
                      <div className="pt-1 flex gap-1 text-[10px]">
                        {detection.status !== 'confirmed' && (
                          <button
                            onClick={() => updateDetectionStatus(detection._id, 'confirmed')}
                            className="flex-1 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold"
                          >
                            CONFIRM
                          </button>
                        )}
                        {detection.status !== 'rescued' && (
                          <button
                            onClick={() => updateDetectionStatus(detection._id, 'rescued')}
                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                          >
                            RESCUED
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Tactical Right Sidebar: Live Targets & Entity Telemetry */}
        <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#182642] pb-2 mb-3">
            <span className="font-bold text-slate-200 text-xs tracking-wider">
              TACTICAL TARGET REGISTRY
            </span>
            <span className="text-[10px] text-cyan-400">
              {filteredDetections.length} PINS ACTIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredDetections.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">NO DETECTIONS IN ACTIVE VIEW</p>
            ) : (
              filteredDetections.map((d) => (
                <div
                  key={d._id}
                  onClick={() => {
                    setMapCenter([d.gpsLocation.lat, d.gpsLocation.lng]);
                    setMapZoom(16);
                    setSelectedEntity({ type: 'detection', data: d });
                  }}
                  className={`p-2.5 rounded border cursor-pointer transition text-xs ${
                    selectedEntity?.data?._id === d._id
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-900/30'
                      : 'bg-[#0b1220] border-[#182744] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-400">
                      {d.victimCount} Victim(s) Detected
                    </span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${
                      d.status === 'unconfirmed' ? 'bg-red-500/20 text-red-300' : d.status === 'confirmed' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>UAV: {d.droneId}</span>
                    <span className="text-cyan-300">
                      {d.gpsLocation.lat.toFixed(4)}, {d.gpsLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Recenter Buttons */}
          <div className="pt-3 border-t border-[#182642] mt-auto">
            <span className="text-[10px] text-slate-400 block mb-1">THEATER HOTSPOTS:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                onClick={() => {
                  setMapCenter([27.7172, 85.3240]);
                  setMapZoom(14);
                }}
                className="p-1 bg-[#101b30] hover:bg-[#192b4d] border border-slate-700 text-cyan-300 rounded"
              >
                Sector 4 Quake
              </button>
              <button
                onClick={() => {
                  setMapCenter([27.7010, 85.3415]);
                  setMapZoom(14);
                }}
                className="p-1 bg-[#101b30] hover:bg-[#192b4d] border border-slate-700 text-cyan-300 rounded"
              >
                River Flash Flood
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
