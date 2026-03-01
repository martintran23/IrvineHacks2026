"use client";

import { useEffect } from "react";

export function Particles() {
  useEffect(() => {
    const container = document.getElementById("particles-container");
    if (!container) return;

    const particleCount = 80;
    const particles: HTMLDivElement[] = [];

    // Add CSS animation if not already added
    if (!document.getElementById("particles-style")) {
      const style = document.createElement("style");
      style.id = "particles-style";
      style.textContent = `
        @keyframes float-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(var(--move-x-1), var(--move-y-1)) scale(1.2);
            opacity: 0.5;
          }
          50% {
            transform: translate(var(--move-x-2), var(--move-y-2)) scale(0.8);
            opacity: 0.2;
          }
          75% {
            transform: translate(var(--move-x-3), var(--move-y-3)) scale(1.1);
            opacity: 0.4;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const size = 2 + Math.random() * 2; // 2-4px
      const moveX1 = (Math.random() * 200 - 100) + "px";
      const moveY1 = (Math.random() * 200 - 100) + "px";
      const moveX2 = (Math.random() * 200 - 100) + "px";
      const moveY2 = (Math.random() * 200 - 100) + "px";
      const moveX3 = (Math.random() * 200 - 100) + "px";
      const moveY3 = (Math.random() * 200 - 100) + "px";
      const duration = 8 + Math.random() * 12; // 8-20s
      const delay = Math.random() * 5;
      
      particle.className = "particle";
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        pointer-events: none;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float-particle ${duration}s infinite ease-in-out;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.6), 0 0 ${size * 3}px rgba(94, 234, 212, 0.3);
        --move-x-1: ${moveX1};
        --move-y-1: ${moveY1};
        --move-x-2: ${moveX2};
        --move-y-2: ${moveY2};
        --move-x-3: ${moveX3};
        --move-y-3: ${moveY3};
        z-index: 1;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return <div id="particles-container" className="fixed inset-0 pointer-events-none z-0" />;
}
