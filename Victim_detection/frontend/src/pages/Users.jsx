import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Users as UsersIcon, Shield, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await client.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load user personnel registry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await client.patch(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setMessage(`Security role updated to ${newRole.toUpperCase()}`);
        fetchUsers();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const roleColors = {
    admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    operator: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    rescuer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400">
            <Shield className="w-5 h-5" />
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-100">
              TACTICAL PERSONNEL CLEARANCE & ROLES
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            SECURITY LEVEL ADMINISTRATION & ACCESS CONTROL POLICIES (ADMIN ONLY)
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-1.5 bg-[#121c2e] hover:bg-[#1a2a47] border border-slate-700 text-purple-400 rounded transition"
          title="Refresh Personnel Matrix"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="tac-card rounded-lg overflow-hidden border border-[#182642]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090f1d] border-b border-[#142038] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Personnel Callsign</th>
                <th className="p-3.5">Email / Comm Link</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5">Assigned Security Clearance</th>
                <th className="p-3.5">Commissioned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142038] text-slate-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-[#0c1424] transition">
                  <td className="p-3.5 font-bold text-slate-100">{u.name}</td>
                  <td className="p-3.5 text-slate-400">{u.email}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="bg-[#080d19] border border-[#1e2d4a] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="rescuer">Rescuer (Field Extraction)</option>
                      <option value="operator">Operator (Flight & Missions)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
