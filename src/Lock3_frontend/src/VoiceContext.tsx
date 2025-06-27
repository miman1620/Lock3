import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface VoiceContextType {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  lastCommand: string;
  confidence: number;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        speak('Listening for commands');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        const confidenceScore = event.results[0][0].confidence;
        setLastCommand(command);
        setConfidence(confidenceScore);
        handleVoiceCommand(command);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error');
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleVoiceCommand = (command: string) => {
    if (command.includes('hey lock3') || command.includes('lock3')) {
      if (command.includes('create escrow') || command.includes('new escrow')) {
        speak('Navigating to escrow creation');
        navigate('/create');
        toast.success('Voice command: Create Escrow', { icon: '🎤' });
      } else if (command.includes('dashboard') || command.includes('my escrows')) {
        speak('Opening dashboard');
        navigate('/dashboard');
        toast.success('Voice command: Dashboard', { icon: '🎤' });
      } else if (command.includes('disputes') || command.includes('resolve dispute')) {
        speak('Opening disputes panel');
        navigate('/disputes');
        toast.success('Voice command: Disputes', { icon: '🎤' });
      } else if (command.includes('home') || command.includes('main page')) {
        speak('Going home');
        navigate('/');
        toast.success('Voice command: Home', { icon: '🎤' });
      } else if (command.includes('help') || command.includes('what can you do')) {
        speak('I can help you navigate Lock3. Try saying "create escrow", "open dashboard", "view disputes", or "go home"');
        toast('Voice commands available', { 
          icon: '💡',
          duration: 5000
        });
      } else if (command.includes('price') || command.includes('icp price')) {
        speak('Checking current ICP price');
        toast('Voice command: Price Check', { icon: '💰' });
      } else {
        speak('Hello! I can help you navigate Lock3. Try saying "create escrow", "open dashboard", "view disputes", or ask for help');
        toast('Voice assistant activated', { 
          icon: '🎤',
          duration: 3000
        });
      }
    } else {
      // If command doesn't start with "hey lock3", provide guidance
      speak('Please start your command with "Hey Lock3" followed by your request');
      toast('Say "Hey Lock3" to start', { icon: '🎤' });
    }
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      isSupported,
      startListening,
      stopListening,
      speak,
      lastCommand,
      confidence
    }}>
      {children}
    </VoiceContext.Provider>
  );
};