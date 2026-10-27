import React, { useState, useEffect } from 'react';
import client, { getImageUrl } from '../api/client';
import {
  ScanEye,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  MapPin,
  Clock,
  Radio,
  Eye,
  Filter,
  Layers,
} from 'lucide-react';

const Detections = ({ onOpenUpload }) => {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDetection, setSelectedDetection] = useState(null);

  const fetchDetections = async () => {
    try {
      let url = '/detections?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await client.get(url);
      if (res.data.success) {
        setDetections(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load detections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await client.patch(`/detections/${id}/status`, { status: newStatus });
      if (res.data.success) {
        if (selectedDetection && selectedDetection._id === id) {
          setSelectedDetection(res.data.data);
        }
        fetchDetections();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };


  return (
    <div className="space-y-6 font-mono">
      {/* Header Bar */}
      <div className="tac-card rounded-lg p-4 border border-[#182642] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <ScanEye className="w-5 h-5" />
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-100">
              AI RECONNAISSANCE & CASUALTY TRIAGE
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ULTRALYTICS YOLOv8 PERSON DETECTION PIPELINE & GROUND CONFIRMATION
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#090f1d] border border-[#223658] text-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Triage Categories</option>
              <option value="unconfirmed">Unconfirmed Only</option>
              <option value="confirmed">Confirmed Survivors</option>
              <option value="rescued">Successfully Rescued</option>
              <option value="false_positive">False Positives</option>
            </select>
          </div>

          <button
            onClick={fetchDetections}
            className="p-1.5 bg-[#121c2e] hover:bg-[#1a2a47] border border-slate-700 text-cyan-400 rounded transition"
            title="Refresh AI Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs transition shadow-lg shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>UPLOAD RECON FRAME</span>
          </button>
        </div>
      </div>

      {/* Detections Gallery Grid */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs uppercase tracking-wider">INDEXING RECONNAISSANCE FRAMES...</p>
        </div>
      ) : detections.length === 0 ? (
        <div className="tac-card rounded-lg p-12 text-center text-slate-500">
          <p className="text-sm">NO DETECTION RECORDS FOUND</p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 bg-cyan-500 text-black font-bold rounded text-xs"
          >
            EXECUTE FIRST UAV SCAN
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {detections.map((det) => (
            <div
              key={det._id}
              className={`tac-card rounded-lg overflow-hidden border flex flex-col justify-between transition ${
                det.status === 'unconfirmed'
                  ? 'border-red-500/40 bg-red-950/5'
                  : det.status === 'confirmed'
                  ? 'border-amber-500/40'
                  : det.status === 'rescued'
                  ? 'border-emerald-500/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Image Preview Container */}
              <div
                className="relative bg-black h-48 cursor-pointer overflow-hidden group"
                onClick={() => setSelectedDetection(det)}
              >
                <img
                  src={getImageUrl(det.processedImageUrl || det.imageUrl)}
                  alt="Aerial Recon Frame"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />

                {/* Overlaid Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-cyan-300 text-[10px] font-bold">
                    {det.droneId}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold">
                    {det.victimCount} VICTIM(S)
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      det.status === 'unconfirmed'
                        ? 'bg-red-500/90 text-white animate-pulse'
                        : det.status === 'confirmed'
                        ? 'bg-amber-500 text-black'
                        : det.status === 'rescued'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {det.status}
                  </span>
                </div>

                <div className="absolute inset-0 bg-cyan-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="px-3 py-1 bg-black/90 border border-cyan-500 text-cyan-300 rounded text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>INSPECT BOUNDING BOXES</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[170px] text-slate-200">
                    {det.missionId?.title || 'Sector Reconnaissance'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(det.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="p-2 bg-[#090f1d] rounded border border-[#16253f] text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS LAT:</span>
                    <span className="text-cyan-300">{det.gpsLocation?.lat.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS LNG:</span>
                    <span className="text-cyan-300">{det.gpsLocation?.lng.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BOUNDING BOXES:</span>
                    <span className="text-slate-200">{det.boundingBoxes?.length || 0} Targets</span>
                  </div>
                </div>

                {/* Triage Status Actions */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-bold">
                  <button
                    onClick={() => updateStatus(det._id, 'confirmed')}
                    disabled={det.status === 'confirmed'}
                    className={`py-1.5 rounded transition ${
                      det.status === 'confirmed'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={() => updateStatus(det._id, 'rescued')}
                    disabled={det.status === 'rescued'}
                    className={`py-1.5 rounded transition ${
                      det.status === 'rescued'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-emerald-900/50 text-slate-300 hover:text-emerald-300'
                    }`}
                  >
                    RESCUED
                  </button>
                  <button
                    onClick={() => updateStatus(det._id, 'false_positive')}
                    disabled={det.status === 'false_positive'}
                    className={`py-1.5 rounded transition ${
                      det.status === 'false_positive'
                        ? 'bg-slate-700 text-slate-400 cursor-default'
                        : 'bg-slate-800 hover:bg-red-950/50 text-slate-300 hover:text-red-300'
                    }`}
                  >
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Inspection Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-[#0b1220] border border-cyan-500/50 rounded-lg shadow-2xl p-6 font-mono text-xs flex flex-col max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1b2b47] pb-3 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <ScanEye className="w-5 h-5" />
                <span>
                  TACTICAL RECON INSPECTOR // {selectedDetection.droneId} [{selectedDetection.victimCount} VICTIMS]
                </span>
              </div>
              <button
                onClick={() => setSelectedDetection(null)}
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Processed AI Image */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">
                  AI HUD ANNOTATION (YOLOv8 DETECTIONS):
                </span>
                <div className="border border-slate-700 rounded overflow-hidden bg-black text-center">
                  <img
                    src={getImageUrl(
                      selectedDetection.processedImageUrl || selectedDetection.imageUrl
                    )}
                    alt="Processed Frame"
                    className="max-h-80 mx-auto object-contain"
                  />
                </div>
              </div>

              {/* Raw Drone Sensor Frame */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">RAW OPTICAL SENSOR FRAME:</span>
                <div className="border border-slate-700 rounded overflow-hidden bg-black text-center">
                  <img
                    src={getImageUrl(selectedDetection.imageUrl)}
                    alt="Raw Frame"
                    className="max-h-80 mx-auto object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Detailed Telemetry & Bounding Box Matrix */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080d19] p-3 rounded border border-[#16253f] text-[11px]">
              <div>
                <span className="text-slate-500 block">VICTIMS:</span>
                <span className="font-bold text-red-400 text-sm">
                  {selectedDetection.victimCount}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">GPS COORDINATES:</span>
                <span className="text-cyan-300">
                  {selectedDetection.gpsLocation?.lat.toFixed(5)}, {selectedDetection.gpsLocation?.lng.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">CURRENT STATUS:</span>
                <span className="text-amber-400 font-bold uppercase">
                  {selectedDetection.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">TIMESTAMP:</span>
                <span className="text-slate-300">
                  {new Date(selectedDetection.detectedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bounding Box List */}
            {selectedDetection.boundingBoxes?.length > 0 && (
              <div className="mt-3">
                <span className="text-slate-400 text-[11px] block mb-1">
                  YOLO BOUNDING BOX COORDINATES:
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {selectedDetection.boundingBoxes.map((box, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-[#090f1d] border border-[#182642] flex justify-between text-[11px]"
                    >
                      <span className="text-slate-300 font-bold">Target #{idx + 1}</span>
                      <span className="text-slate-400">
                        x: {box.x}, y: {box.y}, w: {box.w}, h: {box.h}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {Math.round(box.confidence * 100)}% Confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Triage Actions */}
            <div className="mt-5 pt-3 border-t border-[#1b2b47] flex items-center justify-between">
              <span className="text-slate-400">SAR TRIAGE DECISION:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selectedDetection._id, 'confirmed')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded"
                >
                  CONFIRM VICTIM
                </button>
                <button
                  onClick={() => updateStatus(selectedDetection._id, 'rescued')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
                >
                  MARK AS RESCUED
                </button>
                <button
                  onClick={() => updateStatus(selectedDetection._id, 'false_positive')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  REJECT AS FALSE POSITIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detections;
