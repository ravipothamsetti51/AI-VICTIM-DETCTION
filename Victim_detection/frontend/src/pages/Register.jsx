import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Radio, User, Mail, Lock, Shield, ArrowRight, AlertTriangle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rescuer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] bg-grid-pattern flex flex-col justify-center items-center p-4 relative">
      <div className="absolute inset-0 scanline-overlay pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-slate-100 font-mono">
            OPERATOR ONBOARDING
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-1">
            COMMISSION NEW EMERGENCY RESPONSE CREDENTIALS
          </p>
        </div>

        <div className="tac-card rounded-xl p-6 border border-[#1e2d4a]">
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1 tracking-wider">FULL NAME & CALLSIGN</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Capt. John Miller"
                  className="w-full bg-[#080d19] border border-[#1e2d4a] rounded px-3 py-2 pl-9 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 tracking-wider">TACTICAL COMM / EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="miller@aerosentry.io"
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

            <div>
              <label className="block text-slate-400 mb-1 tracking-wider">OPERATIONAL CLEARANCE ROLE</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#080d19] border border-[#1e2d4a] rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="rescuer">Rescuer (Field Triage & Extraction)</option>
                <option value="operator">Operator (UAV Flight & Mission Director)</option>
                <option value="admin">Administrator (Full Theater Command)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'COMMISSIONING...' : 'INITIALIZE CREDENTIAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-slate-500 font-mono text-[11px]">
            Already holding tactical clearance?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline">
              Access Terminal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
