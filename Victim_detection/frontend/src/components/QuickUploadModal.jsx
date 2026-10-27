import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  UploadCloud,
  X,
  Crosshair,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Cpu,
  MapPin,
  Camera,
} from 'lucide-react';

const QuickUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [missionId, setMissionId] = useState('');
  const [droneId, setDroneId] = useState('UAV-01');
  const [lat, setLat] = useState('27.7172');
  const [lng, setLng] = useState('85.3240');
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.25');

  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Load missions & drones for selection
  useEffect(() => {
    if (!isOpen) return;
    const loadPrereqs = async () => {
      try {
        const [mRes, dRes] = await Promise.all([
          client.get('/missions?status=active'),
          client.get('/drones'),
        ]);
        if (mRes.data.success) setMissions(mRes.data.data);
        if (dRes.data.success) setDrones(dRes.data.data);

        // Pre-select first active mission if available
        if (mRes.data.data?.length > 0) {
          const first = mRes.data.data[0];
          setMissionId(first._id);
          if (first.location?.lat) setLat(first.location.lat.toString());
          if (first.location?.lng) setLng(first.location.lng.toString());
        }
      } catch (err) {
        console.warn('Failed to load mission options', err);
      }
    };
    loadPrereqs();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleMissionChange = (e) => {
    const id = e.target.value;
    setMissionId(id);
    const selectedMission = missions.find((m) => m._id === id);
    if (selectedMission?.location?.lat) {
      // Add a slight realistic random jitter around mission zone
      const jitterLat = (selectedMission.location.lat + (Math.random() - 0.5) * 0.005).toFixed(5);
      const jitterLng = (selectedMission.location.lng + (Math.random() - 0.5) * 0.005).toFixed(5);
      setLat(jitterLat);
      setLng(jitterLng);
    }
  };

  const randomizeCoords = () => {
    const baseLat = 27.7172;
    const baseLng = 85.3240;
    const rLat = (baseLat + (Math.random() - 0.5) * 0.02).toFixed(5);
    const rLng = (baseLng + (Math.random() - 0.5) * 0.02).toFixed(5);
    setLat(rLat);
    setLng(rLng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a drone reconnaissance image.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);
    if (missionId) formData.append('missionId', missionId);
    formData.append('droneId', droneId);
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('confidence_threshold', confidenceThreshold);

    try {
      const res = await client.post('/detections/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setResult(res.data);
        if (onUploadSuccess) onUploadSuccess(res.data.data);
      } else {
        setError(res.data.message || 'Detection failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error executing AI detection pipeline.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0b1220] border border-cyan-500/40 rounded-lg shadow-2xl shadow-cyan-950/50 overflow-hidden font-mono flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0e172a] border-b border-[#1b2b47] flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Camera className="w-4 h-4" />
            <span className="font-bold tracking-wider text-sm">RECONNAISSANCE UPLOAD & YOLOv8 DETECT</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-400 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-[#1f304f] hover:border-cyan-500/60 rounded-lg p-5 text-center transition bg-[#090f1d]">
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Recon Preview"
                      className="max-h-56 mx-auto rounded border border-slate-700 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600/90 text-white rounded text-[11px] hover:bg-red-500"
                    >
                      Remove Frame
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <UploadCloud className="w-10 h-10 text-cyan-400/80 mx-auto mb-2" />
                    <p className="text-slate-200 font-semibold mb-1">
                      SELECT OR DROP DRONE AERIAL FRAME (JPEG, PNG, WEBP)
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Accepts high-resolution FLIR or Optical drone reconnaissance imagery
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0d1627] p-3 rounded border border-[#16253f]">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">BIND TO OPERATION / MISSION</label>
                  <select
                    value={missionId}
                    onChange={handleMissionChange}
                    className="w-full bg-[#070c17] border border-[#213556] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- No Mission Binding --</option>
                    {missions.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} ({m.disasterType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">UAV ASSET CALLSIGN</label>
                  <select
                    value={droneId}
                    onChange={(e) => setDroneId(e.target.value)}
                    className="w-full bg-[#070c17] border border-[#213556] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {drones.map((d) => (
                      <option key={d._id} value={d.droneId}>
                        {d.droneId} - {d.name} ({d.status})
                      </option>
                    ))}
                    <option value="UAV-01">UAV-01 - SkyRanger Alpha</option>
                    <option value="UAV-02">UAV-02 - ThermalHawk Brazo</option>
                    <option value="UAV-03">UAV-03 - Valkyrie Recon-3</option>
                  </select>
                </div>

                {/* GPS Coordinates */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 text-[11px]">TELEMETRY LATITUDE</label>
                    <button
                      type="button"
                      onClick={randomizeCoords}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      [Randomize Sector]
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.00001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    required
                    className="w-full bg-[#070c17] border border-[#213556] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">TELEMETRY LONGITUDE</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    required
                    className="w-full bg-[#070c17] border border-[#213556] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-4 pt-1">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>CONFIDENCE THRESHOLD</span>
                      <span className="text-cyan-400">{Math.round(confidenceThreshold * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(e.target.value)}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded text-xs tracking-wider uppercase transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>INFERRING VIA YOLOv8...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4" />
                      <span>EXECUTE AI DETECTION</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* AI Inference Results View */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm">
                    AI INFERENCE COMPLETE: {result.data.victimCount} VICTIM(S) DETECTED
                  </span>
                </div>
                <span className="text-xs bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                  {result.aiMetrics?.processingTimeMs || 0} ms
                </span>
              </div>

              {/* Annotated Image */}
              <div className="relative border border-slate-700 rounded overflow-hidden bg-black text-center">
                <img
                  src={
                    result.data.processedImageUrl?.startsWith('data:')
                      ? result.data.processedImageUrl
                      : `http://localhost:5000${result.data.processedImageUrl}`
                  }
                  alt="AI Annotated"
                  className="max-h-72 mx-auto object-contain"
                />
              </div>

              {/* Telemetry Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#0d1627] p-3 rounded border border-[#16253f]">
                <div>
                  <span className="text-slate-500 block">VICTIMS:</span>
                  <span className="font-bold text-red-400 text-sm">{result.data.victimCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">COORDINATES:</span>
                  <span className="text-cyan-300 font-mono">
                    {result.data.gpsLocation.lat.toFixed(4)}, {result.data.gpsLocation.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">BOUNDING BOXES:</span>
                  <span className="text-slate-200">{result.data.boundingBoxes?.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">STATUS:</span>
                  <span className="text-amber-400 font-bold uppercase">{result.data.status}</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  UPLOAD ANOTHER FRAME
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/map');
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>VIEW ON LIVE MAP</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/detections');
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs"
                  >
                    OPEN TRIAGE CENTER
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickUploadModal;
