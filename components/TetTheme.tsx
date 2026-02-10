import React, { useEffect, useState } from 'react';

const TetTheme: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden font-sans">
      {/* 1. Falling Blossoms (Hoa Đào / Hoa Mai) - Subtle & Non-blocking */}
      <div className="absolute inset-0 z-0">
         {[...Array(15)].map((_, i) => (
           <div 
              key={`blossom-${i}`}
              className="absolute text-xl animate-fall opacity-40 select-none"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${15 + Math.random() * 10}s`,
                animationDelay: `-${Math.random() * 10}s`,
                top: '-50px',
                textShadow: '0 0 5px rgba(255, 182, 193, 0.5)'
              }}
           >
             {Math.random() > 0.6 ? '🌸' : '🌼'} 
           </div>
         ))}
      </div>

      {/* 2. Delicate Spring Branch (Cành Đào) - Top Right Corner Decoration */}
      <div className="absolute top-0 right-0 z-10 opacity-90">
         {/* Simulated localized branch using emoji + text logic to keep performant without heavy images */}
         <div className="relative p-4 flex flex-col items-end">
            <div className="text-4xl filter drop-shadow-sm transform rotate-12 origin-top-right">🌿🌺</div>
            <div className="mt-1 bg-gradient-to-l from-red-600 to-transparent text-white px-4 py-1 rounded-l-full shadow-sm">
                <span className="text-xs font-semibold tracking-wider font-serif">XUÂN BÍNH NGỌ 2026</span>
            </div>
            <div className="mr-2 text-red-600 font-bold text-xs uppercase tracking-widest opacity-80 mt-1">
                Tấn Tài - Tấn Lộc
            </div>
         </div>
      </div>

      {/* 3. Global CSS Animations */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(20px) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TetTheme;
