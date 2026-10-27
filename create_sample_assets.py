import os
import cv2
import numpy as np

os.makedirs("sample-imagery", exist_ok=True)
os.makedirs("backend/uploads", exist_ok=True)

def generate_drone_rubble_scene(filename, victims=[]):
    """
    Creates a simulated drone overhead/isometric disaster scene
    with debris, rubble textures, and human figures.
    """
    w, h = 800, 600
    # Create base terrain (earthquake rubble / dust / concrete texture)
    base = np.zeros((h, w, 3), dtype=np.uint8)
    base[:] = (65, 75, 80) # concrete grey

    # Add terrain noise/texture
    noise = np.random.randint(-25, 25, (h, w, 3), dtype=np.int16)
    textured = np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Add rubble slabs / fractures
    for _ in range(18):
        pt1 = (np.random.randint(0, w), np.random.randint(0, h))
        pt2 = (pt1[0] + np.random.randint(-150, 150), pt1[1] + np.random.randint(-150, 150))
        cv2.line(textured, pt1, pt2, (40, 45, 50), np.random.randint(2, 6))

    for _ in range(8):
        center = (np.random.randint(50, w - 50), np.random.randint(50, h - 50))
        axes = (np.random.randint(30, 80), np.random.randint(20, 50))
        cv2.ellipse(textured, center, axes, np.random.randint(0, 180), 0, 360, (50, 55, 60), -1)

    # Draw human figures
    for vx, vy, scale in victims:
        # Head
        cv2.circle(textured, (vx, vy), int(7 * scale), (160, 190, 210), -1)
        # Torso / jacket (e.g. red/blue disaster clothing)
        cv2.rectangle(textured, (vx - int(10 * scale), vy + int(7 * scale)), 
                               (vx + int(10 * scale), vy + int(32 * scale)), (40, 50, 180), -1)
        # Legs
        cv2.line(textured, (vx - int(5 * scale), vy + int(32 * scale)), (vx - int(8 * scale), vy + int(55 * scale)), (30, 30, 40), int(5 * scale))
        cv2.line(textured, (vx + int(5 * scale), vy + int(32 * scale)), (vx + int(8 * scale), vy + int(55 * scale)), (30, 30, 40), int(5 * scale))
        # Arms
        cv2.line(textured, (vx - int(10 * scale), vy + int(12 * scale)), (vx - int(20 * scale), vy + int(28 * scale)), (40, 50, 180), int(4 * scale))
        cv2.line(textured, (vx + int(10 * scale), vy + int(12 * scale)), (vx + int(20 * scale), vy + int(28 * scale)), (40, 50, 180), int(4 * scale))

    cv2.imwrite(filename, textured)
    print(f"[+] Saved simulated drone recon asset: {filename}")

# Generate samples
generate_drone_rubble_scene("sample-imagery/drone_recon_alpha.jpg", [(320, 240, 1.3), (480, 280, 1.1)])
generate_drone_rubble_scene("sample-imagery/drone_recon_bravo.jpg", [(250, 200, 1.4)])
generate_drone_rubble_scene("sample-imagery/drone_recon_charlie.jpg", [(400, 300, 1.2), (180, 350, 1.0), (600, 220, 1.1)])

# Copy to backend uploads as default seed assets
import shutil
shutil.copy("sample-imagery/drone_recon_alpha.jpg", "backend/uploads/sample-drone-1.jpg")
shutil.copy("sample-imagery/drone_recon_bravo.jpg", "backend/uploads/sample-drone-2.jpg")
shutil.copy("sample-imagery/drone_recon_charlie.jpg", "backend/uploads/sample-drone-3.jpg")
print("[+] Drone reconnaissance assets ready.")
