import { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Retro Pac-Man mini-game — only rendered in the "retro" theme.
 * Navigate a maze, eat dots, avoid ghosts.
 */
export function PacManGame() {
  const { theme } = useTheme();
  const isRetro = theme === "retro";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const CELL = 16;
  const COLS = 19;
  const ROWS = 13;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  // Simple maze layout: 1 = wall, 0 = path with dot, 2 = empty (eaten)
  const createMaze = useCallback(() => {
    const m = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
      [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];
    return m;
  }, []);

  const gameRef = useRef({
    pac: { x: 1, y: 1, dir: 0 },
    ghosts: [
      { x: 9, y: 6, dx: 1, dy: 0, color: "#ff0000" },
      { x: 9, y: 7, dx: -1, dy: 0, color: "#ff69b4" },
      { x: 8, y: 6, dx: 0, dy: 1, color: "#00ffff" },
    ],
    maze: createMaze(),
    dotsLeft: 0,
    frame: 0,
    mouthOpen: true,
  });

  const countDots = (maze: number[][]) => {
    let count = 0;
    for (const row of maze) for (const cell of row) if (cell === 0) count++;
    return count;
  };

  const resetGame = useCallback(() => {
    const maze = createMaze();
    gameRef.current = {
      pac: { x: 1, y: 1, dir: 0 },
      ghosts: [
        { x: 9, y: 6, dx: 1, dy: 0, color: "#ff0000" },
        { x: 9, y: 7, dx: -1, dy: 0, color: "#ff69b4" },
        { x: 8, y: 6, dx: 0, dy: 1, color: "#00ffff" },
      ],
      maze,
      dotsLeft: countDots(maze),
      frame: 0,
      mouthOpen: true,
    };
    setScore(0);
    setGameOver(false);
  }, [createMaze]);

  useEffect(() => {
    if (!isRetro || !started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.key === "ArrowRight") g.pac.dir = 0;
      else if (e.key === "ArrowDown") g.pac.dir = 1;
      else if (e.key === "ArrowLeft") g.pac.dir = 2;
      else if (e.key === "ArrowUp") g.pac.dir = 3;
    };
    window.addEventListener("keydown", handleKey);

    const dx = [1, 0, -1, 0];
    const dy = [0, 1, 0, -1];

    function tick() {
      const g = gameRef.current;
      g.frame++;

      // Move pac every 8 frames
      if (g.frame % 8 === 0) {
        g.mouthOpen = !g.mouthOpen;
        const nx = g.pac.x + dx[g.pac.dir];
        const ny = g.pac.y + dy[g.pac.dir];
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && g.maze[ny][nx] !== 1) {
          g.pac.x = nx;
          g.pac.y = ny;
          if (g.maze[ny][nx] === 0) {
            g.maze[ny][nx] = 2;
            g.dotsLeft--;
            setScore((s) => s + 10);
          }
        }
      }

      // Move ghosts every 12 frames
      if (g.frame % 12 === 0) {
        for (const ghost of g.ghosts) {
          // Try current direction, if blocked pick random
          const nx = ghost.x + ghost.dx;
          const ny = ghost.y + ghost.dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && g.maze[ny][nx] !== 1) {
            ghost.x = nx;
            ghost.y = ny;
          } else {
            // Pick a random valid direction
            const dirs = [
              { dx: 1, dy: 0 },
              { dx: -1, dy: 0 },
              { dx: 0, dy: 1 },
              { dx: 0, dy: -1 },
            ].filter((d) => {
              const tx = ghost.x + d.dx;
              const ty = ghost.y + d.dy;
              return tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && g.maze[ty][tx] !== 1;
            });
            if (dirs.length > 0) {
              const pick = dirs[Math.floor(Math.random() * dirs.length)];
              ghost.dx = pick.dx;
              ghost.dy = pick.dy;
            }
          }

          // Check collision
          if (ghost.x === g.pac.x && ghost.y === g.pac.y) {
            setGameOver(true);
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(7, 0, 13, 0.95)";
      ctx.fillRect(0, 0, W, H);

      // Draw maze
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (g.maze[r][c] === 1) {
            ctx.fillStyle = "rgba(60, 60, 180, 0.6)";
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          } else if (g.maze[r][c] === 0) {
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw pac-man
      const px = g.pac.x * CELL + CELL / 2;
      const py = g.pac.y * CELL + CELL / 2;
      const mouthAngle = g.mouthOpen ? 0.3 : 0.05;
      const startAngle = g.pac.dir * (Math.PI / 2) + mouthAngle;
      const endAngle = g.pac.dir * (Math.PI / 2) - mouthAngle + Math.PI * 2;
      ctx.shadowColor = "rgba(255, 255, 0, 0.6)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, CELL / 2 - 1, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw ghosts
      for (const ghost of g.ghosts) {
        const gx = ghost.x * CELL + CELL / 2;
        const gy = ghost.y * CELL + CELL / 2;
        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = ghost.color;
        // Ghost body
        ctx.beginPath();
        ctx.arc(gx, gy - 2, CELL / 2 - 2, Math.PI, 0);
        ctx.lineTo(gx + CELL / 2 - 2, gy + CELL / 2 - 2);
        ctx.lineTo(gx + CELL / 4 - 1, gy + CELL / 3);
        ctx.lineTo(gx, gy + CELL / 2 - 2);
        ctx.lineTo(gx - CELL / 4 + 1, gy + CELL / 3);
        ctx.lineTo(gx - CELL / 2 + 2, gy + CELL / 2 - 2);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gx - 3, gy - 3, 2, 0, Math.PI * 2);
        ctx.arc(gx + 3, gy - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(gx - 2, gy - 3, 1, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 3, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!gameOver) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isRetro, started, gameOver, W, H, COLS, ROWS, CELL]);

  if (!isRetro) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6 text-center">
      <h3 className="text-base font-semibold text-navy-100 mb-1">
        Bonus: Pac-Man
      </h3>
      <p className="text-xs text-navy-400 mb-4">
        Use <span className="text-[#ffff00]">arrow keys</span> to navigate. Eat dots. Avoid ghosts.
      </p>

      {!started ? (
        <button
          onClick={() => {
            resetGame();
            setStarted(true);
          }}
          className="px-5 py-2 text-sm bg-[#ffff00]/20 border border-[#ffff00]/50 text-[#ffff00] hover:bg-[#ffff00]/30 transition-colors"
        >
          Start Game
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-center gap-8 text-sm font-mono">
            <span className="text-[#ffff00]">Score: {score}</span>
            {gameOver && <span className="text-[#ff0000]">Game Over!</span>}
          </div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="mx-auto border border-[#ffff00]/30"
            style={{ maxWidth: "100%" }}
            tabIndex={0}
          />
          <button
            onClick={() => {
              if (gameOver) {
                resetGame();
              } else {
                setStarted(false);
              }
            }}
            className="text-xs text-navy-500 hover:text-navy-300 transition-colors mt-1"
          >
            {gameOver ? "Play Again" : "Stop"}
          </button>
        </div>
      )}
    </div>
  );
}
