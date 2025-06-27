import React, { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { gsap } from 'gsap';

const VoiceAssistant: React.FC = () => {
  const { isListening, isSupported, startListening, stopListening } = useVoice();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    if (isListening) {
      // Animate button when listening
      gsap.to(buttonRef.current, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Pulse animation
      if (pulseRef.current) {
        gsap.to(pulseRef.current, {
          scale: 2,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          repeat: -1
        });
      }
    } else {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });

      if (pulseRef.current) {
        gsap.killTweensOf(pulseRef.current);
        gsap.set(pulseRef.current, { scale: 1, opacity: 0 });
      }
    }
  }, [isListening]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) return null;

  return (
    <div className="voice-indicator">
      <div
        ref={pulseRef}
        className="absolute inset-0 bg-icp-blue rounded-full opacity-0"
      />
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening 
            ? 'bg-gradient-to-r from-icp-blue to-neon-green shadow-lg' 
            : 'bg-gradient-to-r from-icp-blue to-icp-purple hover:shadow-lg'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice assistant'}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-white" />
        ) : (
          <MicOff className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;