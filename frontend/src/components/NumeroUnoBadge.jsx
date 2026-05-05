import React from 'react';

const NumeroUnoBadge = ({ variant = 'default' }) => {
  // Default variant - Full badge with logo and text
  if (variant === 'default') {
    return (
      <a 
        href="https://github.com/Shreyas-patil07/UniFind" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group inline-block"
      >
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-blue-600 hover:to-blue-500 
                      px-6 py-3 rounded-full flex items-center space-x-3 
                      transition-all duration-300 transform hover:scale-105 
                      shadow-lg hover:shadow-blue-500/50 border border-slate-600 hover:border-blue-400">
          <div className="relative">
            <img 
              src="/Numero_Uno.png" 
              alt="Numero Uno" 
              className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-600 group-hover:ring-blue-400 transition-all"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-400 group-hover:text-blue-200 transition-colors">Created by</p>
            <p className="text-sm font-bold text-white group-hover:text-white transition-colors">Numero Uno</p>
          </div>
        </div>
      </a>
    );
  }

  // Compact variant - Smaller badge
  if (variant === 'compact') {
    return (
      <a 
        href="https://github.com/Shreyas-patil07/UniFind" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group inline-block"
      >
        <div className="bg-slate-800 hover:bg-blue-600 
                      px-4 py-2 rounded-lg flex items-center space-x-2 
                      transition-all duration-300 
                      shadow-md hover:shadow-blue-500/50 border border-slate-700 hover:border-blue-400">
          <img 
            src="/Numero_Uno.png" 
            alt="Numero Uno" 
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-xs font-semibold text-white">Numero Uno</span>
        </div>
      </a>
    );
  }

  // Minimal variant - Just logo
  if (variant === 'minimal') {
    return (
      <a 
        href="https://github.com/Shreyas-patil07/UniFind" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group inline-block"
      >
        <div className="relative">
          <img 
            src="/Numero_Uno.png" 
            alt="Numero Uno" 
            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-600 group-hover:ring-blue-400 transition-all transform group-hover:scale-110"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
      </a>
    );
  }

  // Banner variant - Full width banner
  if (variant === 'banner') {
    return (
      <a 
        href="https://github.com/Shreyas-patil07/UniFind" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 
                      py-4 px-6 flex items-center justify-center space-x-4 
                      hover:from-blue-900 hover:via-blue-800 hover:to-blue-900
                      transition-all duration-300 border-t border-b border-slate-700">
          <img 
            src="/Numero_Uno.png" 
            alt="Numero Uno" 
            className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-600 group-hover:ring-blue-400 transition-all"
          />
          <div className="text-center">
            <p className="text-sm text-slate-400 group-hover:text-blue-300 transition-colors">Created by</p>
            <p className="text-xl font-bold text-white">Numero Uno</p>
            <p className="text-xs text-slate-500 mt-1">© 2026 • All Rights Reserved</p>
          </div>
        </div>
      </a>
    );
  }

  return null;
};

export default NumeroUnoBadge;
