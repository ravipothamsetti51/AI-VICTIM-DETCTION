import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-cyan-400 font-mono">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest text-sm uppercase">Verifying Cryptographic Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-wider font-mono uppercase mb-2">
          Security Clearance Violation
        </h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 font-mono">
          Your current role (<span className="text-red-400 font-bold uppercase">{user?.role}</span>) does not possess the requisite operational clearance to access this sector.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 rounded text-sm font-mono tracking-wider uppercase transition"
        >
          Return to Operational Station
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
