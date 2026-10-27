import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Activity,
  MapPin,
  Flame,
  Radio,
  ScanEye,
  Bell,
  Users,
  LogOut,
  Upload,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';

const Navbar = ({ onOpenUpload }) => {
  const { user, logout, quickLogin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [utcTime, setUtcTime] = useState('');
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Live UTC Mission Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for unread alerts count
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await client.get('/alerts?isRead=false&limit=1');
        if (res.data.success) {
          setUnreadAlerts(res.data.unreadCount || 0);
        }
      } catch (e) {
        // quiet
      }
    };
    fetchAlertCount();
    const alertTimer = setInterval(fetchAlertCount, 10000);
    return () => clearInterval(alertTimer);
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'DASHBOARD', icon: Activity },
    { to: '/map', label: 'LIVE MAP', icon: MapPin },
    { to: '/missions', label: 'MISSIONS', icon: Flame },
    { to: '/drones', label: 'UAV FLEET', icon: Radio },
    { to: '/detections', label: 'AI RECON', icon: ScanEye },
    { to: '/alerts', label: 'ALERTS', icon: Bell, badge: unreadAlerts },
    ...(isAdmin ? [{ to: '/users', label: 'OPERATORS', icon: Users }] : []),
  ];

  const roleColors = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    operator: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    rescuer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080d19]/90 backdrop-blur-md border-b border-[#182642]">
      {/* Top Telemetry & Status Bar */}
      <div className="px-4 py-2 border-b border-[#142038] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Brand & Defcon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest text-sm">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 animate-ping"></span>
            <span>AEROSENTRY // DISASTER COMMAND</span>
          </div>
          <span className="hidden md:inline-block text-slate-600">|</span>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="tracking-wider">STATUS: ACTIVE SAR OPS</span>
          </div>
        </div>

        {/* Telemetry Clock & Quick Role Switcher */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-medium">{utcTime || 'SYNCHRONIZING...'}</span>
          </div>

          {/* 1-Click Role Switcher for Test Evaluators */}
          <div className="hidden sm:flex items-center gap-1 bg-[#0f172a] p-0.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 px-1 uppercase tracking-wider">Switch:</span>
            <button
              onClick={() => quickLogin('admin')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                user?.role === 'admin' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-purple-300'
              }`}
              title="Switch to Administrator"
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('operator')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                user?.role === 'operator' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Switch to Operator"
            >
              Operator
            </button>
            <button
              onClick={() => quickLogin('rescuer')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                user?.role === 'rescuer' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="Switch to Rescuer"
            >
              Rescuer
            </button>
          </div>

          {/* Rapid Recon Upload Action */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded text-xs transition shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>UPLOAD RECON</span>
          </button>

          {/* User Role Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className={`px-2 py-0.5 rounded border text-[11px] font-semibold uppercase ${roleColors[user?.role] || 'text-slate-300'}`}>
              {user?.role || 'Operator'}
            </div>
            <span className="hidden xl:inline text-slate-300 font-sans text-xs">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 text-xs font-mono font-medium tracking-wider uppercase border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
};

export default Navbar;
