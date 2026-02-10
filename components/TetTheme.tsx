import React, { useEffect, useState } from 'react';

const TetTheme: React.FC = () => {
  const [fireworks, setFireworks] = useState<number[]>([]);

  // Fireworks Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFireworks(prev => [...prev.slice(-5), Date.now()]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden font-sans">
      {/* 1. Falling Blossoms (Hoa Đào / Hoa Mai) */}
      <div className="absolute inset-0">
         {[...Array(20)].map((_, i) => (
           <div 
              key={`blossom-${i}`}
              className="absolute text-2xl animate-fall opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${10 + Math.random() * 10}s`,
                animationDelay: `-${Math.random() * 10}s`,
                top: '-50px' 
              }}
           >
             {Math.random() > 0.5 ? '🌸' : '🌼'}
           </div>
         ))}
      </div>

      {/* 2. Cyber-Couplets (Câu Đối Điện Tử) */}
      {/* Left Couplet */}
      <div className="absolute top-1/4 left-2 flex flex-col gap-1 p-3 rounded-xl border-2 border-yellow-400 bg-red-900/90 shadow-[0_0_15px_rgba(255,0,0,0.8)] backdrop-blur-sm animate-swing origin-top">
         {['XUÂN', 'BÍNH', 'NGỌ', '2026'].map((char, index) => (
           <div key={index} className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-full border border-yellow-300 text-yellow-300 font-bold text-xl shadow-inner">
             {char}
           </div>
         ))}
         <div className="mt-2 w-12 h-16 flex items-center justify-center">
            <span className="text-3xl animate-pulse">🧧</span>
         </div>
      </div>

      {/* Right Couplet */}
      <div className="absolute top-1/4 right-2 flex flex-col gap-1 p-3 rounded-xl border-2 border-yellow-400 bg-red-900/90 shadow-[0_0_15px_rgba(255,0,0,0.8)] backdrop-blur-sm animate-swing origin-top" style={{ animationDelay: '1s' }}>
         {['TẤN', 'TÀI', 'TẤN', 'LỘC'].map((char, index) => (
           <div key={index} className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-full border border-yellow-300 text-yellow-300 font-bold text-xl shadow-inner">
             {char}
           </div>
         ))}
          <div className="mt-2 w-12 h-16 flex items-center justify-center">
            <span className="text-3xl animate-pulse">💰</span>
         </div>
      </div>

      {/* 3. The Cyberpunk Horse (Linh Vật) */}
      <div className="absolute bottom-4 right-4 animate-bounce-slow">
        <div className="relative group">
            <img 
              src="/cyberpunk_robot_horse_sticker.webp" 
              onError={(e) => {
                 // Fallback if image fails
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              className="w-48 h-auto drop-shadow-[0_0_15px_rgba(0,240,255,0.8)] transition-transform transform group-hover:scale-110"
              alt="Robot Horse 2026" 
            />
            {/* Fallback Text/Emoji Mascot */}
            <div className="hidden flex flex-col items-center">
                <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]">🐴🤖</span>
                <span className="bg-black/50 text-cyan-400 px-3 py-1 rounded-full text-xs border border-cyan-400 mt-2">CYBER HORSE 2026</span>
            </div>
            
            {/* Speech Bubble */}
            <div className="absolute -top-16 -left-20 bg-white/90 p-3 rounded-2xl rounded-br-none shadow-lg animate-pulse">
                <p className="text-sm font-bold text-red-600 whitespace-nowrap">🚀 Code Xuyên Tết!</p>
            </div>
        </div>
      </div>

      {/* 4. Fireworks Animation */}
      {fireworks.map((id) => (
        <div 
          key={id} 
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
             left: `${20 + Math.random() * 60}%`,
             top: `${20 + Math.random() * 40}%`,
             boxShadow: `0 0 0 0 rgba(255, 0, 0, 0)`,
             animation: `firework 1s ease-out forwards`
          }}
        />
      ))}
      
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes swing {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
         @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes firework {
          0% { transform: scale(1); background: #ff0; box-shadow: 0 0 0 0 #ff0, 0 0 0 0 #f0f, 0 0 0 0 #0ff; opacity: 1; }
          100% { transform: scale(1.5); background: transparent; box-shadow: -20px -20px 0 0 transparent, 20px -20px 0 0 transparent, 0px 30px 0 0 transparent; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TetTheme;
