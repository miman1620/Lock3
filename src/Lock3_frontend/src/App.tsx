import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { VoiceProvider } from './contexts/VoiceContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateEscrow from './pages/CreateEscrow';
import Dashboard from './pages/Dashboard';
import Disputes from './pages/Disputes';
import ParticleBackground from './components/ParticleBackground';
import VoiceAssistant from './components/VoiceAssistant';

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Router>
          <VoiceProvider>
            <div className="min-h-screen bg-dark-gradient relative">
              <ParticleBackground />
              <div className="relative z-10">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/create" element={<CreateEscrow />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/disputes" element={<Disputes />} />
                </Routes>
              </div>
              <VoiceAssistant />
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'rgba(30, 30, 63, 0.9)',
                    color: '#fff',
                    border: '1px solid rgba(4, 152, 236, 0.3)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
            </div>
          </VoiceProvider>
        </Router>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;