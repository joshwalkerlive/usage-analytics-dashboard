import { useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Animated retro background — active only for the "retro" theme.
 * Renders a perspective grid floor with floating neon shapes.
 * Follows the NightSky / SunriseGlow architectural pattern.
 */
export function RetroEffects() {
  const { theme } = useTheme();
  const isActive = theme === "retro";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }
    resize();
    window.addEventListener("resize", resize);

    // --- floating neon shapes ---
    interface NeonShape {
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotSpeed: number;
      vx: number;
      vy: number;
      type: "diamond" | "triangle" | "cross";
      hue: number; // 0 = pink, 1 = cyan, 2 = green
      opacity: number;
      phase: number;
    }

    const NEON_COLORS = [
      [255, 45, 120],  // hot pink
      [0, 229, 255],   // cyan
      [57, 255, 20],   // neon green
    ];

    const shapes: NeonShape[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 6 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.15 - Math.random() * 0.3,
      type: (["diamond", "triangle", "cross"] as const)[
        Math.floor(Math.random() * 3)
      ],
      hue: Math.floor(Math.random() * 3),
      opacity: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    function drawGrid() {
      const horizonY = h * 0.45;
      const vanishX = w * 0.5;

      // --- perspective grid floor ---
      ctx!.save();
      ctx!.globalAlpha = 0.12;

      // Horizontal lines receding to horizon
      const numHLines = 14;
      for (let i = 0; i <= numHLines; i++) {
        const frac = i / numHLines;
        // Exponential spacing for perspective
        const perspFrac = Math.pow(frac, 2.2);
        const y = horizonY + perspFrac * (h - horizonY);
        const alpha = 0.06 + frac * 0.12;

        ctx!.strokeStyle = `rgba(255, 45, 120, ${alpha})`;
        ctx!.lineWidth = 0.5 + frac * 0.8;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      // Vertical lines converging to vanishing point
      const numVLines = 16;
      for (let i = -numVLines / 2; i <= numVLines / 2; i++) {
        const bottomX = vanishX + i * (w / numVLines) * 1.8;
        const alpha = 0.05 + (1 - Math.abs(i) / (numVLines / 2)) * 0.08;

        ctx!.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx!.lineWidth = 0.6;
        ctx!.beginPath();
        ctx!.moveTo(vanishX, horizonY);
        ctx!.lineTo(bottomX, h);
        ctx!.stroke();
      }

      ctx!.restore();

      // Horizon glow line
      const horizGrad = ctx!.createLinearGradient(0, horizonY - 2, 0, horizonY + 4);
      horizGrad.addColorStop(0, "rgba(255, 45, 120, 0)");
      horizGrad.addColorStop(0.5, "rgba(255, 45, 120, 0.15)");
      horizGrad.addColorStop(1, "rgba(255, 45, 120, 0)");
      ctx!.fillStyle = horizGrad;
      ctx!.fillRect(0, horizonY - 2, w, 6);
    }

    function drawShape(shape: NeonShape) {
      const [r, g, b] = NEON_COLORS[shape.hue];
      const flicker = 0.6 + Math.sin(t * 3 + shape.phase) * 0.4;
      const alpha = shape.opacity * flicker;

      ctx!.save();
      ctx!.translate(shape.x, shape.y);
      ctx!.rotate(shape.rotation);
      ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx!.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
      ctx!.shadowBlur = 8;
      ctx!.lineWidth = 1.2;

      const s = shape.size;

      if (shape.type === "diamond") {
        ctx!.beginPath();
        ctx!.moveTo(0, -s);
        ctx!.lineTo(s * 0.7, 0);
        ctx!.lineTo(0, s);
        ctx!.lineTo(-s * 0.7, 0);
        ctx!.closePath();
        ctx!.stroke();
      } else if (shape.type === "triangle") {
        ctx!.beginPath();
        ctx!.moveTo(0, -s);
        ctx!.lineTo(s * 0.87, s * 0.5);
        ctx!.lineTo(-s * 0.87, s * 0.5);
        ctx!.closePath();
        ctx!.stroke();
      } else {
        // cross
        const arm = s * 0.3;
        ctx!.beginPath();
        ctx!.moveTo(-arm, -s);
        ctx!.lineTo(arm, -s);
        ctx!.lineTo(arm, -arm);
        ctx!.lineTo(s, -arm);
        ctx!.lineTo(s, arm);
        ctx!.lineTo(arm, arm);
        ctx!.lineTo(arm, s);
        ctx!.lineTo(-arm, s);
        ctx!.lineTo(-arm, arm);
        ctx!.lineTo(-s, arm);
        ctx!.lineTo(-s, -arm);
        ctx!.lineTo(-arm, -arm);
        ctx!.closePath();
        ctx!.stroke();
      }

      ctx!.restore();
    }

    function draw() {
      t += 0.006;
      ctx!.clearRect(0, 0, w, h);

      // Subtle top-down gradient vignette
      const vignette = ctx!.createRadialGradient(
        w * 0.5, h * 0.4, 0,
        w * 0.5, h * 0.4, Math.max(w, h) * 0.8
      );
      vignette.addColorStop(0, "rgba(17, 0, 25, 0)");
      vignette.addColorStop(0.7, "rgba(7, 0, 13, 0.05)");
      vignette.addColorStop(1, "rgba(7, 0, 13, 0.12)");
      ctx!.fillStyle = vignette;
      ctx!.fillRect(0, 0, w, h);

      drawGrid();

      // Update and draw shapes
      for (const shape of shapes) {
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation += shape.rotSpeed;

        // Wrap around
        if (shape.y < -20) {
          shape.y = h + 20;
          shape.x = Math.random() * w;
        }
        if (shape.x < -20) shape.x = w + 20;
        if (shape.x > w + 20) shape.x = -20;

        drawShape(shape);
      }

      // Scrolling grid animation — shift horizontal lines
      const gridScroll = (t * 30) % 60;
      ctx!.save();
      ctx!.globalAlpha = 0.04;
      for (let i = 0; i < 3; i++) {
        const y = h * 0.45 + gridScroll + i * 60;
        if (y < h) {
          ctx!.strokeStyle = "rgba(255, 45, 120, 0.2)";
          ctx!.lineWidth = 0.5;
          ctx!.beginPath();
          ctx!.moveTo(0, y);
          ctx!.lineTo(w, y);
          ctx!.stroke();
        }
      }
      ctx!.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.85,
      }}
    />
  );
}
