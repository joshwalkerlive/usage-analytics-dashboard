import { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Retro Pong mini-game — only rendered in the "retro" theme.
 * Simple single-player Pong against an AI paddle.
 */
export function PongGame() {
  const { theme } = useTheme();
  const isRetro = theme === "retro";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [score, setScore] = useState({ player: 0, cpu: 0 });
  const [started, setStarted] = useState(false);
  const gameRef = useRef({
    ballX: 0,
    ballY: 0,
    ballVX: 0,
    ballVY: 0,
    playerY: 0,
    cpuY: 0,
    mouseY: 0,
    w: 0,
    h: 0,
  });

  const PADDLE_W = 8;
  const PADDLE_H = 48;
  const BALL_R = 5;
  const CPU_SPEED = 2.8;

  const resetBall = useCallback(() => {
    const g = gameRef.current;
    g.ballX = g.w / 2;
    g.ballY = g.h / 2;
    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
    const dir = Math.random() > 0.5 ? 1 : -1;
    g.ballVX = dir * Math.cos(angle) * 3.5;
    g.ballVY = Math.sin(angle) * 3.5;
  }, []);

  useEffect(() => {
    if (!isRetro || !started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    g.w = canvas.width;
    g.h = canvas.height;
    g.playerY = g.h / 2;
    g.cpuY = g.h / 2;
    g.mouseY = g.h / 2;
    resetBall();

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      gameRef.current.mouseY = e.clientY - rect.top;
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      gameRef.current.mouseY = e.touches[0].clientY - rect.top;
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    function draw() {
      const g = gameRef.current;

      // Player paddle follows mouse
      g.playerY += (g.mouseY - g.playerY) * 0.15;
      g.playerY = Math.max(PADDLE_H / 2, Math.min(g.h - PADDLE_H / 2, g.playerY));

      // CPU paddle tracks ball
      const cpuTarget = g.ballX > g.w * 0.3 ? g.ballY : g.h / 2;
      if (g.cpuY < cpuTarget - 4) g.cpuY += CPU_SPEED;
      if (g.cpuY > cpuTarget + 4) g.cpuY -= CPU_SPEED;
      g.cpuY = Math.max(PADDLE_H / 2, Math.min(g.h - PADDLE_H / 2, g.cpuY));

      // Ball movement
      g.ballX += g.ballVX;
      g.ballY += g.ballVY;

      // Top/bottom bounce
      if (g.ballY - BALL_R < 0 || g.ballY + BALL_R > g.h) {
        g.ballVY = -g.ballVY;
        g.ballY = g.ballY - BALL_R < 0 ? BALL_R : g.h - BALL_R;
      }

      // Player paddle collision (right side)
      const pPaddleX = g.w - 20 - PADDLE_W;
      if (
        g.ballX + BALL_R > pPaddleX &&
        g.ballX < pPaddleX + PADDLE_W &&
        g.ballY > g.playerY - PADDLE_H / 2 &&
        g.ballY < g.playerY + PADDLE_H / 2
      ) {
        g.ballVX = -Math.abs(g.ballVX) * 1.05;
        g.ballX = pPaddleX - BALL_R;
        const offset = (g.ballY - g.playerY) / (PADDLE_H / 2);
        g.ballVY += offset * 1.5;
      }

      // CPU paddle collision (left side)
      const cPaddleX = 20;
      if (
        g.ballX - BALL_R < cPaddleX + PADDLE_W &&
        g.ballX > cPaddleX &&
        g.ballY > g.cpuY - PADDLE_H / 2 &&
        g.ballY < g.cpuY + PADDLE_H / 2
      ) {
        g.ballVX = Math.abs(g.ballVX) * 1.05;
        g.ballX = cPaddleX + PADDLE_W + BALL_R;
        const offset = (g.ballY - g.cpuY) / (PADDLE_H / 2);
        g.ballVY += offset * 1.5;
      }

      // Clamp ball speed
      const speed = Math.sqrt(g.ballVX ** 2 + g.ballVY ** 2);
      if (speed > 8) {
        g.ballVX = (g.ballVX / speed) * 8;
        g.ballVY = (g.ballVY / speed) * 8;
      }

      // Score
      if (g.ballX < -10) {
        setScore((s) => ({ ...s, player: s.player + 1 }));
        resetBall();
      }
      if (g.ballX > g.w + 10) {
        setScore((s) => ({ ...s, cpu: s.cpu + 1 }));
        resetBall();
      }

      // --- Draw ---
      ctx!.clearRect(0, 0, g.w, g.h);

      // Background
      ctx!.fillStyle = "rgba(7, 0, 13, 0.85)";
      ctx!.fillRect(0, 0, g.w, g.h);

      // Centre dashed line
      ctx!.setLineDash([4, 6]);
      ctx!.strokeStyle = "rgba(255, 45, 120, 0.3)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(g.w / 2, 0);
      ctx!.lineTo(g.w / 2, g.h);
      ctx!.stroke();
      ctx!.setLineDash([]);

      // Paddles
      ctx!.shadowColor = "rgba(0, 229, 255, 0.8)";
      ctx!.shadowBlur = 10;
      ctx!.fillStyle = "#00e5ff";
      ctx!.fillRect(cPaddleX, g.cpuY - PADDLE_H / 2, PADDLE_W, PADDLE_H);

      ctx!.shadowColor = "rgba(57, 255, 20, 0.8)";
      ctx!.fillStyle = "#39ff14";
      ctx!.fillRect(pPaddleX, g.playerY - PADDLE_H / 2, PADDLE_W, PADDLE_H);

      // Ball
      ctx!.shadowColor = "rgba(255, 45, 120, 0.9)";
      ctx!.shadowBlur = 12;
      ctx!.fillStyle = "#ff2d78";
      ctx!.beginPath();
      ctx!.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isRetro, started, resetBall]);

  if (!isRetro) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6 text-center">
      <h3 className="text-base font-semibold text-navy-100 mb-1">
        Bonus: Pong
      </h3>
      <p className="text-xs text-navy-400 mb-4">
        Move your mouse (or finger) over the game to control the
        <span className="text-[#39ff14]"> green </span>
        paddle.
      </p>

      {!started ? (
        <button
          onClick={() => {
            setScore({ player: 0, cpu: 0 });
            setStarted(true);
          }}
          className="px-5 py-2 text-sm bg-[#ff2d78]/20 border border-[#ff2d78]/50 text-[#ff2d78] hover:bg-[#ff2d78]/30 transition-colors"
        >
          Start Game
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-center gap-8 text-sm font-mono">
            <span className="text-[#00e5ff]">CPU: {score.cpu}</span>
            <span className="text-[#39ff14]">You: {score.player}</span>
          </div>
          <canvas
            ref={canvasRef}
            width={480}
            height={200}
            className="mx-auto border border-[#ff2d78]/30 cursor-none"
            style={{ maxWidth: "100%" }}
          />
          <button
            onClick={() => setStarted(false)}
            className="text-xs text-navy-500 hover:text-navy-300 transition-colors mt-1"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
