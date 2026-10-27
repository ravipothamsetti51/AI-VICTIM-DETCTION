import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Camera,
  Video,
  VideoOff,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  RefreshCw,
  Ambulance,
  ShieldAlert,
  Wifi,
  Globe,
  Check,
  Activity,
  ExternalLink,
  Locate,
  Navigation,
  CornerDownRight,
  Route,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const AI_API_URL = 'http://localhost:8000';

// Custom Marker for Rescue Location (Green & Red pin)
const rescueIcon = L.divIcon({
  className: 'rescue-map-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
      <div style="
        width: 30px; height: 30px; border-radius: 50%;
        background: #10b981; border: 2px solid #ffffff;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-weight: bold; font-family: monospace; font-size: 13px;
        box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5);
      ">
        ⛑
      </div>
      <div style="
        margin-top: 3px; background: #ffffff; border: 1px solid #10b981;
        padding: 1px 5px; border-radius: 4px; font-family: monospace;
        font-size: 9px; font-weight: bold; color: #047857; white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      ">
        SAR SENSOR
      </div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Custom Marker for Dispatched Ambulance
const ambulanceIcon = L.divIcon({
  className: 'sar-ambulance-icon',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
      <div style="
        width: 34px; height: 34px; border-radius: 50%;
        background: #047857; border: 2px solid #ffffff;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-size: 16px;
        box-shadow: 0 2px 12px rgba(4, 120, 87, 0.6);
        animation: bounce 1.2s infinite;
      ">
        🚑
      </div>
      <div style="
        margin-top: 2px; background: #ffffff; border: 1px solid #047857;
        padding: 1px 5px; border-radius: 4px; font-family: monospace;
        font-size: 8px; font-weight: bold; color: #047857; white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      ">
        SAR VEHICLE
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Custom Marker for Target Casualty under rescue
const targetCasualtyIcon = L.divIcon({
  className: 'sar-target-icon',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: #dc2626; border: 2px solid #ffffff;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-size: 14px; font-weight: bold;
        box-shadow: 0 2px 12px rgba(220, 38, 38, 0.7);
        animation: pulse 1s infinite;
      ">
        ⚠
      </div>
      <div style="
        margin-top: 2px; background: #ffffff; border: 1px solid #dc2626;
        padding: 1px 5px; border-radius: 4px; font-family: monospace;
        font-size: 8px; font-weight: bold; color: #dc2626; white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      ">
        RESCUE TARGET
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom Marker for Live Detected Person / Casualty on Google Maps
const detectedPersonIcon = (index, isEnRoute = false) => L.divIcon({
  className: 'detected-person-map-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
      <div style="
        width: 38px; height: 38px; border-radius: 50%;
        background: ${isEnRoute ? '#059669' : '#dc2626'};
        border: 2px solid #ffffff;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-size: 16px; font-weight: bold;
        box-shadow: 0 3px 14px ${isEnRoute ? 'rgba(5, 150, 105, 0.65)' : 'rgba(220, 38, 38, 0.75)'};
        animation: ${isEnRoute ? 'bounce 1.3s infinite' : 'pulse 1s infinite'};
      ">
        ${isEnRoute ? '🚑' : '👤'}
      </div>
      <div style="
        margin-top: 3px; background: #ffffff;
        border: 1.5px solid ${isEnRoute ? '#059669' : '#dc2626'};
        padding: 1px 6px; border-radius: 4px; font-family: monospace;
        font-size: 9px; font-weight: bold;
        color: ${isEnRoute ? '#047857' : '#b91c1c'};
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      ">
        ${isEnRoute ? `EN ROUTE (P-${index})` : `CASUALTY #${index}`}
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

// Resilient Map Error Boundary to catch any leaflet render errors without blanking the screen
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Leaflet Map Error caught by Boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-64 rounded-lg border border-red-300 bg-red-50 p-4 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-red-700 font-bold text-xs">MAP RECOVERY MODE ACTIVE</span>
          <p className="text-[11px] text-slate-600 font-sans">
            A route rendering issue was caught safely. Click below to reset the radar view.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition"
          >
            RESET ONGOLE MAP
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component to dynamically fit Google Map bounds to encompass road route or center
function MapRouteFitter({ activeRoute, center }) {
  const map = useMap();
  useEffect(() => {
    if (activeRoute && Array.isArray(activeRoute.coordinates) && activeRoute.coordinates.length > 1) {
      try {
        const validCoords = activeRoute.coordinates.filter(
          (c) => Array.isArray(c) && typeof c[0] === 'number' && !isNaN(c[0]) && typeof c[1] === 'number' && !isNaN(c[1])
        );
        if (validCoords.length > 1) {
          const bounds = L.latLngBounds(validCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true, duration: 0.8 });
          }
        }
      } catch (e) {
        console.warn('Could not fit route bounds:', e);
      }
    } else if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        map.setView(center, map.getZoom() || 14, { animate: true });
      } catch (e) {
        console.warn('Could not set map center:', e);
      }
    }
  }, [activeRoute, center, map]);
  return null;
}

const TacticalWebcamDashboard = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);

  // Video Source Type: 'local' (Device Webcam) or 'ip' (Remote IP Webcam)
  const [sourceType, setSourceType] = useState('local');

  // Exact Ongole, Andhra Pradesh, India Coordinates
  const ONGOLE_COORDS = { lat: 15.5059, lng: 80.0499 };

  // Google Map Layer Selection: 'streets', 'satellite', 'terrain'
  const [googleMapLayer, setGoogleMapLayer] = useState('streets');
  const [mapCenter, setMapCenter] = useState([15.5059, 80.0499]);

  // Local Webcam State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // IP Webcam State
  const [ipWebcamUrl, setIpWebcamUrl] = useState('http://192.168.1.7:8080/video');
  const [isIpStreamActive, setIsIpStreamActive] = useState(false);
  const [ipStreamError, setIpStreamError] = useState('');

  // Detection Controls & Telemetry
  const [isStreamingDetection, setIsStreamingDetection] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulation Mode (Allows instant testing of detected persons & road directions)
  const [isSimulatingVictim, setIsSimulatingVictim] = useState(false);

  // Real-Time Detection Stats
  const [victimCount, setVictimCount] = useState(0);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);

  // Audio Chime
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Location & Clocks (Default firmly set to Ongole, Andhra Pradesh)
  const [utcTime, setUtcTime] = useState('');
  const [location, setLocation] = useState({ lat: 15.5059, lng: 80.0499 });
  const [isLocating, setIsLocating] = useState(false);

  // Road Route Navigation State & Animated Vehicle Progress
  const [activeRoute, setActiveRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeProgressIndex, setRouteProgressIndex] = useState(0);
  const [showTurnSteps, setShowTurnSteps] = useState(false);

  // Rescue Incident Registry in Ongole, AP
  const [rescueIncidents, setRescueIncidents] = useState([
    {
      id: 'SAR-101',
      time: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
      victims: 1,
      lat: 15.5059,
      lng: 80.0499,
      status: 'Rescued',
      source: 'Ongole City Center Recon',
      snapshot: null,
    },
    {
      id: 'SAR-102',
      time: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString(),
      victims: 2,
      lat: 15.5145,
      lng: 80.0422,
      status: 'Rescued',
      source: 'Ongole RIMS Sector UAV',
      snapshot: null,
    },
  ]);

  const [activeRescueStatus, setActiveRescueStatus] = useState(null);

  // Reset or lock directly to Ongole, AP coordinates
  const setOngoleLocation = useCallback(() => {
    setLocation({ lat: 15.5059, lng: 80.0499 });
    setMapCenter([15.5059, 80.0499]);
  }, []);

  // Detect and lock exact device GPS location (if user clicks MY GPS)
  const detectExactLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };
        setLocation(newLoc);
        setMapCenter([newLoc.lat, newLoc.lng]);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Exact GPS acquisition unavailable, staying at Ongole HQ:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Initialize UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Discover Local Video Devices
  const getCameraDevices = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devs.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  };

  useEffect(() => {
    getCameraDevices();
  }, []);

  // Start Local Camera Stream
  const startCamera = async (deviceId) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsIpStreamActive(false);
      getCameraDevices();
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Camera access denied or device unavailable: ' + err.message);
    }
  };

  // Stop Local Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setVictimCount(0);
    setBoundingBoxes([]);
    setAnnotatedImage(null);
  };

  // Start IP Webcam Stream
  const startIpStream = () => {
    if (!ipWebcamUrl.trim()) {
      setIpStreamError('Please enter an IP Webcam or RTSP URL.');
      return;
    }
    stopCamera();
    setIpStreamError('');
    setIsIpStreamActive(true);
  };

  // Stop IP Webcam Stream
  const stopIpStream = () => {
    setIsIpStreamActive(false);
    setVictimCount(0);
    setBoundingBoxes([]);
    setAnnotatedImage(null);
  };

  // Synthesize Tactical Radar / Alarm Sound
  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // quiet audio
    }
  }, [soundEnabled]);

  // Capture and Detect from Local Webcam Frame
  const captureLocalFrame = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || isProcessing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Data = canvas.toDataURL('image/jpeg', 0.8);

      const res = await axios.post(`${AI_API_URL}/detect_frame`, {
        image: base64Data,
        confidence_threshold: confidenceThreshold,
        lat: location.lat,
        lng: location.lng,
      });

      if (res.data) {
        const count = res.data.victimCount || 0;
        setVictimCount(count);
        setBoundingBoxes(res.data.boundingBoxes || []);
        setAnnotatedImage(res.data.processedImageBase64);
        setInferenceTime(res.data.processingTimeMs);

        const elapsed = performance.now() - startTime;
        setFps(Math.round(1000 / Math.max(elapsed, 1)));

        if (count > 0) playAlertChime();
      }
    } catch (err) {
      console.warn('Local detect_frame error:', err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isCameraActive, isProcessing, confidenceThreshold, location, playAlertChime]);

  // Capture and Detect from Remote IP Webcam Stream
  const captureIpFrame = useCallback(async () => {
    if (!isIpStreamActive || !ipWebcamUrl || isProcessing) return;

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const res = await axios.post(`${AI_API_URL}/detect_ip_stream`, {
        stream_url: ipWebcamUrl,
        confidence_threshold: confidenceThreshold,
        lat: location.lat,
        lng: location.lng,
      });

      if (res.data) {
        const count = res.data.victimCount || 0;
        setVictimCount(count);
        setBoundingBoxes(res.data.boundingBoxes || []);
        setAnnotatedImage(res.data.processedImageBase64);
        setInferenceTime(res.data.processingTimeMs);
        setIpStreamError('');

        const elapsed = performance.now() - startTime;
        setFps(Math.round(1000 / Math.max(elapsed, 1)));

        if (count > 0) playAlertChime();
      }
    } catch (err) {
      setIpStreamError(err.response?.data?.detail || err.message || 'Error connecting to IP webcam');
    } finally {
      setIsProcessing(false);
    }
  }, [isIpStreamActive, ipWebcamUrl, isProcessing, confidenceThreshold, location, playAlertChime]);

  // Continuous Detection Streaming Loop
  useEffect(() => {
    if (!isStreamingDetection) return;

    const interval = setInterval(() => {
      if (sourceType === 'local' && isCameraActive) {
        captureLocalFrame();
      } else if (sourceType === 'ip' && isIpStreamActive) {
        captureIpFrame();
      }
    }, 450);

    return () => clearInterval(interval);
  }, [sourceType, isCameraActive, isIpStreamActive, isStreamingDetection, captureLocalFrame, captureIpFrame]);

  // Animated Ambulance Progress along the Road Route
  useEffect(() => {
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length < 2) {
      setRouteProgressIndex(0);
      return;
    }
    setRouteProgressIndex(0);
    const totalPoints = activeRoute.coordinates.length;
    const interval = setInterval(() => {
      setRouteProgressIndex((prev) => {
        if (prev >= totalPoints - 1) return prev;
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [activeRoute]);

  // Derived list of Detected Persons on Google Maps (from AI bounding boxes or simulated recon)
  const detectedPersonsList = React.useMemo(() => {
    const effectiveCount = isSimulatingVictim ? Math.max(victimCount, 1) : victimCount;
    if (effectiveCount <= 0) return [];

    return Array.from({ length: effectiveCount }, (_, i) => {
      const box = boundingBoxes[i];
      // Offset positions around the sensor GPS (approx 35m to 110m along streets)
      const angle = (i * (2 * Math.PI / Math.max(effectiveCount, 1))) + 0.45;
      const dist = 0.00045 + (i * 0.00028);
      const pLat = Number((location.lat + Math.sin(angle) * dist).toFixed(5));
      const pLng = Number((location.lng + Math.cos(angle) * dist).toFixed(5));
      const conf = box ? Math.round(box.confidence * 100) : (isSimulatingVictim && i === 0 ? 94 : 88);
      const isTarget = activeRoute?.destinationId === `PERSON-${i + 1}`;

      return {
        id: `PERSON-${i + 1}`,
        index: i + 1,
        lat: pLat,
        lng: pLng,
        confidence: conf,
        status: isTarget ? 'Rescue En Route' : 'Awaiting Dispatch',
        time: new Date().toLocaleTimeString(),
        source: `Camera Recon (Detected Person #${i + 1})`,
      };
    });
  }, [victimCount, boundingBoxes, location, isSimulatingVictim, activeRoute]);

  // Fetch real road map driving directions using OSRM with step maneuvers & fallback
  const calculateRoadRoute = useCallback(async (startLat, startLng, destLat, destLng, targetLabel = 'Target Casualty', targetId = null) => {
    const sLat = typeof startLat === 'number' && !isNaN(startLat) ? startLat : 15.4969;
    const sLng = typeof startLng === 'number' && !isNaN(startLng) ? startLng : 80.0429;
    const dLat = typeof destLat === 'number' && !isNaN(destLat) ? destLat : 15.5059;
    const dLng = typeof destLng === 'number' && !isNaN(destLng) ? destLng : 80.0499;

    setIsCalculatingRoute(true);
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;
      const res = await axios.get(osrmUrl, { timeout: 7000 });

      if (res.data?.routes && res.data.routes.length > 0) {
        const routeData = res.data.routes[0];
        const roadCoords = (routeData.geometry?.coordinates || [])
          .map((c) => [c[1], c[0]])
          .filter((pt) => Array.isArray(pt) && typeof pt[0] === 'number' && !isNaN(pt[0]) && typeof pt[1] === 'number' && !isNaN(pt[1]));

        if (roadCoords.length > 1) {
          const distKm = (routeData.distance / 1000).toFixed(1) + ' km';
          const durMin = Math.max(1, Math.round(routeData.duration / 60)) + ' min';

          const parsedSteps = routeData.legs?.[0]?.steps?.map((step, idx) => {
            const type = step.maneuver?.type || 'Drive';
            const modifier = step.maneuver?.modifier ? ` (${step.maneuver.modifier})` : '';
            const street = step.name ? ` onto ${step.name}` : ' along sector route';
            return {
              id: idx + 1,
              instruction: `${type}${modifier}${street}`.trim(),
              distance: step.distance ? `${Math.round(step.distance)} m` : '',
            };
          }) || [];

          setActiveRoute({
            coordinates: roadCoords,
            origin: [sLat, sLng],
            destination: [dLat, dLng],
            distance: distKm,
            duration: durMin,
            destinationName: targetLabel,
            destinationId: targetId,
            steps: parsedSteps,
          });

          setIsCalculatingRoute(false);
          return;
        }
      }
    } catch (err) {
      console.warn('OSRM routing service fallback active:', err.message);
    }

    // Realistic Fallback Street Path with verified finite coordinates
    const latDiff = dLat - sLat;
    const lngDiff = dLng - sLng;
    const waypoint1 = [Number((sLat + latDiff * 0.35).toFixed(5)), Number((sLng + lngDiff * 0.08).toFixed(5))];
    const waypoint2 = [Number((sLat + latDiff * 0.65).toFixed(5)), Number((sLng + lngDiff * 0.85).toFixed(5))];
    const fallbackPath = [
      [sLat, sLng],
      waypoint1,
      waypoint2,
      [dLat, dLng],
    ];

    setActiveRoute({
      coordinates: fallbackPath,
      origin: [sLat, sLng],
      destination: [dLat, dLng],
      distance: '2.1 km',
      duration: '4 min',
      destinationName: targetLabel,
      destinationId: targetId,
      steps: [
        { id: 1, instruction: 'Depart SAR Dispatch Base Station Echo-1 (Ongole Sector)', distance: '450 m' },
        { id: 2, instruction: 'Proceed via Kurnool Road toward casualty grid', distance: '1.1 km' },
        { id: 3, instruction: `Arrive at Casualty Site: ${targetLabel}`, distance: '550 m' },
      ],
    });
    setIsCalculatingRoute(false);
  }, []);

  // Rescue Dispatch Action - Generates Incident, Logs it Immediately, and Computes Road Directions on Google Maps
  const handleDispatchRescue = async (targetIncident = null) => {
    // Guard against React SyntheticEvent or non-incident objects
    const isValidTarget =
      targetIncident &&
      typeof targetIncident.lat === 'number' &&
      !isNaN(targetIncident.lat) &&
      typeof targetIncident.lng === 'number' &&
      !isNaN(targetIncident.lng);

    const currentSource =
      sourceType === 'ip' ? `IP Camera (${ipWebcamUrl.substring(0, 24)}...)` : 'Local Camera Recon';

    const targetLat = isValidTarget ? targetIncident.lat : (Number(location?.lat) || 15.5059);
    const targetLng = isValidTarget ? targetIncident.lng : (Number(location?.lng) || 80.0499);
    const victimsCount = (isValidTarget && targetIncident.victims) || (victimCount > 0 ? victimCount : 1);
    const incidentId = (isValidTarget && targetIncident.id) || `SAR-${Math.floor(100 + Math.random() * 900)}`;
    const label = (isValidTarget && targetIncident.source) || `Target ${incidentId} (${victimsCount} Casualty at Ongole)`;

    // Realistic SAR Dispatch Base location in Ongole (~1.2km away along street corridor)
    const baseLat = Number((targetLat - 0.009).toFixed(5));
    const baseLng = Number((targetLng - 0.007).toFixed(5));

    const newIncident = {
      id: incidentId,
      time: new Date().toLocaleTimeString(),
      victims: victimsCount,
      lat: targetLat,
      lng: targetLng,
      status: 'Rescue En Route',
      source: isValidTarget && targetIncident.source ? targetIncident.source : currentSource,
      snapshot: annotatedImage || null,
    };

    // ALWAYS show in the logs immediately!
    setRescueIncidents((prev) => {
      const exists = prev.find((i) => i.id === newIncident.id);
      if (exists) {
        return prev.map((i) => (i.id === newIncident.id ? { ...i, status: 'Rescue En Route' } : i));
      }
      return [newIncident, ...prev];
    });

    setActiveRescueStatus({
      id: newIncident.id,
      text: `🚨 SAR AMBULANCE DISPATCHED: ROAD ROUTE ACTIVE TO ONGOLE [${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}]`,
      status: 'en_route',
    });

    playAlertChime();

    // Automatically calculate & display the street road directions on Google Maps!
    await calculateRoadRoute(
      baseLat,
      baseLng,
      targetLat,
      targetLng,
      label,
      newIncident.id
    );
  };

  // Mark Rescued Action - Marks incident as Rescued AND REMOVES the road route from Google Maps
  const handleMarkRescued = (id = null) => {
    // 1. REMOVE THE ROAD ROUTE FROM GOOGLE MAPS
    setActiveRoute(null);
    setRouteProgressIndex(0);

    const targetId = id || activeRescueStatus?.id;

    // 2. Update status in Incident Logs
    setRescueIncidents((prev) => {
      if (!targetId || targetId === 'ALL') {
        return prev.map((inc) => ({ ...inc, status: 'Rescued' }));
      }
      return prev.map((inc) => (inc.id === targetId ? { ...inc, status: 'Rescued' } : inc));
    });

    if (isSimulatingVictim) {
      setIsSimulatingVictim(false);
    }

    setActiveRescueStatus({
      id: targetId || 'ALL',
      text: '✅ CASUALTY SAFELY EXTRACTED & RESCUED // ROAD ROUTE CLEARED FROM GOOGLE MAPS',
      status: 'rescued',
    });
  };

  const isFeedActive = (sourceType === 'local' && isCameraActive) || (sourceType === 'ip' && isIpStreamActive);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-mono p-3 md:p-6 space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar (White & Green Theme) */}
      <header className="tac-card rounded-xl p-4 border border-emerald-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm tracking-wider">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="block text-slate-900 font-black text-base tracking-wide">
                AEROSENTRY <span className="text-emerald-600">// SAR COMMAND</span>
              </span>
              <span className="text-[10px] text-slate-400 font-sans tracking-normal">
                Autonomous Victim Detection & Rescue Dispatch System
              </span>
            </div>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${
              isFeedActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFeedActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>
              {sourceType === 'ip'
                ? isIpStreamActive
                  ? 'IP CAM STREAM ACTIVE'
                  : 'IP CAM STANDBY'
                : isCameraActive
                ? 'LOCAL WEBCAM ACTIVE'
                : 'CAMERA STANDBY'}
            </span>
          </div>
        </div>

        {/* Telemetry Clock & Audio Toggle */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-900 font-bold">{utcTime || 'SYNCHRONIZING...'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-900 font-bold">
              ONGOLE, AP: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 text-[11px] font-bold ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title="Toggle Alert Audio Chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Video Stage & Controls (Left 2 Cols) + Map & Registry (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Live Camera Feed & YOLO Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="tac-card rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-sm">
            {/* Live Person / Victim Counter Banner */}
            <div
              className={`p-3.5 transition-colors duration-300 flex items-center justify-between font-mono ${
                victimCount > 0
                  ? 'bg-red-50 border-b-2 border-red-500 text-red-900'
                  : 'bg-emerald-50/80 border-b border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${victimCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-black tracking-wider uppercase block">
                    {victimCount > 0
                      ? `⚠ PRIORITY ALERT: ${victimCount} PERSON(S) DETECTED`
                      : 'SECTOR CLEAR: NO CASUALTIES IN FIELD OF VIEW'}
                  </span>
                  <div className="text-[11px] text-slate-500 font-sans">
                    Real-Time Person Detection Active (Class 0: Human Body)
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-2xl font-black px-4 py-1 rounded-lg ${
                    victimCount > 0
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  }`}
                >
                  COUNT: {victimCount}
                </span>
              </div>
            </div>

            {/* Video Viewport Stage */}
            <div className="relative aspect-video max-h-[500px] w-full flex items-center justify-center bg-slate-900 overflow-hidden">
              {/* Raw Video Stream */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-contain ${
                  isCameraActive && !annotatedImage ? 'block' : 'hidden'
                }`}
              />

              {/* Annotated HUD Image */}
              {isFeedActive && annotatedImage ? (
                <img
                  src={annotatedImage}
                  alt="AI Annotated HUD"
                  className="w-full h-full object-contain"
                />
              ) : null}

              {/* Inactive Standby Display */}
              {!isFeedActive && (
                <div className="text-center p-8 text-slate-400 font-mono space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-100 font-bold uppercase tracking-wider">
                    OPTICAL CAMERA STREAM OFFLINE
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
                    Activate your <b>Local Webcam</b> or connect a remote <b>IP Webcam</b> to start live casualty identification.
                  </p>

                  <div className="flex justify-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setSourceType('local');
                        startCamera(selectedDeviceId);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition shadow-md shadow-emerald-600/30 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>START LOCAL WEBCAM</span>
                    </button>
                    <button
                      onClick={() => setSourceType('ip')}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-emerald-400/40 text-emerald-300 font-bold rounded-lg text-xs tracking-wider uppercase transition flex items-center gap-2"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>USE IP WEBCAM</span>
                    </button>
                  </div>
                </div>
              )}

              {/* HUD Telemetry Overlay on Video */}
              {isFeedActive && (
                <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1 text-[10px] font-mono">
                  <span className="px-2.5 py-0.5 rounded bg-black/80 border border-slate-700 text-emerald-300">
                    FEED: {sourceType === 'ip' ? 'REMOTE IP STREAM' : 'LOCAL DEVICE WEBCAM'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-black/80 border border-slate-700 text-white font-bold">
                    INFERENCE: {inferenceTime} ms ({fps} FPS)
                  </span>
                </div>
              )}
            </div>

            {/* Input Selection & Camera Controls (White & Green) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs font-mono">
              {/* Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 uppercase font-bold">CAMERA SOURCE:</span>
                  <button
                    onClick={() => {
                      setSourceType('local');
                      stopIpStream();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      sourceType === 'local'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>LOCAL DEVICE WEBCAM</span>
                  </button>

                  <button
                    onClick={() => {
                      setSourceType('ip');
                      stopCamera();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      sourceType === 'ip'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>IP WEBCAM / DRONE STREAM</span>
                  </button>
                </div>

                {/* Confidence Slider */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  <span className="font-bold">CONFIDENCE:</span>
                  <input
                    type="range"
                    min="0.15"
                    max="0.8"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-emerald-700 font-bold">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
              </div>

              {/* Source Controls */}
              {sourceType === 'local' ? (
                /* Local Webcam Mode */
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isCameraActive ? (
                      <button
                        onClick={stopCamera}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition shadow-sm"
                      >
                        <VideoOff className="w-4 h-4" />
                        <span>DISCONNECT CAMERA</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startCamera(selectedDeviceId)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md shadow-emerald-600/20"
                      >
                        <Video className="w-4 h-4" />
                        <span>ACTIVATE CAMERA</span>
                      </button>
                    )}

                    {devices.length > 1 && (
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => {
                          setSelectedDeviceId(e.target.value);
                          if (isCameraActive) startCamera(e.target.value);
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                      >
                        {devices.map((d, i) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera Device ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    onClick={captureLocalFrame}
                    disabled={!isCameraActive || isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-400 text-emerald-800 font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-50"
                  >
                    <Crosshair className="w-4 h-4 text-emerald-600" />
                    <span>MANUAL RECON SCAN</span>
                  </button>
                </div>
              ) : (
                /* IP Webcam Field Mode */
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[280px]">
                      <Globe className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={ipWebcamUrl}
                        onChange={(e) => setIpWebcamUrl(e.target.value)}
                        placeholder="http://192.168.1.100:8080/video or /shot.jpg"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 pl-9 text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-xs font-sans"
                      />
                    </div>

                    {isIpStreamActive ? (
                      <button
                        onClick={stopIpStream}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <VideoOff className="w-4 h-4" />
                        <span>DISCONNECT IP CAM</span>
                      </button>
                    ) : (
                      <button
                        onClick={startIpStream}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <Wifi className="w-4 h-4" />
                        <span>CONNECT IP STREAM</span>
                      </button>
                    )}

                    <button
                      onClick={captureIpFrame}
                      disabled={!isIpStreamActive || isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-emerald-50 border border-emerald-400 text-emerald-800 font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-50"
                    >
                      <Crosshair className="w-4 h-4 text-emerald-600" />
                      <span>POLL FRAME</span>
                    </button>
                  </div>

                  {/* Preset Helper Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-sans">
                    <span className="font-bold text-slate-600 font-mono">QUICK PRESETS:</span>
                    <button
                      onClick={() => setIpWebcamUrl('http://192.168.1.7:8080/video')}
                      className="px-2.5 py-1 rounded bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold hover:bg-emerald-200 shadow-sm flex items-center gap-1"
                    >
                      <span>📱 My Phone (192.168.1.7:8080/video)</span>
                    </button>
                    <button
                      onClick={() => setIpWebcamUrl('http://192.168.1.7:8080/shot.jpg')}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-sm"
                    >
                      Phone Snapshot (/shot.jpg)
                    </button>
                    <button
                      onClick={() => setIpWebcamUrl('http://192.168.1.50:8080/video')}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-sm"
                    >
                      Default IP Webcam (:8080)
                    </button>
                  </div>

                  {ipStreamError && (
                    <div className="p-2.5 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{ipStreamError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rescue Action Dispatch Hub */}
          <div className="tac-card rounded-xl p-5 border border-emerald-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs">
              <span className="font-black text-slate-900 tracking-wider flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-100 text-red-600">
                  <Ambulance className="w-4 h-4" />
                </div>
                <span>TACTICAL CASUALTY RESCUE ACTIONS</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DISPATCH PROTOCOL READY
              </span>
            </div>

            {/* Active Status Alert Banner */}
            {activeRescueStatus && (
              <div
                className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between shadow-sm ${
                  activeRescueStatus.status === 'en_route'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 animate-pulse'
                    : 'bg-emerald-50 border-emerald-400 text-emerald-900'
                }`}
              >
                <span className="font-bold">{activeRescueStatus.text}</span>
                <button
                  onClick={() => setActiveRescueStatus(null)}
                  className="text-slate-500 hover:text-slate-800 text-xs px-2 font-bold"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleDispatchRescue(null)}
                className="py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Ambulance className="w-5 h-5" />
                <span>🚨 DISPATCH RESCUE TEAM NOW</span>
              </button>

              <button
                onClick={() => handleMarkRescued(activeRescueStatus?.id)}
                className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>✅ MARK AS RESCUED / EXTRACTED</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: GIS Map & Casualty Registry */}
        <div className="space-y-4">
          {/* Tactical GIS Google Map */}
          <div className="tac-card rounded-xl p-4 border border-emerald-200 bg-white shadow-sm space-y-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>GOOGLE MAPS // ONGOLE RADAR [{location.lat.toFixed(4)}, {location.lng.toFixed(4)}]</span>
              </div>

              {/* Relocate & Google Maps Links */}
              <div className="flex items-center gap-2">
                <button
                  onClick={setOngoleLocation}
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-900 rounded font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                  title="Lock exact Ongole, AP coordinates [15.5059, 80.0499]"
                >
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>ONGOLE HQ</span>
                </button>

                <button
                  onClick={detectExactLocation}
                  disabled={isLocating}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-bold text-[10px] flex items-center gap-1 transition disabled:opacity-50"
                  title="Acquire current high-accuracy device GPS coordinates"
                >
                  <Locate className={`w-3 h-3 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'LOCKING GPS...' : 'MY GPS'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-bold text-[10px] flex items-center gap-1 transition"
                  title="Open current sensor location in official Google Maps"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                  <span>GOOGLE MAPS</span>
                </a>
              </div>
            </div>

            {/* Google Map Layer Switcher Tabs */}
            <div className="flex items-center justify-between text-[10px] font-sans pb-1">
              <span className="text-slate-500 font-mono">MAP VIEW:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setGoogleMapLayer('streets')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    googleMapLayer === 'streets'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Roadmap
                </button>
                <button
                  onClick={() => setGoogleMapLayer('satellite')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    googleMapLayer === 'satellite'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setGoogleMapLayer('terrain')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    googleMapLayer === 'terrain'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terrain
                </button>
              </div>
            </div>

            {/* Active Road Map Directions HUD Bar */}
            {activeRoute && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2 text-xs shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                      <Route className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block sm:inline">
                        ROAD ROUTE ACTIVE: {activeRoute.distance} ({activeRoute.duration})
                      </span>
                      <span className="text-[11px] text-emerald-800 block sm:inline sm:ml-2">
                        → {activeRoute.destinationName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeRoute.steps && activeRoute.steps.length > 0 && (
                      <button
                        onClick={() => setShowTurnSteps(!showTurnSteps)}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                      >
                        <CornerDownRight className="w-3 h-3 text-emerald-600" />
                        <span>{showTurnSteps ? 'HIDE TURNS' : `${activeRoute.steps.length} TURNS`}</span>
                      </button>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${activeRoute.origin[0]},${activeRoute.origin[1]}&destination=${activeRoute.destination[0]},${activeRoute.destination[1]}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center gap-1 shadow-sm transition"
                      title="Open turn-by-turn driving directions in official Google Maps"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>OPEN GOOGLE MAPS</span>
                    </a>

                    <button
                      onClick={() => setActiveRoute(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs px-1.5 font-bold"
                      title="Clear Route"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Step-by-Step Road Driving Maneuvers */}
                {showTurnSteps && activeRoute.steps && (
                  <div className="bg-white p-2.5 rounded-md border border-emerald-200 space-y-1.5 text-[11px]">
                    <div className="font-bold text-emerald-800 border-b pb-1 flex items-center gap-1">
                      <Route className="w-3.5 h-3.5" />
                      <span>TURN-BY-TURN ROAD DIRECTIONS:</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-sans">
                      {activeRoute.steps.map((step) => (
                        <div key={step.id} className="flex items-start justify-between gap-2 text-slate-700">
                          <span className="flex items-center gap-1">
                            <span className="font-mono text-emerald-600 font-bold">{step.id}.</span>
                            <span>{step.instruction}</span>
                          </span>
                          {step.distance && (
                            <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">{step.distance}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="h-64 rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
              <MapErrorBoundary onReset={setOngoleLocation}>
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  {/* Auto-fit map viewport to frame road routes or center */}
                  <MapRouteFitter activeRoute={activeRoute} center={mapCenter} />

                  {/* Live Google Maps Tile Layer */}
                  {googleMapLayer === 'satellite' ? (
                    <TileLayer
                      attribution='&copy; Google Maps Satellite'
                      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      maxZoom={20}
                    />
                  ) : googleMapLayer === 'terrain' ? (
                    <TileLayer
                      attribution='&copy; Google Maps Terrain'
                      url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                      maxZoom={20}
                    />
                  ) : (
                    <TileLayer
                      attribution='&copy; Google Maps'
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      maxZoom={20}
                    />
                  )}

                  {/* Radar Search Radius */}
                  {typeof location.lat === 'number' && !isNaN(location.lat) && typeof location.lng === 'number' && !isNaN(location.lng) && (
                    <Circle
                      center={[location.lat, location.lng]}
                      radius={750}
                      pathOptions={{
                        color: '#10b981',
                        fillColor: '#10b981',
                        fillOpacity: 0.15,
                        weight: 2,
                      }}
                    />
                  )}

                  {/* Sensor Marker */}
                  {typeof location.lat === 'number' && !isNaN(location.lat) && typeof location.lng === 'number' && !isNaN(location.lng) && (
                    <Marker position={[location.lat, location.lng]} icon={rescueIcon}>
                      <Popup>
                        <div className="font-mono text-xs text-slate-800 space-y-1">
                          <div className="font-bold text-emerald-700">CAMERA SENSOR (ONGOLE)</div>
                          <div>LAT: {location.lat}</div>
                          <div>LNG: {location.lng}</div>
                          <div className="text-red-600 font-bold">CASUALTIES DETECTED: {detectedPersonsList.length}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Live Detected Persons on Google Maps */}
                  {detectedPersonsList.map((person) => {
                    if (!person || typeof person.lat !== 'number' || isNaN(person.lat) || typeof person.lng !== 'number' || isNaN(person.lng)) {
                      return null;
                    }
                    return (
                      <Marker
                        key={person.id}
                        position={[person.lat, person.lng]}
                        icon={detectedPersonIcon(person.index, person.status === 'Rescue En Route')}
                      >
                        <Popup>
                          <div className="font-mono text-xs text-slate-800 space-y-2 p-1 min-w-[210px]">
                            <div className="flex items-center justify-between border-b pb-1">
                              <span className="font-black text-red-600 flex items-center gap-1">
                                <span>🚨</span> CASUALTY #{person.index}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {person.confidence}% CONF
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              <div>GPS: <b>{person.lat}, {person.lng}</b></div>
                              <div>
                                STATUS:{' '}
                                <span
                                  className={`font-bold ${
                                    person.status === 'Rescue En Route' ? 'text-amber-700' : 'text-red-700'
                                  }`}
                                >
                                  {person.status}
                                </span>
                              </div>
                            </div>
                            <div className="pt-1 flex flex-col gap-1.5">
                              <button
                                onClick={() =>
                                  handleDispatchRescue({
                                    id: person.id,
                                    lat: person.lat,
                                    lng: person.lng,
                                    victims: 1,
                                    source: `Detected Person #${person.index} (${person.confidence}% Conf)`,
                                  })
                                }
                                className="w-full py-1.5 px-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                              >
                                <Route className="w-3.5 h-3.5" />
                                <span>DISPATCH ROAD DIRECTIONS</span>
                              </button>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${Number(location.lat) - 0.009},${Number(location.lng) - 0.007}&destination=${person.lat},${person.lng}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                                <span>OPEN IN GOOGLE MAPS</span>
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Road Map Directions Polyline & Markers */}
                  {activeRoute && Array.isArray(activeRoute.coordinates) && activeRoute.coordinates.length > 1 && (
                    <>
                      <Polyline
                        positions={activeRoute.coordinates}
                        pathOptions={{
                          color: '#047857',
                          weight: 6,
                          opacity: 0.95,
                          lineCap: 'round',
                          lineJoin: 'round',
                        }}
                      />
                      <Polyline
                        positions={activeRoute.coordinates}
                        pathOptions={{
                          color: '#34d399',
                          weight: 3,
                          opacity: 0.9,
                          dashArray: '8, 8',
                        }}
                      />
                      {/* Dispatched SAR Ambulance Station Marker */}
                      {Array.isArray(activeRoute.origin) && typeof activeRoute.origin[0] === 'number' && !isNaN(activeRoute.origin[0]) && (
                        <Marker position={activeRoute.origin} icon={ambulanceIcon}>
                          <Popup>
                            <div className="font-mono text-xs text-slate-800 space-y-1">
                              <div className="font-bold text-emerald-700">🚑 SAR UNIT ECHO-1 (DISPATCH BASE)</div>
                              <div>EN ROUTE TO: {activeRoute.destinationName}</div>
                              <div>DISTANCE: {activeRoute.distance} | ETA: {activeRoute.duration}</div>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      {/* Moving Ambulance Marker along Route */}
                      {routeProgressIndex > 0 &&
                        routeProgressIndex < activeRoute.coordinates.length &&
                        Array.isArray(activeRoute.coordinates[routeProgressIndex]) &&
                        typeof activeRoute.coordinates[routeProgressIndex][0] === 'number' &&
                        !isNaN(activeRoute.coordinates[routeProgressIndex][0]) && (
                          <Marker position={activeRoute.coordinates[routeProgressIndex]} icon={ambulanceIcon}>
                            <Popup>
                              <div className="font-mono text-xs text-slate-800 space-y-1">
                                <div className="font-bold text-emerald-700">🚑 SAR AMBULANCE EN ROUTE</div>
                                <div>Progress: {Math.round((routeProgressIndex / activeRoute.coordinates.length) * 100)}% along sector road</div>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      {/* Destination Target Marker */}
                      {Array.isArray(activeRoute.destination) && typeof activeRoute.destination[0] === 'number' && !isNaN(activeRoute.destination[0]) && (
                        <Marker position={activeRoute.destination} icon={targetCasualtyIcon}>
                          <Popup>
                            <div className="font-mono text-xs text-slate-800 space-y-1">
                              <div className="font-bold text-red-600">⚠ RESCUE DESTINATION</div>
                              <div>TARGET: {activeRoute.destinationName}</div>
                              <div className="text-emerald-700 font-bold">SAR UNIT EN ROUTE</div>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </>
                  )}

                  {/* Active Rescue Markers */}
                  {rescueIncidents.map((inc) => {
                    if (!inc || typeof inc.lat !== 'number' || isNaN(inc.lat) || typeof inc.lng !== 'number' || isNaN(inc.lng)) {
                      return null;
                    }
                    return (
                      <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={rescueIcon}>
                        <Popup>
                          <div className="font-mono text-xs text-slate-800 space-y-1">
                            <div className="font-bold text-emerald-700">{inc.id}</div>
                            <div>STATUS: {inc.status}</div>
                            <div>CASUALTIES: {inc.victims}</div>
                            <div>SOURCE: {inc.source}</div>
                            <div className="pt-1.5 flex flex-col gap-1">
                              <button
                                onClick={() => handleDispatchRescue(inc)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <Route className="w-3 h-3" />
                                <span>Show Road Directions</span>
                              </button>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${inc.lat},${inc.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 underline font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>Google Maps Turn-by-Turn</span>
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </MapErrorBoundary>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
              <span>LAT: {location.lat.toFixed(5)}</span>
              <span>LNG: {location.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Live Detected Casualties List on Google Maps */}
          <div className="tac-card rounded-xl p-4 border border-emerald-200 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span>DETECTED CASUALTIES ON GMAPS</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSimulatingVictim(!isSimulatingVictim)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    isSimulatingVictim
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Simulate 1 casualty to test Google Maps road direction immediately"
                >
                  {isSimulatingVictim ? 'SIMULATION ON' : 'TEST CASUALTY'}
                </button>
                <span className="text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {detectedPersonsList.length} TARGETS
                </span>
              </div>
            </div>

            {detectedPersonsList.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-sans">
                <span>No active detected persons in field of view. Click </span>
                <button
                  onClick={() => setIsSimulatingVictim(true)}
                  className="text-emerald-700 font-bold underline hover:text-emerald-800"
                >
                  TEST CASUALTY
                </button>
                <span> to preview road direction routing.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                {detectedPersonsList.map((person) => (
                  <div
                    key={person.id}
                    className="p-2.5 rounded-lg border border-red-200 bg-red-50/50 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-red-900">
                        <span>👤 CASUALTY #{person.index}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded font-normal">
                          {person.confidence}% Match
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        GPS: {person.lat}, {person.lng}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleDispatchRescue({
                            id: person.id,
                            lat: person.lat,
                            lng: person.lng,
                            victims: 1,
                            source: `Detected Person #${person.index} (${person.confidence}% Conf)`,
                          })
                        }
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                        title="Calculate & Show Road Driving Directions on Google Maps"
                      >
                        <Route className="w-3 h-3" />
                        <span>DISPATCH</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rescue Casualty Registry */}
          <div className="tac-card rounded-xl p-4 border border-emerald-200 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800">CASUALTY & RESCUE LOGS</span>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {rescueIncidents.length} EVENTS
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
              {rescueIncidents.length === 0 ? (
                <p className="text-slate-400 py-8 text-center text-xs">NO INCIDENTS RECORDED</p>
              ) : (
                rescueIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`p-3 rounded-lg border transition flex items-center justify-between gap-2 shadow-sm ${
                      inc.status === 'Rescue En Route'
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                        : inc.status === 'Rescued'
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-slate-900">{inc.id}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({inc.time})</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="font-bold text-red-600">{inc.victims} Victim(s)</span> |{' '}
                        <span className="text-slate-500">
                          {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {inc.source}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Road Directions Button */}
                      <button
                        onClick={() => handleDispatchRescue(inc)}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 border border-emerald-400 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
                        title="Show Driving Road Direction on Google Maps"
                      >
                        <Route className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Route</span>
                      </button>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          inc.status === 'Rescued'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {inc.status}
                      </span>

                      {inc.status !== 'Rescued' && (
                        <button
                          onClick={() => handleMarkRescued(inc.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-sm"
                          title="Mark as Rescued"
                        >
                          RESCUED
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalWebcamDashboard;
