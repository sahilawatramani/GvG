import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  color: string;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = [
      "14, 165, 233",  // cyan
      "59, 130, 246",  // blue
      "139, 92, 246",  // purple
      "16, 185, 129",  // green
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const count = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 15000));
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 300 + 100,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          vz: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(14, 165, 233, 0.03)";
      ctx.lineWidth = 0.5;
      const spacing = 80;
      const time = Date.now() * 0.00005;
      const offsetX = (time * 100 % spacing);
      const offsetY = (time * 60 % spacing);

      for (let x = -spacing + offsetX; x < canvas.width + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -spacing + offsetY; y < canvas.height + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle grid
      drawGrid();

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Parallax depth
        const scale = 400 / (400 + p.z);
        const screenX = p.x * scale + (canvas.width * (1 - scale)) / 2;
        const screenY = p.y * scale + (canvas.height * (1 - scale)) / 2;

        // Boundary wrapping
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        if (p.z < 50) p.z = 350;
        if (p.z > 400) p.z = 50;

        // Mouse interaction
        const dx = screenX - mx;
        const dy = screenY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = dist < 150 ? (1 - dist / 150) * 0.02 : 0;
        if (mouseInfluence > 0) {
          p.vx += dx / dist * mouseInfluence;
          p.vy += dy / dist * mouseInfluence;
        }

        // Damping
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Draw particle
        const baseOpacity = p.opacity * scale;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${baseOpacity})`;
        ctx.fill();

        // Outer glow
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * scale * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${baseOpacity * 0.15})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const qs = 400 / (400 + q.z);
          const qx = q.x * qs + (canvas.width * (1 - qs)) / 2;
          const qy = q.y * qs + (canvas.height * (1 - qs)) / 2;
          const d = Math.sqrt((screenX - qx) ** 2 + (screenY - qy) ** 2);

          if (d < 180) {
            const lineOpacity = (1 - d / 180) * 0.12 * Math.min(scale, qs);
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(qx, qy);
            ctx.strokeStyle = `rgba(${p.color}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });
    window.addEventListener("mousemove", handleMouse);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
