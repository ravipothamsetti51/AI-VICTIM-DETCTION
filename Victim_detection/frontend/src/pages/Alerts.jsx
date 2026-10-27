import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Trash2,
  CheckCheck,
  RefreshCw,
  Filter,
} from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      let url = '/alerts?limit=100';
      if (severityFilter) url += `&severity=${severityFilter}`;
      if (readFilter) url += `&isRead=${readFilter}`;
      const res = await client.get(url);
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 6000);
    return () => clearInterval(interval);
  }, [severityFilter, readFilter]);

  const markAsRead = async (id) => {
    try {
      await client.patch(`/alerts/${id}/read`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await client.patch('/alerts/read-all');
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAlert = async (id) => {
    try {
      await client.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-950/20 text-red-200 shadow-lg shadow-red-950/40';
      case 'high':
        return 'border-amber-500/50 bg-amber-950/20 text-amber-200';
      case 'medium':
        return 'border-cyan-500/30 bg-cyan-950/10 text-cyan-200';
      default:
        return 'border-slate-800 bg-[#0c1424] text-slate-300';
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Bar */}
      <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400">
            <Bell className="w-5 h-5 animate-pulse" />
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-100">
              TACTICAL EMERGENCY DISPATCH MATRIX
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            AUTONOMOUS THREAT TELEMETRY & MULTI-AGENCY INCIDENT ALERTS
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#090f1d] border border-[#223658] text-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium</option>
              <option value="low">Low Info</option>
            </select>
          </div>

          <button
            onClick={fetchAlerts}
            className="p-1.5 bg-[#121c2e] hover:bg-[#1a2a47] border border-slate-700 text-cyan-400 rounded transition"
            title="Refresh Alert Matrix"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17253d] hover:bg-[#203457] border border-cyan-500/40 text-cyan-300 rounded text-xs transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>ACKNOWLEDGE ALL</span>
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs uppercase tracking-wider">SYNCING EMERGENCY COMMUNICATIONS...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="tac-card rounded-lg p-12 text-center text-slate-500">
          <p className="text-sm">NO ACTIVE ALERTS RECORDED IN THEATER</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a._id}
              className={`p-4 rounded-lg border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${getSeverityStyle(
                a.severity
              )}`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      a.severity === 'critical'
                        ? 'bg-red-500 text-black animate-pulse'
                        : a.severity === 'high'
                        ? 'bg-amber-500 text-black'
                        : a.severity === 'medium'
                        ? 'bg-cyan-500 text-black'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {a.severity}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>

                  {a.relatedDroneId && (
                    <span className="px-1.5 py-0.2 bg-black/60 rounded text-cyan-300 text-[10px] border border-cyan-500/30">
                      UAV: {a.relatedDroneId}
                    </span>
                  )}

                  {a.relatedMissionId?.title && (
                    <span className="text-slate-400 text-[10px] truncate max-w-[200px]">
                      [{a.relatedMissionId.title}]
                    </span>
                  )}
                </div>

                <p className="font-sans text-sm text-slate-100 font-medium leading-relaxed">
                  {a.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-xs">
                {!a.isRead ? (
                  <button
                    onClick={() => markAsRead(a._id)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs transition"
                  >
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 px-2">ACKNOWLEDGED</span>
                )}

                <button
                  onClick={() => deleteAlert(a._id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition rounded"
                  title="Dismiss Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
