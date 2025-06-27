import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Users, Lock, ArrowRight, Star, TrendingUp, Globe, Cpu } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from './components/Logo';
import { useWallet } from './contexts/WalletContext';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<HTMLDivElement>(null);
  const { icpPrice } = useWallet();

  useEffect(() => {
    // Hero animations
    const tl = gsap.timeline();
    
    tl.fromTo('.hero-logo', 
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.7)' }
    )
    .fromTo('.hero-title', 
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo('.hero-subtitle', 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.hero-buttons', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.2'
    );

    // Improved typewriter effect
    if (typewriterRef.current) {
      const text = "Decentralized Escrow. Zero Trust.";
      const element = typewriterRef.current;
      
      // Clear any existing content
      element.innerHTML = '';
      
      let index = 0;
      let isDeleting = false;
      let currentText = '';
      
      const typeEffect = () => {
        if (!isDeleting && index < text.length) {
          // Typing
          currentText = text.substring(0, index + 1);
          element.innerHTML = currentText + '<span class="animate-pulse text-icp-blue">|</span>';
          index++;
          setTimeout(typeEffect, 100);
        } else if (!isDeleting && index === text.length) {
          // Pause at end
          setTimeout(() => {
            isDeleting = true;
            typeEffect();
          }, 2000);
        } else if (isDeleting && index > 0) {
          // Deleting
          currentText = text.substring(0, index - 1);
          element.innerHTML = currentText + '<span class="animate-pulse text-icp-blue">|</span>';
          index--;
          setTimeout(typeEffect, 50);
        } else if (isDeleting && index === 0) {
          // Start over
          isDeleting = false;
          setTimeout(typeEffect, 500);
        }
      };
      
      // Start the effect after a delay
      setTimeout(typeEffect, 1500);
    }

    // Feature cards animation
    gsap.fromTo('.feature-card',
      { y: 80, opacity: 0, rotationX: 45 },
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        }
      }
    );

    // Stats animation
    gsap.fromTo('.stat-item',
      { scale: 0.5, opacity: 0, rotation: 180 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        }
      }
    );

    // Floating animation for hero elements
    gsap.to('.float-element', {
      y: -20,
      duration: 3,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

    // Parallax scrolling
    gsap.to('.parallax-bg', {
      yPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

  }, []);

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Trustless Security',
      description: 'Smart contracts ensure funds are secure without intermediaries on Internet Computer',
      gradient: 'from-icp-blue to-cyan-400',
      delay: 0
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Lightning Fast',
      description: 'Sub-second finality with ICP\'s revolutionary consensus mechanism',
      gradient: 'from-icp-purple to-pink-400',
      delay: 0.1
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Multi-Party Support',
      description: 'Complex multi-signature escrow arrangements with DAO governance',
      gradient: 'from-neon-green to-teal-400',
      delay: 0.2
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'Asset Protection',
      description: 'Secure storage for ICP, ICRC-1 tokens, NFTs, and digital assets',
      gradient: 'from-orange-400 to-red-400',
      delay: 0.3
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Global Access',
      description: 'Borderless transactions with no geographical restrictions',
      gradient: 'from-blue-400 to-indigo-400',
      delay: 0.4
    },
    {
      icon: <Cpu className="h-8 w-8" />,
      title: 'AI-Powered',
      description: 'Intelligent dispute resolution with machine learning algorithms',
      gradient: 'from-purple-400 to-violet-400',
      delay: 0.5
    }
  ];

  const stats = [
    { value: '50M+', label: 'ICP Secured', icon: <Shield className="h-6 w-6" />, color: 'text-icp-blue' },
    { value: '12.5K+', label: 'Escrows Created', icon: <TrendingUp className="h-6 w-6" />, color: 'text-neon-green' },
    { value: '99.9%', label: 'Success Rate', icon: <Star className="h-6 w-6" />, color: 'text-yellow-400' },
    { value: '<1s', label: 'Settlement Time', icon: <Zap className="h-6 w-6" />, color: 'text-icp-purple' }
  ];

  return (
    <div className="min-h-screen pt-16 overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 cyber-grid opacity-10 parallax-bg" />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="float-element absolute top-20 left-10 w-20 h-20 border-2 border-icp-blue/30 rotate-45 animate-pulse" />
          <div className="float-element absolute top-40 right-20 w-16 h-16 border-2 border-icp-purple/30 rounded-full animate-pulse" />
          <div className="float-element absolute bottom-20 left-20 w-12 h-12 border-2 border-neon-green/30 rotate-12 animate-pulse" />
          <div className="float-element absolute bottom-40 right-10 w-24 h-24 border-2 border-neon-pink/30 rounded-lg rotate-45 animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="hero-logo mb-8">
            <Logo size="xl" animated={true} className="mx-auto" />
          </div>
          
          <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-space font-bold mb-6">
            <span className="text-gradient">Lock3</span>
            <br />
            <span className="text-white">Escrow Protocol</span>
          </h1>
          
          <div 
            ref={typewriterRef}
            className="hero-subtitle text-2xl md:text-3xl text-icp-blue mb-8 font-space font-medium h-12 flex items-center justify-center"
          />
          
          <p className="hero-subtitle text-lg md:text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The future of decentralized escrow on Internet Computer. Secure, trustless, and lightning-fast 
            transactions with AI-powered dispute resolution and DAO governance.
          </p>
          
          <div className="hero-buttons flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/create"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 flex items-center justify-center space-x-3 ripple-effect transform-3d"
            >
              <span className="font-space font-semibold text-lg">Create Escrow</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-xl glass border border-icp-blue/30 hover-glow transition-all duration-300 flex items-center justify-center space-x-3 transform-3d"
            >
              <span className="font-space font-semibold text-lg">View Dashboard</span>
            </Link>
          </div>

          {/* Live ICP Price */}
          <div className="mt-12 inline-flex items-center space-x-4 glass rounded-full px-6 py-3">
            <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
            <span className="text-gray-400">Live ICP Price:</span>
            <span className="font-space font-bold text-neon-green">${icpPrice.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-gradient-to-r from-icp-blue/5 via-icp-purple/5 to-neon-green/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center transform-3d">
                <div className="glass rounded-xl p-8 hover-glow transition-all duration-300 card-3d">
                  <div className={`flex items-center justify-center mb-4 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-space font-bold text-gradient mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-space font-bold text-gradient mb-6">
              Next-Generation Features
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Built on Internet Computer's revolutionary blockchain technology for unmatched security, 
              speed, and scalability in decentralized escrow services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card group transform-3d">
                <div className="glass rounded-xl p-8 h-full hover-glow transition-all duration-300 hologram card-3d">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-space font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-icp-blue/10 via-icp-purple/10 to-neon-green/10 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-space font-bold text-gradient mb-6">
            Ready to Secure Your Digital Assets?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join the future of decentralized finance with Lock3's revolutionary escrow protocol.
          </p>
          <Link
            to="/create"
            className="group inline-flex items-center space-x-3 px-10 py-5 rounded-xl bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 ripple-effect transform-3d"
          >
            <span className="font-space font-semibold text-xl">Get Started Now</span>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;