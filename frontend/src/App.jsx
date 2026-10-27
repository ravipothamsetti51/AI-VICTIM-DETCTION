import React from 'react';
import TacticalWebcamDashboard from './components/TacticalWebcamDashboard';

function App() {
  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid-pattern text-slate-800 relative selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Main Single Dashboard in White and Green Theme */}
      <TacticalWebcamDashboard />
    </div>
  );
}

export default App;
