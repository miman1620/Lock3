import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true, className = '' }) => {
  const logoRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  useEffect(() => {
    if (!animated || !logoRef.current) return;

    const logo = logoRef.current;
    const shield = logo.querySelector('.shield');
    const lock = logo.querySelector('.lock');
    const particles = particlesRef.current;

    // Logo breathing animation
    gsap.to(logo, {
      scale: 1.05,
      duration: 2,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    });

    // Shield rotation
    gsap.to(shield, {
      rotation: 360,
      duration: 20,
      ease: 'none',
      repeat: -1
    });

    // Lock glow pulse
    gsap.to(lock, {
      filter: 'drop-shadow(0 0 20px #0498EC)',
      duration: 1.5,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    });

    // Particle animation
    if (particles) {
      const createParticle = () => {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-icp-blue rounded-full opacity-70';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particles.appendChild(particle);

        gsap.fromTo(particle, 
          { 
            x: 0, 
            y: 0, 
            scale: 0,
            opacity: 0.7 
          },
          {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            scale: Math.random() * 2 + 0.5,
            opacity: 0,
            duration: 2,
            ease: 'power2.out',
            onComplete: () => particle.remove()
          }
        );
      };

      const particleInterval = setInterval(createParticle, 300);
      return () => clearInterval(particleInterval);
    }
  }, [animated]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={logoRef}
        className={`${sizeClasses[size]} logo-container`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0498EC" />
            <stop offset="50%" stopColor="#9440FF" />
            <stop offset="100%" stopColor="#00FF9D" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Hexagonal Shield Background */}
        <path 
          className="shield"
          d="M24 4L38 12V36L24 44L10 36V12L24 4Z" 
          fill="url(#lockGradient)" 
          opacity="0.2"
          filter="url(#glow)"
        />
        <path 
          className="shield"
          d="M24 4L38 12V36L24 44L10 36V12L24 4Z" 
          stroke="url(#lockGradient)" 
          strokeWidth="2" 
          fill="none"
        />
        
        {/* Lock Icon */}
        <g className="lock">
          <rect x="18" y="22" width="12" height="10" rx="1.5" fill="url(#lockGradient)"/>
          <path 
            d="M20 22V19C20 16.7909 21.7909 15 24 15C26.2091 15 28 16.7909 28 19V22" 
            stroke="url(#lockGradient)" 
            strokeWidth="2" 
            fill="none"
          />
          <circle cx="24" cy="27" r="2" fill="#0A0A1A"/>
          
          {/* Inner glow */}
          <rect x="18" y="22" width="12" height="10" rx="1.5" fill="none" stroke="url(#lockGradient)" strokeWidth="0.5" opacity="0.5"/>
        </g>
        
        {/* Additional geometric elements */}
        <circle cx="24" cy="24" r="20" stroke="url(#lockGradient)" strokeWidth="0.5" opacity="0.3" fill="none"/>
        <circle cx="24" cy="24" r="16" stroke="url(#lockGradient)" strokeWidth="0.3" opacity="0.2" fill="none"/>
      </svg>
      
      {/* Particle container */}
      {animated && (
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
      )}
    </div>
  );
};

export default Logo;