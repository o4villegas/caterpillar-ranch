import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Menu, X, Zap, Trophy, Star, Eye } from 'lucide-react';

// Constants
const TIMING = {
  BREATHE_INTERVAL: 3700,
  COLONY_GROWTH: 5000,
  BLINK_MIN: 2000,
  BLINK_MAX: 5000,
  BLINK_DURATION: 200,
  ACCEPTANCE_SHORT: 300,
  ACCEPTANCE_LONG: 500
};

const INFESTATION_THRESHOLDS = {
  HOME: 3,
  MODAL: 7,
  CART: 10,
  CHECKOUT: 20,
  MAX_DISPLAY: 25,
  MAX_COLONY: 25
};

const Z_INDEX = {
  BACKGROUND: 0,
  CONTENT: 10,
  MASCOTS: 20,
  NAVIGATION: 50,
  MODAL: 60,
  ACCEPTANCE: 70
};

const CaterpillarRancchUI = () => {
  // State Management
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [earnedDiscount, setEarnedDiscount] = useState(0);
  const [breathe, setBreathe] = useState(true);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [colonyCount, setColonyCount] = useState(0);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [acceptanceStage, setAcceptanceStage] = useState(0);
  const [hoveredCulling, setHoveredCulling] = useState(false);

  // Computed Values
  const infestationLevel = useMemo(() => {
    let baseLevel = 0;
    if (currentScreen === 'home') baseLevel = INFESTATION_THRESHOLDS.HOME;
    if (showGameModal) baseLevel = INFESTATION_THRESHOLDS.MODAL;
    if (currentScreen === 'cart') baseLevel = INFESTATION_THRESHOLDS.CART;
    if (currentScreen === 'checkout') baseLevel = INFESTATION_THRESHOLDS.CHECKOUT;
    
    return Math.min(baseLevel + colonyCount, INFESTATION_THRESHOLDS.MAX_DISPLAY);
  }, [currentScreen, showGameModal, colonyCount]);

  const slimeIntensity = useMemo(() => {
    return Math.min(infestationLevel / INFESTATION_THRESHOLDS.MAX_DISPLAY, 1);
  }, [infestationLevel]);

  const backgroundStyle = useMemo(() => {
    const intensity = slimeIntensity;
    return {
      background: `linear-gradient(to bottom, 
        rgb(${Math.round(intensity * 20)}, ${Math.round(intensity * 10)}, ${Math.round(intensity * 40)}), 
        rgb(${Math.round(intensity * 30)}, 0, ${Math.round(intensity * 50)}))`
    };
  }, [slimeIntensity]);

  // Breathing animation
  useEffect(() => {
    const breatheInterval = setInterval(() => {
      setBreathe(prev => !prev);
    }, TIMING.BREATHE_INTERVAL);
    return () => clearInterval(breatheInterval);
  }, []);

  // Random eye blinks
  useEffect(() => {
    const doBlink = () => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), TIMING.BLINK_DURATION);
    };
    
    const scheduleNextBlink = () => {
      const delay = Math.random() * (TIMING.BLINK_MAX - TIMING.BLINK_MIN) + TIMING.BLINK_MIN;
      return setTimeout(() => {
        doBlink();
        scheduleNextBlink();
      }, delay);
    };
    
    const timeoutId = scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Colony growth
  useEffect(() => {
    const growthInterval = setInterval(() => {
      setColonyCount(prev => Math.min(prev + 1, INFESTATION_THRESHOLDS.MAX_COLONY));
    }, TIMING.COLONY_GROWTH);
    return () => clearInterval(growthInterval);
  }, []);

  // Acceptance animation trigger
  const triggerAcceptance = useCallback((isFull = false) => {
    setShowAcceptance(true);
    setAcceptanceStage(0);
    
    const stages = isFull ? [0, 1, 2, 3, 4, 5] : [0, 1, 2];
    const duration = isFull ? TIMING.ACCEPTANCE_LONG : TIMING.ACCEPTANCE_SHORT;
    
    const timeouts = stages.map((stage, index) => 
      setTimeout(() => setAcceptanceStage(stage), index * duration)
    );
    
    const finalTimeout = setTimeout(() => {
      setShowAcceptance(false);
      setAcceptanceStage(0);
    }, stages.length * duration + 500);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finalTimeout);
    };
  }, []);

  // Pulsing Stars Background
  const PulsingStars = () => {
    const stars = useMemo(() => {
      return [...Array(20)].map((_, i) => ({
        left: `${(i * 37 + 13) % 95}%`,
        top: `${(i * 41 + 17) % 95}%`,
        size: 1 + (i % 3),
        delay: i * 0.3,
        opacity: 0.1 + (i % 3) * 0.1
      }));
    }, []);

    if (infestationLevel < 5) return null;

    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.BACKGROUND }}>
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-lime-400"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity * slimeIntensity,
              animation: `pulse ${2 + star.delay}s infinite`,
              animationDelay: `${star.delay}s`,
              boxShadow: `0 0 ${4 * star.size}px rgba(50, 205, 50, ${slimeIntensity})`
            }}
          />
        ))}
      </div>
    );
  };

  // Drip SVG Component
  const DripEffect = ({ color = "#FF1493", intensity = 0.6 }) => (
    <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 400 60" preserveAspectRatio="none">
      <path d="M0,0 L0,30 Q20,40 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 L400,30 L400,0 Z" 
            fill={color} opacity={intensity}/>
      <circle cx="50" cy="35" r="8" fill={color} opacity={Math.min(intensity + 0.2, 1)}>
        <animate attributeName="cy" values="35;45;35" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="150" cy="38" r="6" fill={color} opacity={intensity + 0.1}>
        <animate attributeName="cy" values="38;48;38" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="250" cy="36" r="7" fill={color} opacity={Math.min(intensity + 0.2, 1)}>
        <animate attributeName="cy" values="36;46;36" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="350" cy="37" r="5" fill={color} opacity={intensity + 0.1}>
        <animate attributeName="cy" values="37;47;37" dur="3.2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );

  // Floating Mascots (infestation background)
  const FloatingMascots = () => {
    const mascots = useMemo(() => {
      const displayCount = Math.min(infestationLevel, INFESTATION_THRESHOLDS.MAX_DISPLAY);
      return [...Array(displayCount)].map((_, i) => ({
        id: i,
        left: `${(i * 37 + (i * 13)) % 95}%`,
        top: `${(i * 41 + (i * 17)) % 90}%`,
        opacity: i < 5 ? 0.3 : i < 15 ? 0.15 : 0.08,
        rotate: (i * 23) % 60 - 30,
        scale: 0.6 + (i % 3) * 0.2
      }));
    }, [infestationLevel]);
    
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: Z_INDEX.MASCOTS }}>
        {mascots.map((mascot) => (
          <div
            key={mascot.id}
            className="absolute transition-all duration-1000"
            style={{
              left: mascot.left,
              top: mascot.top,
              opacity: mascot.opacity,
              transform: `rotate(${mascot.rotate}deg) scale(${mascot.scale}) ${showAcceptance && acceptanceStage >= 4 ? 'scale(1.2)' : ''}`,
              willChange: 'transform, opacity'
            }}
          >
            <CaterpillarMascot size="small" isBackground={true} />
          </div>
        ))}
      </div>
    );
  };

  // Caterpillar Character
  const CaterpillarMascot = ({ size = "small", isBackground = false }) => {
    const sizeClasses = {
      small: "w-12 h-12",
      medium: "w-20 h-20",
      large: "w-32 h-32"
    };
    const eyeSize = size === "small" ? 4 : size === "medium" ? 6 : 8;
    const eyeSpacing = size === "small" ? 4 : size === "medium" ? 6 : 8;
    
    const smileStretch = hoveredCulling && !isBackground ? 1.8 : 1;
    const eyeGrow = hoveredCulling && !isBackground ? 1.2 : 1;

    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <div className="relative flex items-center">
          <div 
            className="w-full h-full bg-lime-400 rounded-full border-4 border-pink-500 relative" 
            style={{
              boxShadow: `0 0 ${20 * (1 + slimeIntensity)}px rgba(50, 205, 50, ${0.5 + slimeIntensity * 0.3})`,
              transform: `scale(${breathe ? 1.05 : 1}) ${showAcceptance && acceptanceStage >= 4 ? 'scale(1.3)' : ''}`,
              transition: 'transform 3.7s ease-in-out, box-shadow 1s',
              willChange: 'transform'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-1" style={{
              transform: `translateY(-${size === "small" ? 2 : size === "medium" ? 4 : 6}px)`
            }}>
              <div className="bg-black rounded-full transition-all duration-300" style={{
                width: (eyeSize * eyeGrow) + 'px',
                height: eyeBlink ? '2px' : (eyeSize * eyeGrow) + 'px',
                marginRight: eyeSpacing + 'px'
              }}>
                <div className="w-1/3 h-1/3 bg-cyan-400 rounded-full" style={{
                  marginLeft: '60%',
                  marginTop: '10%',
                  opacity: eyeBlink ? 0 : 1
                }}></div>
              </div>
              <div className="bg-black rounded-full transition-all duration-300" style={{
                width: (eyeSize * eyeGrow) + 'px',
                height: eyeBlink ? '2px' : (eyeSize * eyeGrow) + 'px'
              }}>
                <div className="w-1/3 h-1/3 bg-cyan-400 rounded-full" style={{
                  marginLeft: '60%',
                  marginTop: '10%',
                  opacity: eyeBlink ? 0 : 1
                }}></div>
              </div>
            </div>
            
            <div 
              className="absolute left-1/2 transition-all duration-300"
              style={{ 
                bottom: size === "small" ? '8px' : size === "medium" ? '12px' : '16px',
                transform: `translateX(-50%) scaleX(${smileStretch})`,
                width: '66%',
                height: '4px',
                backgroundColor: 'black',
                borderRadius: '999px',
                clipPath: 'ellipse(50% 60% at 50% 0%)',
                transformOrigin: 'center'
              }}
            />
            
            <div className="absolute top-1/2 right-1 w-1 h-1 bg-black rounded-full opacity-30" />
            <div className="absolute top-1/3 right-2 w-1 h-1 bg-black rounded-full opacity-20" />
          </div>
        </div>
      </div>
    );
  };

  // Navigation
  const Navigation = () => (
    <nav 
      className="bg-black text-white p-4 flex items-center justify-between sticky top-0 border-b-4 border-lime-400 relative" 
      style={{
        zIndex: Z_INDEX.NAVIGATION,
        borderImage: 'linear-gradient(90deg, #32CD32, #FF1493, #00CED1) 1',
        borderImageSlice: 1,
        boxShadow: `0 4px 20px rgba(50, 205, 50, ${slimeIntensity * 0.5})`,
        transform: breathe ? 'translateY(0px)' : 'translateY(1px)',
        transition: 'transform 3.7s ease-in-out, box-shadow 1s'
      }}
      aria-label="Main navigation"
    >
      <div className="absolute top-2 right-20 opacity-20">
        <Eye className="w-3 h-3 text-lime-400" style={{
          animation: infestationLevel > 10 ? 'pulse 2s infinite' : 'none'
        }} />
      </div>
      <div className="absolute top-3 right-32 opacity-10">
        <Eye className="w-2 h-2 text-pink-500" />
      </div>
      <button aria-label="Menu">
        <Menu className="w-6 h-6 text-lime-400" />
      </button>
      <div className="flex flex-col items-center -mt-1 relative">
        <CaterpillarMascot size="small" />
        <div className="text-xl tracking-tight font-black text-lime-400 mt-1" style={{
          textShadow: `2px 2px 0px #FF1493, 4px 4px 0px #00CED1, 0 0 ${10 + slimeIntensity * 20}px #32CD32`,
          transform: 'rotate(-2deg)'
        }}>
          CATERPILLAR
        </div>
        <div className="text-2xl font-black tracking-wider relative" style={{
          color: '#FF1493',
          textShadow: `0 4px 0px rgba(255,20,147,0.5), 0 0 ${10 + slimeIntensity * 20}px #FF1493`,
          filter: 'drop-shadow(0 0 10px #FF1493)',
          fontFamily: 'Impact, sans-serif',
          letterSpacing: '3px'
        }}>
          RANCCH
          <div className="absolute -bottom-1 left-0 w-full h-3 bg-gradient-to-b from-pink-500 to-transparent" style={{
            opacity: 0.6 + slimeIntensity * 0.3,
            clipPath: 'polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0)'
          }} />
        </div>
      </div>
      <button className="relative" aria-label="Shopping cart with 2 items">
        <ShoppingCart className="w-6 h-6 text-cyan-400" style={{ transform: 'rotate(5deg)' }} />
        <span className="absolute -top-2 -right-2 bg-lime-400 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-black" style={{ transform: 'rotate(-15deg)' }}>2</span>
      </button>
      <DripEffect color="#32CD32" intensity={0.4 + slimeIntensity * 0.4} />
    </nav>
  );

  // Colony Counter
  const ColonyCounter = () => (
    <div className="mx-4 mb-3 bg-purple-900/80 border-2 border-lime-400 p-2 text-center relative overflow-hidden" style={{
      boxShadow: `0 0 ${20 * (1 + slimeIntensity)}px rgba(50, 205, 50, ${0.3 + slimeIntensity * 0.3})`
    }}>
      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/10 to-pink-500/10" />
      <p className="text-lime-400 font-black text-sm relative z-10" style={{
        textShadow: '2px 2px 0px black',
        animation: infestationLevel > 15 ? 'pulse 2s infinite' : 'none'
      }}>
        🐛 The colony grows: {infestationLevel} friends watching 💚
      </p>
    </div>
  );

  // Daily Challenge
  const DailyChallenge = () => (
    <div className="relative bg-purple-900 text-white p-4 m-4 border-4 border-lime-400 overflow-hidden" style={{
      clipPath: 'polygon(0 0, 98% 0, 100% 5%, 100% 100%, 2% 100%, 0 95%)',
      boxShadow: `8px 8px 0px rgba(50,205,50,${0.3 + slimeIntensity * 0.3})`
    }}>
      <div className="absolute top-2 right-2 opacity-30">
        <CaterpillarMascot size="small" />
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-lime-400 opacity-20 rounded-full blur-2xl" style={{
        animation: 'pulse 3s infinite'
      }} />
      <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-300" style={{ transform: 'rotate(-15deg)' }} />
          <span className="font-black text-lg text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>THE RANCCH NEEDS YOU</span>
        </div>
        <p className="text-sm mb-3 font-bold">Cull 3 invasions, help us spread... earn 25% 🐛💚</p>
        <div className="bg-black/60 h-4 overflow-hidden border-2 border-lime-400 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400 via-pink-500 to-cyan-400 w-1/3" style={{
            clipPath: 'polygon(0 0, 98% 0, 100% 100%, 0 100%)'
          }} />
        </div>
        <p className="text-xs mt-2 text-lime-300 font-bold">1/3 complete • The growth continues</p>
      </div>
      <DripEffect color="#32CD32" intensity={0.6 + slimeIntensity * 0.3} />
    </div>
  );

  // Product Card
  const TShirtCard = ({ title, price, design, modelColor, isRapidFire, onClick, rotation = 0 }) => (
    <button
      onClick={onClick}
      className="bg-gray-900 overflow-hidden relative border-4 border-white hover:border-lime-400 transition-all cursor-pointer w-full text-left"
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)',
        transform: `rotate(${rotation}deg) scale(${breathe ? 1.03 : 1})`,
        boxShadow: `6px 6px 0px rgba(0,0,0,0.5), 0 0 ${20 * slimeIntensity}px ${modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32'}`,
        transition: 'transform 3.7s ease-in-out, border-color 0.3s, box-shadow 1s',
        willChange: 'transform'
      }}
      aria-label={`${title} shirt, $${price}, click to play and earn discount`}
    >
      {isRapidFire && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 flex items-center gap-1 text-xs font-black border-2 border-yellow-400" style={{
          zIndex: Z_INDEX.CONTENT,
          clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)',
          textShadow: '1px 1px 0px black',
          animation: 'pulse 1s infinite'
        }}>
          <Zap className="w-3 h-3" />
          RAPID
        </div>
      )}
      <div className="relative h-56 bg-black flex items-center justify-center overflow-hidden border-b-4" style={{
        borderColor: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32'
      }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-2xl" style={{
            background: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32',
            animation: 'pulse 4s infinite'
          }} />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-3xl" style={{
            background: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32',
            animation: 'pulse 5s infinite'
          }} />
        </div>
        
        <div className="relative flex flex-col items-center" style={{ zIndex: Z_INDEX.CONTENT }}>
          <div className="w-28 h-36 bg-gray-800 relative border-4" style={{
            clipPath: 'polygon(20% 0, 80% 0, 95% 10%, 100% 30%, 100% 100%, 0 100%, 0 30%, 5% 10%)',
            borderColor: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32',
            boxShadow: `0 0 ${20 * (1 + slimeIntensity)}px ${modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32'}`
          }}>
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <div className="text-4xl filter drop-shadow-lg" style={{ 
                transform: `rotate(-5deg) scale(${breathe ? 1.05 : 1})`,
                transition: 'transform 3.7s ease-in-out'
              }}>{design}</div>
            </div>
          </div>
          <div className="flex gap-12 -mt-4">
            <div className="w-5 h-10 bg-gray-800 border-2" style={{
              clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)',
              borderColor: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32',
              transform: 'rotate(-15deg)'
            }} />
            <div className="w-5 h-10 bg-gray-800 border-2" style={{
              clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)',
              borderColor: modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32',
              transform: 'rotate(15deg)'
            }} />
          </div>
        </div>
      </div>

      <div className="p-3 bg-black relative">
        <h3 className="font-bold text-sm mb-1 text-white uppercase tracking-tight" style={{ textShadow: '1px 1px 0px rgba(50,205,50,0.5)' }}>{title}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>${price}</p>
            <p className="text-xs text-pink-500 font-black uppercase">Help us grow: 10-40% 🐛</p>
          </div>
        </div>
        <DripEffect color={modelColor === 'pink' ? '#FF1493' : modelColor === 'cyan' ? '#00CED1' : '#32CD32'} intensity={0.6 + slimeIntensity * 0.3} />
      </div>
    </button>
  );

  // Homepage
  const HomePage = () => (
    <div className="min-h-screen pb-20 relative transition-all duration-1000" style={backgroundStyle}>
      <PulsingStars />
      <FloatingMascots />
      <Navigation />
      <ColonyCounter />
      <DailyChallenge />
      
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-black text-lime-400 uppercase" style={{ 
          textShadow: `3px 3px 0px #FF1493, 0 0 ${10 + slimeIntensity * 20}px #32CD32`,
          transform: 'rotate(-1deg)'
        }}>Growing Now 🔥</h2>
        <button className="text-pink-500 text-sm font-black uppercase border-2 border-pink-500 px-3 py-1 hover:bg-pink-500 hover:text-white transition-colors" style={{
          clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)'
        }}>VIEW ALL</button>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 mb-6">
        <TShirtCard 
          title="Crisis Cat"
          price="35"
          design="😿"
          modelColor="pink"
          isRapidFire={true}
          onClick={() => setShowGameModal(true)}
          rotation={-1}
        />
        <TShirtCard 
          title="Pizza Cult"
          price="32"
          design="🍕"
          modelColor="cyan"
          onClick={() => setShowGameModal(true)}
          rotation={2}
        />
        <TShirtCard 
          title="Overthinking Dino"
          price="35"
          design="🦕"
          modelColor="lime"
          onClick={() => setShowGameModal(true)}
          rotation={1}
        />
        <TShirtCard 
          title="Caffeine Demon"
          price="33"
          design="☕"
          modelColor="pink"
          isRapidFire={true}
          onClick={() => setShowGameModal(true)}
          rotation={-2}
        />
      </div>

      <div className="mx-4 relative bg-purple-900 border-4 border-cyan-400 p-5 overflow-hidden" style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 98%, 95% 100%, 0 100%)',
        boxShadow: `8px 8px 0px rgba(0,206,209,${0.3 + slimeIntensity * 0.3})`
      }}>
        <div className="absolute top-2 right-2 opacity-20">
          <CaterpillarMascot size="medium" />
        </div>
        <div className="absolute top-0 right-0 text-9xl opacity-10 font-black">🐛</div>
        <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-6 h-6 text-yellow-300" style={{ transform: 'rotate(-15deg)' }} />
            <span className="font-black text-lg text-cyan-400 uppercase" style={{ textShadow: '2px 2px 0px black' }}>Top Contributors</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center bg-black/60 p-2 border-2 border-yellow-400 font-bold">
              <span className="text-white">🥇 jenny_codes</span>
              <span className="text-yellow-300">40% spread</span>
            </div>
            <div className="flex justify-between items-center bg-black/60 p-2 border-2 border-gray-500 font-bold">
              <span className="text-white">🥈 mike_vibes</span>
              <span className="text-gray-300">38% spread</span>
            </div>
            <div className="flex justify-between items-center bg-black/60 p-2 border-2 border-orange-500 font-bold">
              <span className="text-white">🥉 sarah_plays</span>
              <span className="text-orange-300">35% spread</span>
            </div>
          </div>
          <button className="mt-4 w-full bg-cyan-400 text-black font-black py-3 uppercase border-4 border-pink-500 hover:bg-lime-400 transition-colors" style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
            textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
          }}>
            Join The RANCCH 💚
          </button>
        </div>
        <DripEffect color="#00CED1" intensity={0.6 + slimeIntensity * 0.3} />
      </div>
    </div>
  );

  // Game Modal
  const GameModal = () => (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.MODAL }}>
      <div className="bg-gray-900 max-w-md w-full overflow-hidden border-4 border-lime-400 relative" style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 98%, 96% 100%, 0 100%)',
        boxShadow: `12px 12px 0px rgba(50,205,50,${0.3 + slimeIntensity * 0.3})`
      }}>
        <div className="absolute top-2 left-2 opacity-20 pointer-events-none">
          <CaterpillarMascot size="small" />
        </div>
        <div className="absolute bottom-20 right-2 opacity-10 pointer-events-none">
          <CaterpillarMascot size="small" />
        </div>
        <div className="relative bg-purple-900 text-white p-4 border-b-4 border-pink-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-lg uppercase" style={{ textShadow: '2px 2px 0px black' }}>Crisis Cat</h2>
            <button onClick={() => setShowGameModal(false)} className="text-pink-400 hover:text-pink-300" aria-label="Close modal">
              <X className="w-6 h-6" style={{ strokeWidth: 4 }} />
            </button>
          </div>
          <p className="text-2xl font-black text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>$35.00</p>
          <DripEffect color="#FF1493" intensity={0.6 + slimeIntensity * 0.3} />
        </div>

        {!gameComplete ? (
          <div className="p-6 bg-black">
            <div className="relative bg-orange-900 border-4 border-yellow-400 p-4 mb-4 overflow-hidden" style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)'
            }}>
              <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
                <div className="flex items-center gap-2 mb-2">
                  <CaterpillarMascot size="small" />
                  <span className="font-black text-lg text-yellow-300 uppercase" style={{ textShadow: '2px 2px 0px black' }}>The Culling</span>
                </div>
                <p className="text-sm text-white mb-3 font-bold">
                  Help us clear space to grow... 25 seconds. 🐛💚
                </p>
                <div className="bg-black/70 p-3 border-2 border-yellow-400">
                  <p className="text-xs text-yellow-300 mb-1 font-bold uppercase">Your reward:</p>
                  <p className="font-black text-lime-400" style={{ textShadow: '1px 1px 0px black' }}>20-30% off! Help us thrive!</p>
                </div>
              </div>
              <DripEffect color="#FFD700" intensity={0.6 + slimeIntensity * 0.3} />
            </div>

            <div className="relative bg-gray-800 h-64 flex flex-col items-center justify-center mb-4 border-4 border-dashed border-pink-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-cyan-500/10" />
              <div className="absolute top-4 left-4 opacity-30">
                <CaterpillarMascot size="small" />
              </div>
              <div className="absolute top-4 right-4 opacity-20">
                <CaterpillarMascot size="small" />
              </div>
              <div className="absolute bottom-4 left-1/4 opacity-15">
                <CaterpillarMascot size="small" />
              </div>
              <div className="relative text-center" style={{ zIndex: Z_INDEX.CONTENT }}>
                <div className="mb-4">
                  <CaterpillarMascot size="large" />
                </div>
                <p className="text-lime-400 font-black uppercase text-lg mb-2" style={{ textShadow: '2px 2px 0px black' }}>We're Waiting 💚</p>
                <p className="text-sm text-gray-400 font-bold">Ready to help the RANCCH grow?</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onMouseEnter={() => setHoveredCulling(true)}
                onMouseLeave={() => setHoveredCulling(false)}
                onClick={() => {
                  setGameComplete(true);
                  setEarnedDiscount(25);
                  triggerAcceptance(false);
                }}
                className="w-full bg-lime-400 text-black font-black py-4 uppercase border-4 border-pink-500 hover:bg-cyan-400 transition-colors"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)',
                  boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
                  textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
                }}
              >
                🐛 Begin Culling
              </button>
              <button 
                onClick={() => {
                  setShowGameModal(false);
                  setCurrentScreen('cart');
                }}
                className="w-full bg-gray-800 text-white font-black py-4 uppercase border-4 border-white hover:border-gray-500 transition-colors"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)',
                  textShadow: '1px 1px 0px black'
                }}
              >
                Skip (We understand) 💚
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-3 font-bold">
              ~25 sec. The RANCCH is patient. 🐛
            </p>
          </div>
        ) : (
          <div className="p-6 bg-black">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <CaterpillarMascot size="large" />
              </div>
              <div className="text-8xl mb-4 animate-bounce" style={{ filter: 'drop-shadow(0 0 20px #32CD32)' }}>🎉</div>
              <h3 className="text-3xl font-black text-lime-400 mb-2 uppercase" style={{ textShadow: '3px 3px 0px #FF1493' }}>WONDERFUL!</h3>
              <p className="text-gray-400 mb-4 font-bold">The RANCCH is pleased with you 💚</p>
              
              <div className="relative bg-green-900 border-4 border-lime-400 p-6 overflow-hidden" style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)',
                boxShadow: '8px 8px 0px rgba(50,205,50,0.3)'
              }}>
                <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
                  <p className="text-sm text-lime-300 mb-1 font-bold uppercase">Your reward:</p>
                  <p className="text-6xl font-black mb-2 text-lime-400" style={{ textShadow: '4px 4px 0px black' }}>{earnedDiscount}%</p>
                  <div className="bg-black/70 p-3 border-2 border-lime-400">
                    <p className="text-sm line-through text-gray-500 font-bold">$35.00</p>
                    <p className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 0px #32CD32' }}>${(35 * (1 - earnedDiscount/100)).toFixed(2)}</p>
                  </div>
                </div>
                <DripEffect color="#32CD32" intensity={0.8} />
              </div>
            </div>

            <button 
              onClick={() => {
                setShowGameModal(false);
                setCurrentScreen('cart');
              }}
              className="w-full bg-pink-500 text-white font-black py-4 uppercase border-4 border-cyan-400"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)',
                boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
                textShadow: '2px 2px 0px black'
              }}
            >
              Add to Cart 🛒
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Cart Screen
  const CartScreen = () => (
    <div className="min-h-screen pb-20 transition-all duration-1000" style={backgroundStyle}>
      <PulsingStars />
      <FloatingMascots />
      <Navigation />
      <ColonyCounter />
      <div className="p-4">
        <h1 className="text-3xl font-black mb-4 text-lime-400 uppercase flex items-center gap-2" style={{ textShadow: '3px 3px 0px #FF1493' }}>
          Your Growing Order 🛒
          <div className="opacity-30 scale-75">
            <CaterpillarMascot size="small" />
          </div>
        </h1>

        <div className="space-y-3 mb-4">
          <div className="bg-gray-900 p-4 border-4 border-pink-500" style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 96%, 95% 100%, 0 100%)',
            boxShadow: `0 0 ${20 * slimeIntensity}px rgba(255, 20, 147, ${slimeIntensity})`
          }}>
            <div className="flex gap-3">
              <div className="bg-pink-900 w-20 h-20 flex items-center justify-center text-3xl flex-shrink-0 border-4 border-pink-500" style={{
                boxShadow: '0 0 20px #FF1493'
              }}>
                😿
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm mb-1 text-white uppercase">Crisis Cat</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-lime-400 text-black px-2 py-1 font-black border-2 border-black uppercase">
                    25% HELPED 🐛
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 line-through font-bold">$35.00</p>
                  <p className="text-xl font-black text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>$26.25</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 border-4 border-cyan-500" style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 96%, 95% 100%, 0 100%)'
          }}>
            <div className="flex gap-3">
              <div className="bg-cyan-900 w-20 h-20 flex items-center justify-center text-3xl flex-shrink-0 border-4 border-cyan-500" style={{
                boxShadow: '0 0 20px #00CED1'
              }}>
                🍕
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm mb-1 text-white uppercase">Pizza Cult Shirt</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 font-black border-2 border-gray-700 uppercase">
                    Full price
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-black text-white">$32.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-900 p-4 border-4 border-lime-400 mb-4 relative overflow-hidden" style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)'
        }}>
          <div className="absolute top-2 right-2 opacity-20">
            <CaterpillarMascot size="small" />
          </div>
          <div className="relative space-y-2 text-sm" style={{ zIndex: Z_INDEX.CONTENT }}>
            <div className="flex justify-between text-white font-bold">
              <span>Subtotal</span>
              <span>$67.00</span>
            </div>
            <div className="flex justify-between text-lime-400 font-black">
              <span>RANCCH rewards 💚</span>
              <span>-$8.75</span>
            </div>
            <div className="border-t-2 border-pink-500 pt-2 flex justify-between text-xl font-black">
              <span className="text-white uppercase">Total</span>
              <span className="text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>$58.25</span>
            </div>
          </div>
          <DripEffect color="#32CD32" intensity={0.6 + slimeIntensity * 0.3} />
        </div>

        <button 
          onClick={() => setCurrentScreen('checkout')}
          className="w-full bg-pink-500 text-white font-black py-5 uppercase text-xl border-4 border-cyan-400 hover:bg-lime-400 hover:text-black transition-colors"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.5)',
            textShadow: '2px 2px 0px black'
          }}
        >
          Continue Growing 💳
        </button>

        <p className="text-center text-sm text-gray-500 mt-3 font-bold">
          Free shipping on orders $50+ 📦
        </p>
      </div>
    </div>
  );

  // Checkout Screen
  const CheckoutScreen = () => (
    <div className="min-h-screen pb-20 transition-all duration-1000" style={backgroundStyle}>
      <PulsingStars />
      <FloatingMascots />
      {showAcceptance && acceptanceStage >= 2 && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: Z_INDEX.ACCEPTANCE }}>
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30);
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%)`,
                  animation: `burst-${i} 1s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ 
                  transform: `rotate(${angle}deg) translateY(-150px) rotate(-${angle}deg)`,
                  opacity: 0
                }}>
                  <CaterpillarMascot size="small" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Navigation />
      <ColonyCounter />
      <div className="p-4">
        <h1 className="text-3xl font-black mb-4 text-lime-400 uppercase flex items-center gap-2" style={{ textShadow: '3px 3px 0px #FF1493' }}>
          Final Step 💳
          <div className="opacity-20 scale-75">
            <CaterpillarMascot size="small" />
          </div>
        </h1>

        <div className="bg-gray-900 p-4 border-4 border-purple-500 mb-4" style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 96%, 95% 100%, 0 100%)'
        }}>
          <h2 className="font-black mb-2 text-white uppercase">Your Order</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400 font-bold">
              <span>2 items growing</span>
              <span className="text-white">$67.00</span>
            </div>
            <div className="flex justify-between text-lime-400 font-black">
              <span>RANCCH rewards 🐛</span>
              <span>-$8.75</span>
            </div>
            <div className="border-t-2 border-pink-500 pt-2 flex justify-between text-lg font-black">
              <span className="text-white uppercase">Total</span>
              <span className="text-lime-400" style={{ textShadow: '2px 2px 0px black' }}>$58.25</span>
            </div>
          </div>
        </div>

        <div className="relative bg-red-900 border-4 border-yellow-400 p-5 mb-4 overflow-hidden" style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)',
          boxShadow: '8px 8px 0px rgba(255,215,0,0.3)'
        }}>
          <div className="absolute top-2 right-2 opacity-30">
            <CaterpillarMascot size="medium" />
          </div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl" />
          </div>
          <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl" style={{ transform: 'rotate(-15deg)', display: 'inline-block' }}>⚡</span>
              <div>
                <h3 className="font-black text-xl text-yellow-300 uppercase" style={{ textShadow: '2px 2px 0px black' }}>One More?</h3>
                <p className="text-sm text-white font-bold">Help us grow even more! 💚</p>
              </div>
            </div>
            
            <div className="bg-black/70 p-3 mb-3 border-2 border-yellow-400">
              <p className="text-sm mb-1 text-red-300 font-black">⚡ RAPID GROWTH ⚡</p>
              <p className="text-xs text-gray-400 font-bold">10 seconds. Up to 15% more saved</p>
              <p className="text-xs font-black mt-1 text-gray-500">(40% total maximum)</p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-yellow-400 text-black font-black py-3 uppercase border-4 border-red-500" style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)',
                textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
              }}>
                🐛 HELP US
              </button>
              <button className="flex-1 bg-gray-800 text-white font-black py-3 uppercase border-4 border-gray-700">
                SKIP
              </button>
            </div>
          </div>
          <DripEffect color="#FFD700" intensity={0.6 + slimeIntensity * 0.3} />
        </div>

        <div className="bg-gray-900 p-4 border-4 border-gray-700 mb-4" style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 97%, 95% 100%, 0 100%)'
        }}>
          <h2 className="font-black mb-3 text-white uppercase">Payment Details</h2>
          <div className="space-y-3">
            <div className="border-4 border-dashed border-gray-700 p-4 text-gray-500 text-sm text-center font-bold uppercase">
              💳 Secure payment form
            </div>
          </div>
        </div>

        <button 
          onClick={() => triggerAcceptance(true)}
          className="w-full bg-lime-400 text-black font-black py-5 uppercase text-xl border-4 border-pink-500 hover:bg-cyan-400 transition-colors" 
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.5)',
            textShadow: '2px 2px 0px rgba(255,255,255,0.5)',
            transform: showAcceptance && acceptanceStage >= 5 ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.3s'
          }}
        >
          Join The RANCCH 🎉
        </button>

        <p className="text-center text-xs text-gray-500 mt-3 font-bold">
          Secure via Stripe 🔒 • You're almost one of us 💚
        </p>
      </div>
      
      {showAcceptance && acceptanceStage === 5 && (
        <div className="fixed bottom-32 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: Z_INDEX.ACCEPTANCE }}>
          <div className="bg-lime-400 text-black px-6 py-3 border-4 border-pink-500 font-black text-xl animate-bounce" style={{
            boxShadow: '0 0 40px rgba(50, 205, 50, 0.8)',
            textShadow: '2px 2px 0px rgba(255,255,255,0.5)'
          }}>
            Welcome! You're one of us now! 🐛💚✨
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        ${[...Array(12)].map((_, i) => `
          @keyframes burst-${i} {
            0% {
              transform: translate(-50%, -50%) rotate(${i * 30}deg) translateY(0) rotate(-${i * 30}deg);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) rotate(${i * 30}deg) translateY(-150px) rotate(-${i * 30}deg);
              opacity: 0;
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );

  // Screen Switcher
  const ScreenSwitcher = () => (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-lime-400 p-2 flex gap-2" 
      style={{
        zIndex: Z_INDEX.NAVIGATION,
        borderImage: 'linear-gradient(90deg, #32CD32, #FF1493, #00CED1) 1',
        borderImageSlice: 1,
        boxShadow: `0 -4px 20px rgba(50, 205, 50, ${slimeIntensity * 0.5})`
      }}
      aria-label="Screen navigation"
    >
      <button
        onClick={() => {setCurrentScreen('home'); setShowGameModal(false); setGameComplete(false);}}
        className={`flex-1 py-3 px-3 text-sm font-black uppercase transition-all border-2 ${currentScreen === 'home' ? 'bg-lime-400 text-black border-pink-500' : 'bg-gray-900 text-gray-400 border-gray-800'}`}
        style={{
          clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)'
        }}
        aria-label="Go to homepage"
      >
        🏠 RANCCH
      </button>
      <button
        onClick={() => {setCurrentScreen('cart'); setShowGameModal(false);}}
        className={`flex-1 py-3 px-3 text-sm font-black uppercase transition-all border-2 ${currentScreen === 'cart' ? 'bg-pink-500 text-white border-cyan-400' : 'bg-gray-900 text-gray-400 border-gray-800'}`}
        style={{
          clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)'
        }}
        aria-label="Go to cart"
      >
        🛒 Growing
      </button>
      <button
        onClick={() => {setCurrentScreen('checkout'); setShowGameModal(false);}}
        className={`flex-1 py-3 px-3 text-sm font-black uppercase transition-all border-2 ${currentScreen === 'checkout' ? 'bg-cyan-400 text-black border-pink-500' : 'bg-gray-900 text-gray-400 border-gray-800'}`}
        style={{
          clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)'
        }}
        aria-label="Go to checkout"
      >
        💳 Join
      </button>
    </nav>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      {currentScreen === 'home' && <HomePage />}
      {currentScreen === 'cart' && <CartScreen />}
      {currentScreen === 'checkout' && <CheckoutScreen />}
      {showGameModal && <GameModal />}
      <ScreenSwitcher />
    </div>
  );
};

export default CaterpillarRancchUI;