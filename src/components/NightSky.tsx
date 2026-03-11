import { useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  life: number;
  maxLife: number;
}

export function NightSky() {
  const { theme } = useTheme();
  const isActive = theme === "evening";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const clickCountRef = useRef(0);
  const nextThresholdRef = useRef(5 + Math.floor(Math.random() * 3));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      baseOpacity: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.3 + Math.random() * 1.2,
      twinklePhase: Math.random() * Math.PI * 2,
      depth: 0.2 + Math.random() * 0.8,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    const handleClick = () => {
      clickCountRef.current++;
      if (clickCountRef.current >= nextThresholdRef.current) {
        clickCountRef.current = 0;
        nextThresholdRef.current = 5 + Math.floor(Math.random() * 3);
        shootingStarsRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.4),
          angle: Math.PI / 4 + (Math.random() - 0.5) * (Math.PI / 3),
          speed: 6 + Math.random() * 4,
          length: 80 + Math.random() * 60,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const animate = (time: number) => {
      const lerpFactor = 0.04;
      targetOffsetRef.current = {
        x: (mouseRef.current.x - 0.5) * -100,
        y: (mouseRef.current.y - 0.5) * -60,
      };
      offsetRef.current = {
        x:
          offsetRef.current.x +
          (targetOffsetRef.current.x - offsetRef.current.x) * lerpFactor,
        y:
          offsetRef.current.y +
          (targetOffsetRef.current.y - offsetRef.current.y) * lerpFactor,
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = time / 1000;

      // Draw stars
      for (const star of starsRef.current) {
        const twinkle =
          0.5 +
          0.5 * Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity * (0.4 + 0.6 * twinkle);
        const px =
          star.x * canvas.width + offsetRef.current.x * star.depth;
        const py =
          star.y * canvas.height + offsetRef.current.y * star.depth;
        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      // Draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter(
        (ss) => ss.life < ss.maxLife
      );
      for (const ss of shootingStarsRef.current) {
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        const progress = ss.life / ss.maxLife;
        const alpha =
          progress < 0.2
            ? progress / 0.2
            : progress < 0.7
            ? 1
            : (1 - progress) / 0.3;
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
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
