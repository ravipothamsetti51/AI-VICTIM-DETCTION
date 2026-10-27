import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Plus,
  Radio,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  X,
  AlertTriangle,
  Layers,
} from 'lucide-react';

const Missions = () => {
  const { user, isOperator, isAdmin } = useAuth();

  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [disasterFilter, setDisasterFilter] = useState('');

  // Create Mission Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [disasterType, setDisasterType] = useState('earthquake');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('27.7172');
  const [lng, setLng] = useState('85.3240');
  const [assignedDroneIds, setAssignedDroneIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchMissions = async () => {
    try {
      let url = '/missions?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (disasterFilter) url += `&disasterType=${disasterFilter}`;

      const [mRes, dRes] = await Promise.all([
        client.get(url),
        client.get('/drones'),
      ]);

      if (mRes.data.success) setMissions(mRes.data.data);
      if (dRes.data.success) setDrones(dRes.data.data);
    } catch (err) {
      console.error('Failed to load missions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [statusFilter, disasterFilter]);

  const handleStatusChange = async (missionId, newStatus) => {
    try {
      await client.patch(`/missions/${missionId}/status`, { status: newStatus });
      fetchMissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update mission status');
    }
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      const res = await client.post('/missions', {
        title,
        disasterType,
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          address: address || 'Disaster Sector',
        },
        assignedDrones: assignedDroneIds,
        status: 'planning',
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setTitle('');
        setAddress('');
        setAssignedDroneIds([]);
        fetchMissions();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error commissioning mission');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDroneAssignment = (droneId) => {
    if (assignedDroneIds.includes(droneId)) {
      setAssignedDroneIds(assignedDroneIds.filter((id) => id !== droneId));
    } else {
      setAssignedDroneIds([...assignedDroneIds, droneId]);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Bar */}
      <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400">
            <Flame className="w-5 h-5" />
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-100">
              DISASTER RESPONSE OPERATIONS
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            TACTICAL INCIDENT MANAGEMENT & MULTI-UAV FLEET ASSIGNMENT
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090f1d] border border-[#223658] text-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Operational States</option>
            <option value="planning">Planning Phase</option>
            <option value="active">Active Operations</option>
            <option value="completed">Completed</option>
            <option value="aborted">Aborted</option>
          </select>

          {/* Create Button (Restricted to Admin / Operator) */}
          {isOperator ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>COMMISSION NEW MISSION</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              ROLE: RESCUER (READ-ONLY ACCESS)
            </div>
          )}
        </div>
      </div>

      {/* Missions Grid */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs uppercase tracking-wider">RETRIEVING DISASTER THEATER LOGS...</p>
        </div>
      ) : missions.length === 0 ? (
        <div className="tac-card rounded-lg p-12 text-center text-slate-500">
          <p className="text-sm">NO ACTIVE OR PLANNED MISSIONS FOUND</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m) => (
            <div
              key={m._id}
              className={`tac-card rounded-lg p-5 border transition flex flex-col justify-between ${
                m.status === 'active'
                  ? 'border-amber-500/40 bg-[#0d1628]'
                  : m.status === 'completed'
                  ? 'border-emerald-500/30'
                  : m.status === 'aborted'
                  ? 'border-red-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#16253f] text-cyan-300 border border-[#21375d]">
                      {m.disasterType}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
                      {m.title}
                    </h2>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      m.status === 'active'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : m.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : m.status === 'aborted'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 my-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{m.location?.address || 'Target Sector'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5">
                    COORDINATES: {m.location?.lat.toFixed(5)}, {m.location?.lng.toFixed(5)}
                  </div>
                </div>

                {/* Assigned Drone Assets */}
                <div className="border-t border-[#142038] pt-3 mt-3">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1.5">
                    ASSIGNED UAV FLEET ({m.assignedDrones?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.assignedDrones?.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No drones deployed</span>
                    ) : (
                      m.assignedDrones.map((d) => (
                        <span
                          key={d._id || d}
                          className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center gap-1"
                        >
                          <Radio className="w-2.5 h-2.5" />
                          <span>{d.droneId || d.name || 'UAV Asset'}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Status Action Controls */}
              {isOperator && (
                <div className="border-t border-[#142038] pt-3 mt-4 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 uppercase">UPDATE PHASE:</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {m.status === 'planning' && (
                      <button
                        onClick={() => handleStatusChange(m._id, 'active')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>ACTIVATE</span>
                      </button>
                    )}
                    {m.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(m._id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>COMPLETE</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(m._id, 'aborted')}
                          className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 rounded flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>ABORT</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Commission Mission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#0b1220] border border-amber-500/40 rounded-lg shadow-2xl p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1b2b47] pb-3 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Flame className="w-4 h-4" />
                <span>COMMISSION NEW DISASTER OPERATION</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-2.5 bg-red-950/50 border border-red-500 text-red-300 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMission} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">MISSION TITLE / CODENAME</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Operation Highland Reach - Sector 7 Collapse"
                  className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">DISASTER CLASSIFICATION</label>
                  <select
                    value={disasterType}
                    onChange={(e) => setDisasterType(e.target.value)}
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="earthquake">Earthquake (Seismic)</option>
                    <option value="flood">Flash Flood / Tsunami</option>
                    <option value="structural_collapse">Structural Collapse</option>
                    <option value="wildfire">Wildfire / Inferno</option>
                    <option value="landslide">Landslide / Mudflow</option>
                    <option value="other">Other Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">THEATER SECTOR / ADDRESS</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Kathmandu District, Grid 9B"
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CENTER LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CENTER LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#080d19] border border-[#213556] rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Drone Fleet Multi-Assign */}
              <div>
                <label className="block text-slate-400 mb-1.5">ASSIGN UAV ASSETS</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-[#080d19] rounded border border-[#213556]">
                  {drones.map((d) => {
                    const isSelected = assignedDroneIds.includes(d._id);
                    return (
                      <div
                        key={d._id}
                        onClick={() => toggleDroneAssignment(d._id)}
                        className={`p-2 rounded border cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300'
                            : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{d.droneId}</div>
                          <div className="text-[10px] text-slate-400">{d.name}</div>
                        </div>
                        <span className="text-[10px]">{d.batteryLevel}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1b2b47]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded"
                >
                  {submitting ? 'COMMISSIONING...' : 'AUTHORIZE MISSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Missions;
