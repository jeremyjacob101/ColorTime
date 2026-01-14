const { nativeImage } = require("electron");

function coloredCircleImage(rgb) {
  const px = 32; // 16pt @2x
  const buf = Buffer.alloc(px * px * 4);
  const cx = (px - 1) / 2;
  const cy = (px - 1) / 2;
  const radius = px * 0.38;
  const aa = 1.2;

  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let a = 0;
      if (dist <= radius - aa) {
        a = 255;
      } else if (dist < radius + aa) {
        const t = (radius + aa - dist) / (2 * aa);
        a = Math.round(255 * Math.max(0, Math.min(1, t)));
      }

      const i = (y * px + x) * 4;
      // macOS Bitmap expects BGRA
      buf[i + 0] = rgb.b;
      buf[i + 1] = rgb.g;
      buf[i + 2] = rgb.r;
      buf[i + 3] = a;
    }
  }

  return nativeImage.createFromBitmap(buf, {
    width: px,
    height: px,
    scaleFactor: 2.0,
  });
}

function coloredBarImage(rgb) {
  const width = 250; // Total width of the image buffer
  const height = 24; // Height of the bar
  const barWidth = 180; // How wide the actual color part is
  const radius = 10; // Corner roundness

  // MANUAL ADJUSTMENT: Increase this to move the bar to the right
  const leftPadding = 70;

  const buf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Check if we are within the horizontal bounds of our manual bar
      if (x >= leftPadding && x < leftPadding + barWidth) {
        const localX = x - leftPadding;
        let alpha = 255;

        // Simple Rounded Corner Logic
        const dx =
          localX < radius
            ? radius - localX
            : localX > barWidth - radius
              ? localX - (barWidth - radius)
              : 0;
        const dy =
          y < radius
            ? radius - y
            : y > height - radius
              ? y - (height - radius)
              : 0;

        if (dx > 0 && dy > 0) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius) alpha = 0;
          else if (dist > radius - 1) alpha = Math.round(255 * (radius - dist));
        }

        buf[i + 0] = rgb.b;
        buf[i + 1] = rgb.g;
        buf[i + 2] = rgb.r;
        buf[i + 3] = alpha;
      } else {
        // Everything else is transparent
        buf[i + 3] = 0;
      }
    }
  }

  return nativeImage.createFromBitmap(buf, {
    width: width,
    height: height,
    scaleFactor: 2.0,
  });
}

module.exports = { coloredCircleImage, coloredBarImage };
