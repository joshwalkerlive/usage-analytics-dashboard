import { useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Animated sunrise gradient background — active only for the "morning" theme.
 * Follows the same architectural pattern as NightSky (fixed canvas, z-index 1,
 * pointer-events none, theme-gated rendering).
 */
export function SunriseGlow() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isActive = theme === "morning";

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

    // --- light ray particles ---
    interface Ray {
      x: number;
      angle: number;
      width: number;
      speed: number;
      opacity: number;
      length: number;
    }

    const rays: Ray[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * w,
      angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.6,
      width: 30 + Math.random() * 80,
      speed: 0.08 + Math.random() * 0.15,
      opacity: 0.03 + Math.random() * 0.06,
      length: h * (0.4 + Math.random() * 0.4),
    }));

    // --- floating warm dust motes ---
    interface Mote {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      opacity: number;
      phase: number;
    }

    const motes: Mote[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.25,
      opacity: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    function draw() {
      t += 0.008;
      ctx!.clearRect(0, 0, w, h);

      // --- base gradient: deep indigo at top → warm amber at bottom ---
      const horizonY = h * 0.85;
      const grad = ctx!.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(26, 31, 58, 0.0)");      // transparent top
      grad.addColorStop(0.3, "rgba(88, 48, 100, 0.15)");   // purple mid
      grad.addColorStop(0.6, "rgba(200, 100, 50, 0.18)");  // warm orange
      grad.addColorStop(0.85, "rgba(245, 166, 35, 0.22)"); // amber horizon
      grad.addColorStop(1, "rgba(245, 166, 35, 0.12)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // --- sun glow at bottom-centre ---
      const sunX = w * 0.5;
      const sunY = horizonY + 20;
      const pulse = 1 + Math.sin(t * 0.7) * 0.08;
      const sunGrad = ctx!.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, 320 * pulse
      );
      sunGrad.addColorStop(0, "rgba(245, 180, 60, 0.25)");
      sunGrad.addColorStop(0.4, "rgba(245, 150, 40, 0.10)");
      sunGrad.addColorStop(1, "rgba(245, 130, 30, 0.0)");
      ctx!.fillStyle = sunGrad;
      ctx!.fillRect(0, h * 0.3, w, h * 0.7);

      // --- light rays ---
      for (const ray of rays) {
        const sway = Math.sin(t * ray.speed + ray.x * 0.001) * 30;
        const rx = ray.x + sway;

        ctx!.save();
        ctx!.globalAlpha = ray.opacity * (0.7 + Math.sin(t * ray.speed * 2) * 0.3);
        ctx!.translate(rx, horizonY);
        ctx!.rotate(ray.angle);

        const rg = ctx!.createLinearGradient(0, 0, 0, -ray.length);
        rg.addColorStop(0, "rgba(245, 180, 80, 0.6)");
        rg.addColorStop(0.5, "rgba(245, 166, 35, 0.2)");
        rg.addColorStop(1, "rgba(245, 166, 35, 0.0)");
        ctx!.fillStyle = rg;

        ctx!.beginPath();
        ctx!.moveTo(-ray.width / 2, 0);
        ctx!.lineTo(-ray.width * 0.1, -ray.length);
        ctx!.lineTo(ray.width * 0.1, -ray.length);
        ctx!.lineTo(ray.width / 2, 0);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
      }

      // --- dust motes ---
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        const flicker = 0.5 + Math.sin(t * 3 + m.phase) * 0.5;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 200, 100, ${m.opacity * flicker})`;
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
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
