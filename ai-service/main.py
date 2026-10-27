import io
import time
import base64
from typing import Optional, List
from datetime import datetime

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(
    title="AeroSentry AI Drone Victim Detection Service",
    description="Microservice providing real-time YOLOv8 person/victim detection for drone disaster response.",
    version="1.0.0"
)

# Enable CORS for cross-service calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLOv8 model (Nano model for fast, lightweight inference)
MODEL_NAME = "yolov8n.pt"
print(f"[*] Initializing YOLOv8 model: {MODEL_NAME}...")
try:
    model = YOLO(MODEL_NAME)
    print(f"[+] YOLOv8 model '{MODEL_NAME}' successfully loaded.")
except Exception as e:
    print(f"[-] Error loading YOLO model: {e}")
    model = None


class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    confidence: float


class DetectionResponse(BaseModel):
    victimCount: int
    boundingBoxes: List[BoundingBox]
    processedImageBase64: str
    processingTimeMs: float
    gpsLocation: Optional[dict] = None
    detectedAt: str


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "aerosentry-ai-service",
        "model": MODEL_NAME,
        "modelLoaded": model is not None,
        "targetClass": "person (class 0)",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


def draw_tactical_hud(
    image: np.ndarray,
    boxes: List[dict],
    lat: Optional[float] = None,
    lng: Optional[float] = None
) -> np.ndarray:
    """
    Renders tactical mission-control HUD telemetry and victim bounding boxes.
    """
    annotated = image.copy()
    h, w = annotated.shape[:2]

    # Draw top HUD telemetry bar (semi-transparent dark bar)
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, 42), (10, 15, 25), -1)
    cv2.addWeighted(overlay, 0.75, annotated, 0.25, 0, annotated)

    # Top HUD text: System & GPS Coordinates
    coord_str = f"GPS: {lat:.6f}, {lng:.6f}" if (lat is not None and lng is not None) else "GPS: SATELLITE LOCK ACQUIRED"
    hud_title = f"AEGIS UAV FLIR/OPTICAL | {coord_str} | VICTIMS DETECTED: {len(boxes)}"
    cv2.putText(annotated, hud_title, (16, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 240, 255), 2, cv2.LINE_AA)

    # Draw bottom telemetry bar
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, h - 30), (w, h), (10, 15, 25), -1)
    cv2.addWeighted(overlay, 0.75, annotated, 0.25, 0, annotated)
    timestamp_str = f"UTC: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} | SENSOR: OPTICAL-RGB | AI: YOLOv8n"
    cv2.putText(annotated, timestamp_str, (16, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 180, 200), 1, cv2.LINE_AA)

    # Draw each victim detection with tactical styling
    for i, box in enumerate(boxes, start=1):
        bx = int(box["x"])
        by = int(box["y"])
        bw = int(box["w"])
        bh = int(box["h"])
        conf = box["confidence"]

        # Ensure bounds stay within image
        x1 = max(0, bx)
        y1 = max(0, by)
        x2 = min(w, bx + bw)
        y2 = min(h, by + bh)

        # High-visibility warning colors: Crimson Red / Amber / Neon Red
        box_color = (30, 45, 240)  # BGR Red
        accent_color = (0, 220, 255)  # Cyan accent for corner crosshairs

        # Draw semi-transparent victim highlight area
        victim_roi = annotated[y1:y2, x1:x2]
        if victim_roi.size > 0:
            tint = np.full_like(victim_roi, (0, 20, 180))  # red tint
            cv2.addWeighted(tint, 0.2, victim_roi, 0.8, 0, victim_roi)
            annotated[y1:y2, x1:x2] = victim_roi

        # Main bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2)

        # Tactical corner brackets (HUD crosshair effect)
        corner_len = min(18, bw // 3, bh // 3)
        if corner_len > 4:
            # Top-left
            cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), accent_color, 3)
            cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), accent_color, 3)
            # Top-right
            cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), accent_color, 3)
            cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), accent_color, 3)
            # Bottom-left
            cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), accent_color, 3)
            cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), accent_color, 3)
            # Bottom-right
            cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), accent_color, 3)
            cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), accent_color, 3)

        # Tactical target label tag
        label = f"VICTIM #{i} [{int(conf * 100)}%]"
        (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.52, 2)
        tag_y = max(y1 - 6, text_h + 8)
        cv2.rectangle(annotated, (x1, tag_y - text_h - 4), (x1 + text_w + 8, tag_y + 4), box_color, -1)
        cv2.putText(annotated, label, (x1 + 4, tag_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2, cv2.LINE_AA)

    return annotated


@app.post("/detect", response_model=DetectionResponse)
async def detect_victims(
    image: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    confidence_threshold: Optional[float] = Form(0.25)
):
    """
    Accepts an uploaded drone image + optional GPS coordinates.
    Runs YOLOv8 person detection (class 0).
    Returns victim count, bounding box coordinates, and base64 annotated image.
    """
    start_time = time.time()

    if model is None:
        raise HTTPException(status_code=503, detail="YOLOv8 AI detection model is not initialized.")

    # Read image contents
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Run inference with YOLOv8 (filtering for class 0 = person)
    # ultralytics model inference
    results = model.predict(
        source=pil_image,
        classes=[0],  # 0 is 'person' in COCO dataset
        conf=confidence_threshold,
        verbose=False
    )

    boxes_out: List[BoundingBox] = []
    boxes_raw_dict: List[dict] = []

    if results and len(results) > 0:
        boxes = results[0].boxes
        for box in boxes:
            # xyxy format: [x1, y1, x2, y2]
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0].item())

            x1, y1, x2, y2 = xyxy
            bx = round(float(x1), 2)
            by = round(float(y1), 2)
            bw = round(float(x2 - x1), 2)
            bh = round(float(y2 - y1), 2)

            box_item = BoundingBox(
                x=bx,
                y=by,
                w=bw,
                h=bh,
                confidence=round(conf, 4)
            )
            boxes_out.append(box_item)
            boxes_raw_dict.append({
                "x": bx,
                "y": by,
                "w": bw,
                "h": bh,
                "confidence": conf
            })

    # Annotate image with HUD & Bounding Boxes
    annotated_cv = draw_tactical_hud(cv_image, boxes_raw_dict, lat=lat, lng=lng)

    # Encode annotated image to Base64 JPEG
    success, buffer = cv2.imencode(".jpg", annotated_cv, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image.")

    base64_encoded = base64.b64encode(buffer).decode("utf-8")
    processing_time_ms = round((time.time() - start_time) * 1000, 2)

    gps_dict = None
    if lat is not None and lng is not None:
        gps_dict = {"lat": lat, "lng": lng}

    return DetectionResponse(
        victimCount=len(boxes_out),
        boundingBoxes=boxes_out,
        processedImageBase64=f"data:image/jpeg;base64,{base64_encoded}",
        processingTimeMs=processing_time_ms,
        gpsLocation=gps_dict,
        detectedAt=datetime.utcnow().isoformat() + "Z"
    )


class FramePayload(BaseModel):
    image: str
    confidence_threshold: Optional[float] = 0.25
    lat: Optional[float] = None
    lng: Optional[float] = None


@app.post("/detect_frame", response_model=DetectionResponse)
async def detect_frame_base64(payload: FramePayload):
    """
    Accepts base64 encoded image directly from webcam canvas for high frame-rate streaming.
    """
    start_time = time.time()
    if model is None:
        raise HTTPException(status_code=503, detail="YOLOv8 AI model is not initialized.")

    try:
        raw_b64 = payload.image
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        img_bytes = base64.b64decode(raw_b64)
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    results = model.predict(
        source=pil_image,
        classes=[0],  # person
        conf=payload.confidence_threshold or 0.25,
        verbose=False
    )

    boxes_out: List[BoundingBox] = []
    boxes_raw_dict: List[dict] = []

    if results and len(results) > 0:
        boxes = results[0].boxes
        for box in boxes:
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = xyxy
            bx = round(float(x1), 2)
            by = round(float(y1), 2)
            bw = round(float(x2 - x1), 2)
            bh = round(float(y2 - y1), 2)

            box_item = BoundingBox(x=bx, y=by, w=bw, h=bh, confidence=round(conf, 4))
            boxes_out.append(box_item)
            boxes_raw_dict.append({"x": bx, "y": by, "w": bw, "h": bh, "confidence": conf})

    annotated_cv = draw_tactical_hud(cv_image, boxes_raw_dict, lat=payload.lat, lng=payload.lng)
    success, buffer = cv2.imencode(".jpg", annotated_cv, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image.")

    base64_encoded = base64.b64encode(buffer).decode("utf-8")
    processing_time_ms = round((time.time() - start_time) * 1000, 2)

    gps_dict = None
    if payload.lat is not None and payload.lng is not None:
        gps_dict = {"lat": payload.lat, "lng": payload.lng}

    return DetectionResponse(
        victimCount=len(boxes_out),
        boundingBoxes=boxes_out,
        processedImageBase64=f"data:image/jpeg;base64,{base64_encoded}",
        processingTimeMs=processing_time_ms,
        gpsLocation=gps_dict,
        detectedAt=datetime.utcnow().isoformat() + "Z"
    )


class IPStreamPayload(BaseModel):
    stream_url: str
    confidence_threshold: Optional[float] = 0.25
    lat: Optional[float] = None
    lng: Optional[float] = None


@app.post("/detect_ip_stream", response_model=DetectionResponse)
async def detect_ip_webcam(payload: IPStreamPayload):
    """
    Connects to a remote IP Webcam (HTTP MJPEG, RTSP, or snapshot URL), grabs the latest frame,
    and runs YOLOv8 victim detection with zero CORS friction.
    """
    import requests
    import socket
    from urllib.parse import urlparse

    start_time = time.time()
    if model is None:
        raise HTTPException(status_code=503, detail="YOLOv8 AI model is not initialized.")

    url = payload.stream_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="stream_url is required.")

    # Fast pre-flight TCP reachability check (1.2s timeout) to avoid 30s hangs when device is offline
    parsed = urlparse(url if "://" in url else f"http://{url}")
    host = parsed.hostname
    port = parsed.port or 8080

    if host and not host.startswith(("localhost", "127.0.0.1")):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.2)
        try:
            sock.connect((host, port))
            sock.close()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reach {host}:{port}. Ensure phone and PC are on the SAME Wi-Fi (or laptop is on phone's hotspot) and IP Webcam server is running."
            )

    cv_image = None

    # Handle snapshot URLs and standard Android IP Webcam port 8080 endpoints
    base_origin = f"{parsed.scheme or 'http'}://{parsed.netloc}"
    test_urls = []
    
    # Prioritize /shot.jpg for instant zero-latency snapshots from IP Webcam
    if "/video" in url:
        test_urls.append(f"{base_origin}/shot.jpg")
        test_urls.append(url)
    elif url.endswith((".jpg", ".jpeg")):
        test_urls.append(url)
    else:
        test_urls.append(f"{base_origin}/shot.jpg")
        test_urls.append(f"{base_origin}/video")
        test_urls.append(url)

    # Try fast HTTP snapshot request first
    for target in test_urls:
        try:
            resp = requests.get(target, timeout=2.0, headers={"User-Agent": "AeroSentry/1.0"})
            if resp.status_code == 200 and len(resp.content) > 1000:
                nparr = np.frombuffer(resp.content, np.uint8)
                decoded = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if decoded is not None and decoded.size > 0:
                    cv_image = decoded
                    break
        except Exception:
            pass

    # If HTTP snapshot failed, fallback to OpenCV VideoCapture
    if cv_image is None:
        try:
            cap = cv2.VideoCapture(url)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                cv_image = frame
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to capture frame from IP stream: {str(e)}")

    if cv_image is None or cv_image.size == 0:
        raise HTTPException(status_code=400, detail="Could not capture valid video frame from IP webcam URL. Check URL path (e.g. /video or /shot.jpg).")

    # Convert to PIL for YOLO
    pil_image = Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))

    results = model.predict(
        source=pil_image,
        classes=[0],  # person
        conf=payload.confidence_threshold or 0.25,
        verbose=False
    )

    boxes_out: List[BoundingBox] = []
    boxes_raw_dict: List[dict] = []

    if results and len(results) > 0:
        boxes = results[0].boxes
        for box in boxes:
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = xyxy
            bx = round(float(x1), 2)
            by = round(float(y1), 2)
            bw = round(float(x2 - x1), 2)
            bh = round(float(y2 - y1), 2)

            box_item = BoundingBox(x=bx, y=by, w=bw, h=bh, confidence=round(conf, 4))
            boxes_out.append(box_item)
            boxes_raw_dict.append({"x": bx, "y": by, "w": bw, "h": bh, "confidence": conf})

    annotated_cv = draw_tactical_hud(cv_image, boxes_raw_dict, lat=payload.lat, lng=payload.lng)
    success, buffer = cv2.imencode(".jpg", annotated_cv, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image.")

    base64_encoded = base64.b64encode(buffer).decode("utf-8")
    processing_time_ms = round((time.time() - start_time) * 1000, 2)

    gps_dict = None
    if payload.lat is not None and payload.lng is not None:
        gps_dict = {"lat": payload.lat, "lng": payload.lng}

    return DetectionResponse(
        victimCount=len(boxes_out),
        boundingBoxes=boxes_out,
        processedImageBase64=f"data:image/jpeg;base64,{base64_encoded}",
        processingTimeMs=processing_time_ms,
        gpsLocation=gps_dict,
        detectedAt=datetime.utcnow().isoformat() + "Z"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
