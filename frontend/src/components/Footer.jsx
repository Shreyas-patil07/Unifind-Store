import React from 'react';
import { Github, Mail, ExternalLink, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-white/5">
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 py-14">
        <div className="max-w-7xl mx-auto">

          {/* Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="font-['Outfit'] font-black text-2xl text-white mb-3">
                <span className="text-indigo-400">UNI</span>
                <span className="text-violet-400">FIND</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                AI-powered student-to-student marketplace for campus commerce. Safe, verified, and instant.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/Shreyas-patil07/UniFind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4 text-white" />
                </a>
                <a
                  href="mailto:systemrecord07@gmail.com"
                  className="h-9 w-9 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5">Platform</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Home', href: '/home' },
                  { label: 'Browse Listings', href: '/buyer' },
                  { label: 'Sell Your Items', href: '/seller' },
                  { label: 'NeedBoard AI', href: '/need-board' },
                  { label: 'Dashboard', href: '/dashboard' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-slate-400 hover:text-indigo-400 transition-colors duration-200">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5">Features</h3>
              <ul className="space-y-3 text-sm">
                {[
                  'AI Matching',
                  'Trust Score',
                  'Condition Grading',
                  'Instant Chat',
                  'Verified Students',
                ].map((item) => (
                  <li key={item} className="text-slate-400">{item}</li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5">Contact & Info</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:systemrecord07@gmail.com" className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 break-all">
                    systemrecord07@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://sigce.edu.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1"
                  >
                    SIGCE Official
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Shreyas-patil07/UniFind"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1"
                  >
                    GitHub Repository
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">

              <p className="text-xs text-slate-500 text-center md:text-left">
                © 2026 UNIFIND. All rights reserved. Built exclusively for SIGCE students.
              </p>

              {/* Creator Attribution */}
              <a
                href="https://github.com/Shreyas-patil07/UniFind"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300"
              >
                <img
                  src="/Numero_Uno.png"
                  alt="Numero Uno"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                />
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors">Created by</p>
                  <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Numero Uno</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
