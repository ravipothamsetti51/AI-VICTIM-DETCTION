import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
  Activity,
  Radio,
  Flame,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  BatteryCharging,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const Dashboard = ({ onOpenUpload }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchStats = async () => {
    try {
      const res = await client.get('/stats');
      if (res.data.success) {
        setStats(res.data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (id) => {
    try {
      await client.patch(`/alerts/${id}/read`);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center font-mono text-cyan-400">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="tracking-widest uppercase text-xs">SYNCHRONIZING THEATER TELEMETRY...</p>
      </div>
    );
  }

  const s = stats?.summary || {};
  const timeline = stats?.timeline || [];
  const statusData = stats?.detectionStatusBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a101d] p-4 rounded-lg border border-[#182642] font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            <h1 className="text-lg font-black text-slate-100 tracking-wider uppercase">
              THEATER OPERATIONS OVERVIEW
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            REAL-TIME DRONE AERIAL SURVEILLANCE & AI CASUALTY IDENTIFICATION
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden sm:inline">
            UPDATED: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121d33] hover:bg-[#1b2c4d] border border-[#243960] text-cyan-300 rounded transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SYNC DATA</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded transition shadow-lg shadow-cyan-500/20"
          >
            <span>LAUNCH RECON UPLOAD</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Matrix Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Missions */}
        <div className="tac-card rounded-lg p-4 font-mono relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 uppercase tracking-wider">ACTIVE MISSIONS</span>
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{s.activeMissions || 0}</span>
            <span className="text-xs text-slate-500">/ {s.totalMissions || 0} total</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
            <span>SECTOR DISASTER RESPONSE ONGOING</span>
          </div>
        </div>

        {/* Card 2: UAVs Airborne */}
        <div className="tac-card rounded-lg p-4 font-mono relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 uppercase tracking-wider">DRONES ONLINE</span>
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">{s.activeDrones || 0}</span>
            <span className="text-xs text-slate-500">of {s.totalDrones || 0} fleet</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>FLEET READINESS: {s.fleetHealthPct || 100}%</span>
          </div>
        </div>

        {/* Card 3: Unconfirmed Victims */}
        <div className="tac-card rounded-lg p-4 font-mono relative overflow-hidden border-red-500/30 bg-red-950/10">
          <div className="flex justify-between items-start">
            <span className="text-xs text-red-300 uppercase tracking-wider">UNCONFIRMED VICTIMS</span>
            <div className="p-2 rounded bg-red-500/20 text-red-400 border border-red-500/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-400">{s.unconfirmedVictims || 0}</span>
            <span className="text-xs text-red-300/70">awaiting field triage</span>
          </div>
          <Link
            to="/detections"
            className="mt-2 text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 underline underline-offset-2"
          >
            <span>DISPATCH TRIAGE TEAMS</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 4: Rescued / Confirmed */}
        <div className="tac-card rounded-lg p-4 font-mono relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 uppercase tracking-wider">CASUALTY EXTRACTIONS</span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{s.rescuedVictims || 0}</span>
            <span className="text-xs text-slate-500">({s.confirmedVictims || 0} confirmed)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>SAVED / SAFELY EVACUATED</span>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Chart 1: Detection Velocity Timeline (2 Cols) */}
        <div className="lg:col-span-2 tac-card rounded-lg p-5 border border-[#182642]">
          <div className="flex items-center justify-between mb-4 border-b border-[#142038] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                YOLOv8 RECONNAISSANCE ACTIVITY (LAST 7 DAYS)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">DETECTIONS VS VICTIMS</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorVictims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1322',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="victims"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVictims)"
                  name="Victims Found"
                />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDetections)"
                  name="Drone Frames"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Triage Ratio Donut */}
        <div className="tac-card rounded-lg p-5 border border-[#182642]">
          <div className="flex items-center justify-between mb-4 border-b border-[#142038] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                TRIAGE STATUS MATRIX
              </h2>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1322',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-1.5 rounded bg-red-950/30 border border-red-500/20">
              <span className="text-red-400 font-bold block">{s.unconfirmedVictims || 0}</span>
              <span className="text-slate-400">UNCONFIRMED</span>
            </div>
            <div className="p-1.5 rounded bg-amber-950/30 border border-amber-500/20">
              <span className="text-amber-400 font-bold block">{s.confirmedVictims || 0}</span>
              <span className="text-slate-400">CONFIRMED</span>
            </div>
            <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold block">{s.rescuedVictims || 0}</span>
              <span className="text-slate-400">RESCUED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Feeds: Recent Alerts & Live UAV Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Priority Emergency Alerts Feed */}
        <div className="tac-card rounded-lg p-5 border border-[#182642]">
          <div className="flex items-center justify-between mb-4 border-b border-[#142038] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                PRIORITY ALERTS DISPATCH
              </h2>
            </div>
            <Link to="/alerts" className="text-cyan-400 hover:underline text-[11px]">
              VIEW ALL ALERTS ({s.unreadAlerts || 0})
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.recentAlerts?.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">NO OUTSTANDING INCIDENT ALERTS</p>
            ) : (
              stats?.recentAlerts?.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-3 rounded border flex items-start justify-between gap-3 ${
                    alert.severity === 'critical'
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : alert.severity === 'high'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-[#0f172a] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        alert.severity === 'critical' ? 'bg-red-500 text-black' : 'bg-amber-500 text-black'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-slate-500">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </span>
                      {alert.relatedDroneId && (
                        <span className="text-cyan-400">[{alert.relatedDroneId}]</span>
                      )}
                    </div>
                    <p className="font-sans text-xs leading-relaxed">{alert.message}</p>
                  </div>

                  {!alert.isRead && (
                    <button
                      onClick={() => acknowledgeAlert(alert._id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] whitespace-nowrap transition"
                    >
                      ACK
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live UAV Telemetry Status */}
        <div className="tac-card rounded-lg p-5 border border-[#182642]">
          <div className="flex items-center justify-between mb-4 border-b border-[#142038] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                AIRBORNE UAV TELEMETRY
              </h2>
            </div>
            <Link to="/drones" className="text-cyan-400 hover:underline text-[11px]">
              FULL FLEET ({s.totalDrones || 0})
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.drones?.map((drone) => (
              <div
                key={drone._id}
                className="p-3 bg-[#0d1627] rounded border border-[#1b2b47] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    drone.status === 'active' ? 'bg-emerald-400 animate-pulse' : drone.status === 'returning' ? 'bg-amber-400' : 'bg-slate-600'
                  }`} />
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span>{drone.droneId}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{drone.name}</span>
                    </div>
                    <div className="text-[10px] text-cyan-300">
                      GPS: {drone.currentLocation?.lat.toFixed(4)}, {drone.currentLocation?.lng.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end font-bold">
                    <BatteryCharging className={`w-3.5 h-3.5 ${
                      drone.batteryLevel <= 20 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                    }`} />
                    <span className={drone.batteryLevel <= 20 ? 'text-red-400' : 'text-slate-200'}>
                      {drone.batteryLevel}%
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold ${
                    drone.status === 'active' ? 'text-emerald-400' : drone.status === 'returning' ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {drone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
