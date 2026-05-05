import React from 'react';

const FloatingBadge = () => {
  return (
    <div className="fixed bottom-1 right-1 z-50">
      <a 
        href="https://github.com/Shreyas-patil07/UniFind" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="bg-slate-900/65 backdrop-blur-sm hover:bg-blue-600/75 
                      px-3 py-2 rounded-2xl flex items-center space-x-2 
                      transition-all duration-300 transform hover:scale-105
                      shadow-xl border border-slate-700/30 hover:border-blue-400/30">
          <img 
            src="/Numero_Uno.png" 
            alt="Numero Uno" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="text-[10px] text-slate-400 group-hover:text-blue-200 transition-colors">Created by</p>
            <p className="text-xs font-bold text-white">Numero Uno</p>
          </div>
        </div>
      </a>
    </div>
  );
};

export default FloatingBadge;
