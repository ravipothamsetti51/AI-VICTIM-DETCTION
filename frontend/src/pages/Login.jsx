import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Radio, UserCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, quickLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] bg-grid-pattern flex flex-col justify-center items-center p-4 relative">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanline-overlay pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Terminal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-slate-100 font-mono">
            AEROSENTRY // DISASTER COMMAND
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-1">
            AEGIS AUTONOMOUS UAV RECONNAISSANCE TERMINAL
          </p>
        </div>

        {/* Tactical Card */}
        <div className="tac-card rounded-xl p-6 border border-[#1e2d4a]">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#182642] font-mono text-xs">
            <span className="text-cyan-400 font-bold tracking-wider">OPERATOR VERIFICATION</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SYS: ONLINE
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mb-5 bg-[#090e1a] p-3 rounded-lg border border-[#16253f]">
            <p className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Test Station Clearance:</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                disabled={loading}
                className="py-1.5 px-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded text-[11px] font-mono font-semibold transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuick('operator')}
                disabled={loading}
                className="py-1.5 px-2 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded text-[11px] font-mono font-semibold transition"
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => handleQuick('rescuer')}
                disabled={loading}
                className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded text-[11px] font-mono font-semibold transition"
              >
                Rescuer
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1 tracking-wider">COMMAND CALLSIGN / EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@aerosentry.io"
                  className="w-full bg-[#080d19] border border-[#1e2d4a] rounded px-3 py-2 pl-9 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 tracking-wider">SECURITY CLEARANCE CIPHER</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#080d19] border border-[#1e2d4a] rounded px-3 py-2 pl-9 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-slate-500 font-mono text-[11px]">
            New personnel in theater?{' '}
            <Link to="/register" className="text-cyan-400 hover:underline">
              Request Operator Clearance
            </Link>
          </div>
        </div>

        {/* Footer Security Notice */}
        <p className="text-center text-[10px] font-mono text-slate-600 mt-6 tracking-widest uppercase">
          AEGIS DISASTER RESPONSE SYSTEM // RESTRICTED ACCESS // 256-BIT ENCRYPTION
        </p>
      </div>
    </div>
  );
};

export default Login;
