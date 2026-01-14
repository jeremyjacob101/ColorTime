import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import PchipInterpolator

def get_safe_wiggling_path(n_points: int = 2000, inset: float = 45.0, wiggle_amount: float = 8.0):
    low = inset
    high = 255.0 - inset

    # Waypoints shifted away from the walls
    corners = {
        "Blackish":   [low,  low,  low],
        "Blueish":    [low,  low,  high],
        "Cyanish":    [low,  high, high],
        "Greenish":   [low,  high, low],
        "Yellowish":  [high, high, low],
        "Orangeish":  [high, 165.0, low], 
        "Reddish":    [high, low,  low],
        "Magentaish": [high, low,  high],
        "Whitish":    [high, high, high],
    }
    
    sequence = ["Blackish", "Blueish", "Cyanish", "Greenish", 
                "Yellowish", "Orangeish", "Reddish", "Magentaish", "Whitish"]
    
    waypoint_data = np.array([corners[name] for name in sequence])
    t_waypoints = np.linspace(0, 1, len(sequence))
    
    # Pchip prevents the 'overshoot' that hits the walls
    f_interp = PchipInterpolator(t_waypoints, waypoint_data, axis=0)
    t_fine = np.linspace(0, 1, n_points)
    path = f_interp(t_fine)

    # Add organic wiggle
    if wiggle_amount > 0:
        # Use prime-like numbers for frequencies to avoid repeating patterns
        noise_x = np.sin(t_fine * 60.0) * np.cos(t_fine * 21.0)
        noise_y = np.cos(t_fine * 44.0) * np.sin(t_fine * 13.0)
        noise_z = np.sin(t_fine * 37.0) * np.sin(t_fine * 29.0)
        
        noise = np.stack([noise_x, noise_y, noise_z], axis=1)
        path += noise * wiggle_amount

    # Final safety clip
    return np.clip(path, 0.0, 255.0)

def main():
    # Toggle these to taste
    WIGGLE = 20.0 
    INSET = 40.0 # Increased slightly to prevent wiggle from hitting walls
    
    path = get_safe_wiggling_path(inset=INSET, wiggle_amount=WIGGLE)
    R, G, B = path[:, 0], path[:, 1], path[:, 2]

    fig = plt.figure(figsize=(12, 9))
    ax = fig.add_subplot(111, projection="3d")
    ax.set_title(f"Safe Rounded Path (No Flattening) | Wiggle: {WIGGLE}")
    
    # Plotting
    line_colors = path / 255.0
    ax.scatter(R, G, B, c=line_colors, s=6, alpha=0.7)

    # Draw the Wireframe
    for i in [0, 255]:
        for j in [0, 255]:
            ax.plot([i, i], [j, j], [0, 255], color='black', lw=0.5, alpha=0.1)
            ax.plot([i, i], [0, 255], [j, j], color='black', lw=0.5, alpha=0.1)
            ax.plot([0, 255], [i, i], [j, j], color='black', lw=0.5, alpha=0.1)

    ax.set_xlim(0, 255); ax.set_ylim(0, 255); ax.set_zlim(0, 255)
    ax.view_init(elev=20, azim=45)
    plt.show()

if __name__ == "__main__":
    main()