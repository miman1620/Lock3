import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Logo from './Logo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text = 'Loading' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const textElement = textRef.current;

    // Floating animation for container
    gsap.to(container, {
      y: -10,
      duration: 2,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    });

    // Text typing animation
    if (textElement) {
      const originalText = text;
      let currentText = '';
      let index = 0;

      const typeText = () => {
        if (index < originalText.length) {
          currentText += originalText[index];
          textElement.textContent = currentText;
          index++;
          setTimeout(typeText, 100);
        } else {
          setTimeout(() => {
            currentText = '';
            index = 0;
            typeText();
          }, 2000);
        }
      };

      typeText();
    }
  }, [text]);

  const sizeClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}>
      <div ref={containerRef} className="relative">
        <Logo size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} animated={true} />
        
        {/* Orbital rings */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full border-2 border-transparent border-t-icp-blue rounded-full opacity-50" />
        </div>
        <div className="absolute inset-2 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="w-full h-full border-2 border-transparent border-r-icp-purple rounded-full opacity-30" />
        </div>
      </div>
      
      <div 
        ref={textRef}
        className="text-icp-blue font-space font-medium tracking-wider"
      >
        {text}
      </div>
      
      {/* Progress dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-icp-blue rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;