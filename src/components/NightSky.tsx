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

interface UAP {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  glowIntensity: number;
}

export function NightSky() {
  const { theme } = useTheme();
  const isActive = theme === "evening";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const uapRef = useRef<UAP | null>(null);
  const lastUAPTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const clickCountRef = useRef(0);
  const nextThresholdRef = useRef(5 + Math.floor(Math.random() * 3));
  const rafRef = useRef<number>(0);

  // Dancing auras state
  const dancingAurasRef = useRef<Array<{ startTime: number; duration: number; index: number }>>([]);
  const nextAuraTimeRef = useRef(Date.now() + (2 + Math.random() * 2) * 60000);

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
      baseOpacity: 0.15 + Math.random() * 0.35,
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

      // Manage dancing auras
      const now = Date.now();
      if (now >= nextAuraTimeRef.current && dancingAurasRef.current.length === 0) {
        // Time to spawn new dancing auras
        const numAuras = Math.random() < 0.5 ? 1 : 2;
        const usedIndices = new Set<number>();
        for (let i = 0; i < numAuras; i++) {
          let index: number;
          do {
            index = Math.floor(Math.random() * 3);
          } while (usedIndices.has(index));
          usedIndices.add(index);
          dancingAurasRef.current.push({
            startTime: now,
            duration: 2000 + Math.random() * 4000, // 2-6 seconds in ms
            index,
          });
        }
        // Schedule next dancing aura activation: 2-4 minutes
        nextAuraTimeRef.current = now + 120000 + Math.random() * 120000;
      }

      // Remove expired dancing auras
      dancingAurasRef.current = dancingAurasRef.current.filter((aura) => {
        return now - aura.startTime < aura.duration;
      });

      // Create a set of currently dancing aura indices for easy lookup
      const dancingAuraIndices = new Set(dancingAurasRef.current.map((a) => a.index));

      // Draw Northern Lights aura
      const auroraRotation = elapsed * 0.1;
      const auroras = [
        {
          centerX: canvas.width * 0.3,
          centerY: canvas.height * 0.2,
          color1: "rgba(100, 220, 180, 0.35)",
          color2: "rgba(100, 220, 180, 0)",
        },
        {
          centerX: canvas.width * 0.7,
          centerY: canvas.height * 0.25,
          color1: "rgba(150, 180, 220, 0.35)",
          color2: "rgba(150, 180, 220, 0)",
        },
        {
          centerX: canvas.width * 0.5,
          centerY: canvas.height * 0.3,
          color1: "rgba(200, 150, 220, 0.30)",
          color2: "rgba(200, 150, 220, 0)",
        },
      ];

      for (let i = 0; i < auroras.length; i++) {
        const aurora = auroras[i];
        const isDancing = dancingAuraIndices.has(i);

        // Get dancing animation progress if active
        let danceMultiplier = 1;
        if (isDancing) {
          const activeAura = dancingAurasRef.current.find((a) => a.index === i);
          if (activeAura) {
            const elapsed = now - activeAura.startTime;
            const progress = elapsed / activeAura.duration;
            // Pulsing effect: increases opacity during dance, peaks at 60%, then fades
            danceMultiplier = progress < 0.6
              ? 1 + (progress / 0.6) * 1.5  // ramp up to 2.5x
              : 1 + ((1 - progress) / 0.4) * 1.5;  // fade back to 1x
          }
        }

        // Parse and enhance colors based on dance state
        const color1 = aurora.color1.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/, (match, r, g, b, a) => {
          const newAlpha = Math.min(1, parseFloat(a) * danceMultiplier);
          return `rgba(${r},${g},${b},${newAlpha})`;
        });
        const color2 = aurora.color2.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/, (match, r, g, b, a) => {
          const newAlpha = Math.min(1, parseFloat(a) * danceMultiplier);
          return `rgba(${r},${g},${b},${newAlpha})`;
        });

        const auroraGrad = ctx.createRadialGradient(
          aurora.centerX,
          aurora.centerY,
          canvas.width * 0.1,
          aurora.centerX,
          aurora.centerY,
          canvas.width * 0.5
        );
        auroraGrad.addColorStop(0, color1);
        auroraGrad.addColorStop(1, color2);
        ctx.fillStyle = auroraGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Milky Way galaxy band
      const milkyWayGradient = ctx.createLinearGradient(
        -canvas.width * 0.3,
        canvas.height * 0.15,
        canvas.width * 1.3,
        canvas.height * 0.7
      );
      milkyWayGradient.addColorStop(0, "rgba(180, 160, 220, 0)");
      milkyWayGradient.addColorStop(0.25, "rgba(200, 180, 240, 0.04)");
      milkyWayGradient.addColorStop(0.5, "rgba(220, 200, 255, 0.075)");
      milkyWayGradient.addColorStop(0.75, "rgba(200, 180, 240, 0.04)");
      milkyWayGradient.addColorStop(1, "rgba(180, 160, 220, 0)");
      ctx.fillStyle = milkyWayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of starsRef.current) {
        const twinkle =
          0.5 +
          0.5 * Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity * (0.05 + 0.95 * twinkle);
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

      // Spawn UAP every 45-75 seconds
      const uapSpawnTime = Date.now();
      if (uapSpawnTime - lastUAPTimeRef.current > 45000 + Math.random() * 30000 && !uapRef.current) {
        uapRef.current = {
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.4),
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 1.5,
          life: 0,
          maxLife: 300 + Math.random() * 200,
          glowIntensity: Math.random() * 0.5 + 0.5,
        };
        lastUAPTimeRef.current = uapSpawnTime;
      }

      // Update and draw UAP
      if (uapRef.current) {
        uapRef.current.life++;
        uapRef.current.x += uapRef.current.vx;
        uapRef.current.y += uapRef.current.vy;

        const uapProgress = uapRef.current.life / uapRef.current.maxLife;
        let uapAlpha = uapProgress < 0.15 ? uapProgress / 0.15 : uapProgress > 0.85 ? (1 - uapProgress) / 0.15 : 1;
        uapAlpha *= uapRef.current.glowIntensity;

        // Draw UAP glow
        const glowGrad = ctx.createRadialGradient(uapRef.current.x, uapRef.current.y, 0, uapRef.current.x, uapRef.current.y, 40);
        glowGrad.addColorStop(0, `rgba(100, 200, 255, ${uapAlpha * 0.6})`);
        glowGrad.addColorStop(1, `rgba(100, 200, 255, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.fillRect(uapRef.current.x - 50, uapRef.current.y - 50, 100, 100);

        // Draw UAP body (oval)
        ctx.save();
        ctx.translate(uapRef.current.x, uapRef.current.y);
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 12, Math.atan2(uapRef.current.vy, uapRef.current.vx), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120, 220, 255, ${uapAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(150, 230, 255, ${uapAlpha * 0.3})`;
        ctx.fill();
        ctx.restore();

        if (uapRef.current.life >= uapRef.current.maxLife) {
          uapRef.current = null;
        }
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
