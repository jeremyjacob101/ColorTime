import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import PchipInterpolator

def get_full_spectrum_6_segment(n_points: int = 2400, inset: float = 40.0, wiggle: float = 5.0):
    low = inset
    high = 255.0 - inset
    
    # Anchor Waypoints
    # We added 18:00 (Sunset Red) to force the path into that corner
    waypoints = [
        [low + 20, low, high - 20],   # 00:00 - Midnight (Deep Blue/Purple)
        [low, high - 20, high - 20],  # 04:00 - Pre-Dawn (Cyan/Teal)
        [low + 20, high, low + 20],   # 08:00 - Morning (Vibrant Green)
        [high, high, low],            # 12:00 - Noon (Pure Yellow)
        [high, 160.0, low],           # 15:00 - Afternoon (Deep Orange)
        [high, low, low],             # 18:00 - SUNSET RED (Pure Red Anchor)
        [high, low, high - 20],       # 21:00 - Late Pink/Magenta
        [low + 20, low, high - 20],   # 24:00 - Cycle Reset
    ]
    
    waypoint_data = np.array(waypoints)
    # Map the anchors to their respective times
    t_waypoints = [0, 4, 8, 12, 15, 18, 21, 24]
    
    f_interp = PchipInterpolator(t_waypoints, waypoint_data, axis=0)
    
    t_fine = np.linspace(0, 24, n_points)
    path = f_interp(t_fine)

    if wiggle > 0:
        noise_x = np.sin(t_fine * 10) * np.cos(t_fine * 4)
        noise_y = np.cos(t_fine * 8) * np.sin(t_fine * 3)
        noise_z = np.sin(t_fine * 6) * np.sin(t_fine * 5)
        noise = np.stack([noise_x, noise_y, noise_z], axis=1)
        path += noise * wiggle

    return np.clip(path, 0.0, 255.0)

def main():
    path = get_full_spectrum_6_segment(inset=30.0, wiggle=10.0)
    R, G, B = path[:, 0], path[:, 1], path[:, 2]

    fig = plt.figure(figsize=(12, 9))
    ax = fig.add_subplot(111, projection="3d")
    ax.set_title("24-Hour Color Orbit: Full Spectrum (With Red Corner)")

    line_colors = path / 255.0
    ax.scatter(R, G, B, c=line_colors, s=8, alpha=0.5)

    # Label the main transitions
    anchor_labels = {0: "0:00", 4: "4:00", 8: "8:00", 12: "12:00", 18: "18:00 (Red)", 21: "21:00"}
    for h, label in anchor_labels.items():
        idx = int((h / 24.0) * len(path))
        ax.text(R[idx], G[idx], B[idx], f" {label}", fontweight='bold', fontsize=10)

    # Standard Cube Setup
    ax.set_xlim(0, 255); ax.set_ylim(0, 255); ax.set_zlim(0, 255)
    ax.set_xlabel('Red'); ax.set_ylabel('Green'); ax.set_zlabel('Blue')
    ax.view_init(elev=25, azim=-50)
    
    plt.show()

if __name__ == "__main__":
    main()