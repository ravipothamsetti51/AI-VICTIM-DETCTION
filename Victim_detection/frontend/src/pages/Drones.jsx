import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Radio,
  Plus,
  Battery,
  BatteryCharging,
  BatteryWarning,
  MapPin,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  Power,
  Shield,
} from 'lucide-react';

const Drones = () => {
  const { isOperator, isAdmin } = useAuth();

  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Drone Form
  const [droneId, setDroneId] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('AeroScout Hexa-FLIR X4');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [lat, setLat] = useState('27.7172');
  const [lng, setLng] = useState('85.3240');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDrones = async () => {
    try {
      const res = await client.get('/drones');
      if (res.data.success) {
        setDrones(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load UAV fleet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrones();
    const interval = setInterval(fetchDrones, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status, battery) => {
    try {
      const payload = { status };
      if (battery !== undefined) payload.batteryLevel = battery;
      await client.patch(`/drones/${id}/status`, payload);
      fetchDrones();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCreateDrone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await client.post('/drones', {
        droneId: droneId.toUpperCase(),
        name,
        model,
        batteryLevel: Number(batteryLevel),
        currentLocation: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        status: 'idle',
      });

      if (res.data.success) {
        setShowAddModal(false);
        setDroneId('');
        setName('');
        fetchDrones();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to commission UAV');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="w-5 h-5" />
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-100">
              AUTONOMOUS UAV FLEET MANAGEMENT
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            REAL-TIME TELEMETRY, FLIGHT SENSORS & POWER HEALTH
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDrones}
            className="p-1.5 bg-[#121c2e] hover:bg-[#1a2a47] border border-slate-700 text-cyan-400 rounded transition"
            title="Refresh Fleet Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isOperator && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>COMMISSION UAV ASSET</span>
            </button>
          )}
        </div>
      </div>

      {/* Fleet Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs uppercase tracking-wider">CONNECTING TO UAV SATELLITE UPLINK...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drones.map((d) => (
            <div
              key={d._id}
              className={`tac-card rounded-lg p-5 border flex flex-col justify-between ${
                d.status === 'active'
                  ? 'border-cyan-500/40 bg-[#0a1324]'
                  : d.status === 'returning'
                  ? 'border-amber-500/40 bg-[#14120a]'
                  : d.status === 'offline'
                  ? 'border-red-500/40 bg-red-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3 border-b border-[#142038] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-cyan-300">{d.droneId}</span>
                      <span className="text-xs text-slate-400 font-sans">{d.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{d.model}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      d.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : d.status === 'returning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : d.status === 'offline'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {/* Battery Status Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      {d.batteryLevel <= 20 ? (
                        <BatteryWarning className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      ) : (
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>BATTERY STORAGE</span>
                    </span>
                    <span
                      className={`font-bold ${
                        d.batteryLevel <= 20 ? 'text-red-400 animate-pulse' : 'text-slate-100'
                      }`}
                    >
                      {d.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#090e1a] rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.batteryLevel <= 20
                          ? 'bg-red-500'
                          : d.batteryLevel <= 50
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${d.batteryLevel}%` }}
                    ></div>
                  </div>
                </div>

                {/* GPS Telemetry */}
                <div className="p-2.5 rounded bg-[#090f1d] border border-[#16253f] space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">LATITUDE:</span>
                    <span className="text-cyan-300">{d.currentLocation?.lat.toFixed(5)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">LONGITUDE:</span>
                    <span className="text-cyan-300">{d.currentLocation?.lng.toFixed(5)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ASSIGNED MISSION:</span>
                    <span className="text-amber-300 truncate max-w-[140px]">
                      {d.assignedMissionId?.title || 'None (Patrol Standby)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              {isOperator && (
                <div className="border-t border-[#142038] pt-3 mt-4 flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-500">COMMAND:</span>
                  <div className="flex gap-1">
                    {d.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(d._id, 'active')}
                        className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-200 rounded"
                      >
                        DEPLOY
                      </button>
                    )}
                    {d.status !== 'returning' && (
                      <button
                        onClick={() => updateStatus(d._id, 'returning')}
                        className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 text-amber-200 rounded"
                      >
                        RTH
                      </button>
                    )}
                    {d.status !== 'idle' && (
                      <button
                        onClick={() => updateStatus(d._id, 'idle')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                      >
                        STANDBY
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateStatus(
                          d._id,
                          d.status === 'offline' ? 'idle' : 'offline',
                          d.status === 'offline' ? 80 : 0
                        )
                      }
                      className="p-1 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 rounded"
                      title="Toggle Link Offline"
                    >
                      <Power className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Commission UAV Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0b1220] border border-cyan-500/40 rounded-lg shadow-2xl p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1b2b47] pb-3 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Radio className="w-4 h-4" />
                <span>COMMISSION NEW UAV DRONE ASSET</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-950/50 border border-red-500 text-red-300 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateDrone} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">CALLSIGN / DRONE ID</label>
                <input
                  type="text"
                  required
                  value={droneId}
                  onChange={(e) => setDroneId(e.target.value)}
                  placeholder="UAV-07"
                  className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">OPERATIONAL NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EagleEye Recon-7"
                  className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">UAV HARDWARE PLATFORM</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="AeroScout Hexa-FLIR X4">AeroScout Hexa-FLIR X4</option>
                  <option value="DJI Matrice 300 RTK SAR">DJI Matrice 300 RTK SAR</option>
                  <option value="Skydio X2D Autonomous AI">Skydio X2D Autonomous AI</option>
                  <option value="Autel EVO Max 4T Quad">Autel EVO Max 4T Quad</option>
                  <option value="Freefly Alta X Payload SAR">Freefly Alta X Payload SAR</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1b2b47]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded"
                >
                  {submitting ? 'COMMISSIONING...' : 'REGISTER UAV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drones;
