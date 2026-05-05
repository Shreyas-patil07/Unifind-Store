import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ============================================================
   COLOR TOKENS — mirrors code.html / DESIGN.md
============================================================ */
const C = {
  background:              '#f8f9ff',
  surface:                 '#f8f9ff',
  surfaceContainerLowest:  '#ffffff',
  surfaceContainerLow:     '#f0f4fd',
  surfaceContainer:        '#eaeef7',
  surfaceContainerHigh:    '#e4e8f1',
  surfaceContainerHighest: '#dee3eb',
  primary:                 '#003358',
  primaryContainer:        '#004a7c',
  secondary:               '#00696a',
  secondaryContainer:      '#90eff0',
  onSecondaryContainer:    '#006e6f',
  tertiaryFixedDim:        '#ffba3f',
  onTertiaryContainer:     '#f1a700',
  onSurface:               '#171c22',
  onSurfaceVariant:        '#42474f',
  onPrimaryContainer:      '#87baf3',
  outlineVariant:          '#c1c7d0',
  onPrimary:               '#ffffff',
};

const ghostShadow = '0 12px 40px rgba(0,74,124,0.06)';
const primaryGradient = 'linear-gradient(135deg,#003358 0%,#004a7c 100%)';

/* ============================================================
   INJECT STYLES ONCE
============================================================ */
function useAboutStyles() {
  useEffect(() => {
    if (!document.getElementById('uf-gfonts')) {
      const l = document.createElement('link');
      l.id = 'uf-gfonts';
      l.rel = 'stylesheet';
      l.href =
        'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('uf-about-styles')) {
      const s = document.createElement('style');
      s.id = 'uf-about-styles';
      s.textContent = `
        .uf-about { font-family:'Manrope',sans-serif; background:${C.background}; color:${C.onSurface}; }
        .uf-mso { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal;
                  font-size:24px; line-height:1; letter-spacing:normal; text-transform:none;
                  display:inline-block; white-space:nowrap; word-wrap:normal;
                  direction:ltr; -webkit-font-smoothing:antialiased; }
        .uf-glass-header { background:rgba(255,255,255,0.82); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
        .uf-primary-gradient { background:${primaryGradient}; }
        /* Bulletin card hover */
        .uf-card { transition:background 0.25s, box-shadow 0.25s; }
        .uf-card:hover { background:${C.surfaceContainerHigh} !important; }
        /* Pillar icon bounce */
        .uf-pillar-icon { transition: transform 0.3s; }
        .uf-card:hover .uf-pillar-icon { transform: scale(1.18) rotate(-4deg); }
        /* Signature underline */
        .uf-sig-ul { position:relative; display:inline-block; }
        .uf-sig-ul::after { content:''; position:absolute; bottom:-2px; left:0; width:100%; height:3px;
          background:${C.tertiaryFixedDim}; transform:scaleX(0.4); transform-origin:left;
          transition:transform 0.3s ease; border-radius:2px; }
        .uf-sig-ul:hover::after { transform:scaleX(1); }
        /* Team member card */
        .uf-member-card { transition: transform 0.3s, box-shadow 0.3s; }
        .uf-member-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,74,124,0.12) !important; }
        .uf-member-card:hover .uf-member-img { filter: grayscale(0%) !important; }
        /* Social icon */
        .uf-social { transition: background 0.2s, color 0.2s, transform 0.2s; }
        .uf-social:hover { background:${C.primary} !important; color:#fff !important; transform:scale(1.12); }
        /* Nav link */
        .uf-nav-link { transition:color 0.2s; }
        .uf-nav-link:hover { color:${C.secondary} !important; }
        /* CTA buttons */
        .uf-cta-primary { transition:transform 0.2s, box-shadow 0.2s; }
        .uf-cta-primary:hover { transform:scale(1.04); box-shadow:0 8px 32px rgba(0,74,124,0.22) !important; }
        .uf-footer-social:hover { background:${C.secondaryContainer} !important; }
        /* Squad photo */
        .uf-squad-wrap { transition: transform 0.3s; }
        .uf-squad-wrap:hover { transform: rotate(0deg) scale(1.02) !important; }
        @media (max-width:768px) {
          .uf-squad-wrap { transform: rotate(0deg) !important; }
          .uf-squad-section { display: block !important; }
        }
        /* Stat counter */
        .uf-stat { display:flex; flex-direction:column; align-items:center; gap:4px; }
        /* Dot decorations */
        @keyframes uf-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .uf-float-el { animation: none; }
        /* Scroll reveal */
        @keyframes uf-fadein { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .uf-reveal { animation: none; opacity: 1; transform: translateY(0); }
        /* Mobile overrides */
        @media (min-width:769px) {
          .uf-mobile-btn { display:none !important; }
        }
        @media (max-width:768px) {
          .uf-desktop-nav { display:none !important; }
          .uf-hero-grid { grid-template-columns:1fr !important; }
          .uf-story-grid { grid-template-columns:1fr !important; }
          .uf-team-grid { grid-template-columns: repeat(2,1fr) !important; }
          .uf-pillars-grid { grid-template-columns: 1fr !important; }
          .uf-stats-row { flex-wrap: wrap; gap: 32px !important; }
          .uf-footer-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:480px) {
          .uf-team-grid { grid-template-columns: 1fr !important; }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);
}

/* ============================================================
   ICON
============================================================ */
function Icon({ name, fill = 0, size = 24, style = {}, className = '' }) {
  return (
    <span
      className={`uf-mso ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: size,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

/* ============================================================
   SVG ICONS — LinkedIn & GitHub
============================================================ */
const LinkedInSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GitHubSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

/* ============================================================
   NAVBAR
============================================================ */
function Navbar({ currentUser, onProfile, onLogin, onSignup, navigate }) {
  return (
    <nav
      className="uf-glass-header"
      style={{ position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img src="/UNIFIND.png" alt="UNIFIND Logo" style={{ height: 48, width: 48, objectFit: 'contain' }} />
          <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: C.primary, fontFamily: 'Manrope, sans-serif' }}>UNIFIND</span>
        </button>

        {/* Desktop nav */}
        <div className="uf-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <button onClick={() => navigate('/buyer')} className="uf-nav-link"
            style={{ color: C.onSurfaceVariant, fontWeight: 500, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Marketplace
          </button>
          <button onClick={() => navigate('/home')} className="uf-nav-link"
            style={{ color: C.onSurfaceVariant, fontWeight: 500, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Notes
          </button>
          <button onClick={() => navigate('/need-board')} className="uf-nav-link"
            style={{ color: C.onSurfaceVariant, fontWeight: 500, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Events
          </button>
          <span style={{ color: C.primary, fontWeight: 700, fontSize: 13, borderBottom: `2px solid ${C.tertiaryFixedDim}`, paddingBottom: 4 }}>
            About
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentUser ? (
            <button
              onClick={onProfile}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 12, background: primaryGradient, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
            >
              <Icon name="person" size={18} />
              Profile
            </button>
          ) : (
            <button onClick={onLogin}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'transparent', color: C.onSurfaceVariant, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceContainer}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   HERO SECTION
============================================================ */
function HeroSection() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 0 64px' }}>
      {/* Decorative blob */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '38%', height: '100%', background: C.surfaceContainerLow, borderRadius: '0 0 0 120px', zIndex: 0, opacity: 0.7 }} />

      <div
        className="uf-hero-grid"
        style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }}
      >
        {/* Left */}
        <div className="uf-reveal">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.secondaryContainer, color: C.onSecondaryContainer, padding: '7px 16px', borderRadius: 9999, marginBottom: 28, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em' }}>
            <Icon name="school" fill={1} size={16} />
            THE ACADEMIC CURATOR
          </div>

          <h1 style={{ fontSize: 'clamp(2.6rem,5vw,4.6rem)', fontWeight: 900, letterSpacing: '-0.03em', color: C.primary, lineHeight: 1.08, marginBottom: 24 }}>
            Building the{' '}
            <span style={{ color: C.secondary, fontStyle: 'italic' }}>future</span>
            <br />of campus life.
          </h1>

          <p style={{ fontSize: 17, color: C.onSurfaceVariant, lineHeight: 1.75, maxWidth: 460, marginBottom: 40 }}>
            Empowering students through campus commerce and intentional resource sharing.
            We&apos;re building the digital bulletin board for the modern scholar — curated by students, for students.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href="#team"
              className="uf-primary-gradient uf-cta-primary"
              style={{ padding: '14px 32px', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: ghostShadow }}
            >
              Meet the Team
            </a>
            <a href="#mission"
              className="uf-sig-ul"
              style={{ padding: '14px 0', color: C.onSurface, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
            >
              Our Mission
            </a>
          </div>

          {/* Stats row */}
          <div className="uf-stats-row" style={{ display: 'flex', gap: 48, marginTop: 52 }}>
            {[
              { val: '8,900+', label: 'Students' },
              { val: '12.5k',  label: 'Items Exchanged' },
              { val: '₹4.2L',  label: 'Library Savings' },
            ].map(({ val, label }) => (
              <div className="uf-stat" key={label}>
                <span style={{ fontSize: 28, fontWeight: 900, color: C.primary }}>{val}</span>
                <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — squad photo */}
        <div style={{ position: 'relative' }} className="uf-reveal uf-squad-section">
          <div
            className="uf-squad-wrap"
            style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,51,88,0.18)', transform: 'rotate(2deg)' }}
          >
            <img
              src="/NU-squad.png"
              alt="UniFind Team"
              style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
            />
          </div>
          {/* Float badge */}
          <div className="uf-float-el" style={{ position: 'absolute', bottom: -20, left: -24, background: '#fff', padding: '16px 22px', borderRadius: 16, boxShadow: ghostShadow, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: `${C.tertiaryFixedDim}40`, padding: 10, borderRadius: 10 }}>
              <Icon name="verified" fill={1} size={26} style={{ color: '#614100' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 500 }}>Community Verified</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>SIGCE-built</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MISSION / PILLARS SECTION
============================================================ */
const PILLARS = [
  {
    icon: 'storefront',
    iconBg: C.secondaryContainer,
    iconColor: C.secondary,
    title: 'Student Marketplace',
    desc: 'A safe, verified space to buy and sell textbooks, dorm gear, and electronics within your own campus ecosystem.',
  },
  {
    icon: 'library_books',
    iconBg: '#d0e4ff',
    iconColor: C.primary,
    title: 'Academic Library',
    desc: 'Access high-quality peer-reviewed notes, study guides, and research materials curated for your specific courses.',
  },
  {
    icon: 'groups',
    iconBg: `${C.tertiaryFixedDim}50`,
    iconColor: '#614100',
    title: 'Campus Community',
    desc: 'Connect with fellow students for collaborative projects, local campus events, and peer-to-peer mentoring.',
  },
];

function MissionSection() {
  return (
    <section id="mission" style={{ background: C.surfaceContainerLow, padding: '88px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 900, color: C.primary, letterSpacing: '-0.02em', marginBottom: 14 }}>
            Our Core Pillars
          </h2>
          <div style={{ height: 6, width: 64, background: C.tertiaryFixedDim, borderRadius: 9999 }} />
          <p style={{ fontSize: 16, color: C.onSurfaceVariant, marginTop: 18, maxWidth: 560, lineHeight: 1.75 }}>
            Everything we build revolves around three interconnected pillars designed to make student life easier, richer, and more connected.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="uf-pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {PILLARS.map(({ icon, iconBg, iconColor, title, desc }) => (
            <div
              key={title}
              className="uf-card"
              style={{ background: C.surfaceContainerLowest, borderRadius: 20, padding: 36, boxShadow: ghostShadow }}
            >
              <div className="uf-pillar-icon" style={{ width: 56, height: 56, background: iconBg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                <Icon name={icon} fill={1} size={28} style={{ color: iconColor }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginBottom: 12 }}>{title}</h3>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.75 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STORY SECTION
============================================================ */
function StorySection() {
  return (
    <section style={{ padding: '96px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="uf-story-grid">
        {/* Timeline */}
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 900, color: C.primary, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Our Story
          </h2>
          <div style={{ height: 5, width: 48, background: C.tertiaryFixedDim, borderRadius: 9999, marginBottom: 36 }} />

          {[
            { year: '2023', text: 'Four friends at SIGCE noticed how much money students wasted buying brand-new textbooks and gear every semester.' },
            { year: 'Early 2024', text: 'We started sketching UNIFIND on a whiteboard — a campus-native marketplace where trust comes built-in.' },
            { year: 'Late 2024', text: 'Launched our beta at SIGCE and watched the first 500 students join within a week.' },
            { year: '2025+', text: 'Growing the platform, adding AI matching, the digital library, and expanding to more campuses.' },
          ].map(({ year, text }, i) => (
            <div key={year} style={{ display: 'flex', gap: 20, marginBottom: i < 3 ? 36 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === 3 ? C.tertiaryFixedDim : C.primary, flexShrink: 0, marginTop: 4 }} />
                {i < 3 && <div style={{ width: 2, flex: 1, background: `${C.primary}20`, marginTop: 6, borderRadius: 2 }} />}
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.secondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{year}</span>
                <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.75, marginTop: 4 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 900, color: C.primary, letterSpacing: '-0.02em', marginBottom: 8 }}>
            What We Stand For
          </h2>
          <div style={{ height: 5, width: 48, background: C.tertiaryFixedDim, borderRadius: 9999, marginBottom: 36 }} />

          {[
            { icon: 'verified_user', title: 'Trust First', desc: 'Every user is a verified student. No outsiders, no scams — just your campus community.' },
            { icon: 'eco', title: 'Sustainability', desc: 'Reusing textbooks and gear reduces waste and keeps money inside the student community.' },
            { icon: 'psychology', title: 'Intelligence', desc: 'AI-assisted matching ensures you find exactly what you need, when you need it.' },
            { icon: 'diversity_3', title: 'Inclusivity', desc: 'Built for every student, regardless of budget. Free resources are always a priority.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, background: C.surfaceContainerLow, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} fill={1} size={22} style={{ color: C.primary }} />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{title}</h4>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.65 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TEAM SECTION
============================================================ */
const TEAM = [
  {
    name: 'Shreyas Patil',
    photo: '/Shreyas.png',
    linkedin: 'https://www.linkedin.com/in/shreyasrp07/',
    github:   'https://github.com/Shreyas-patil07',
    accent:   C.primary,
  },
  {
    name: 'Rijul Singh',
    photo: '/Rijul.png',
    linkedin: 'https://www.linkedin.com/in/rijul-singh-dev/',
    github:   'https://github.com/Rijuls-code',
    accent:   C.secondary,
  },
  {
    name: 'Atharva Jadhav',
    photo: '/Atharva.png',
    linkedin: 'https://www.linkedin.com/in/atharva-jadhav-8a0830334/',
    github:   'https://github.com/Atharva6153-git',
    accent:   '#614100',
  },
  {
    name: 'Himanshu Patil',
    photo: '/Himanshu.png',
    linkedin: 'https://www.linkedin.com/in/himanshu-patil-9305ab318/',
    github:   'https://github.com/Himanshu052007',
    accent:   C.primaryContainer,
  },
];

function MemberCard({ member }) {
  return (
    <div
      className="uf-member-card"
      style={{ background: C.surfaceContainerLowest, borderRadius: 20, overflow: 'hidden', boxShadow: ghostShadow }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', paddingTop: '110%', overflow: 'hidden', background: C.surfaceContainerLow }}>
        <img
          className="uf-member-img"
          src={member.photo}
          alt={member.name}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top',
            filter: 'grayscale(40%)',
            transition: 'filter 0.5s, transform 0.4s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, ${member.accent}33, transparent)` }} />
      </div>

      {/* Info */}
      <div style={{ padding: '22px 24px 24px' }}>
        <h4 style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 18 }}>{member.name}</h4>

        {/* Social links */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} LinkedIn`}
            className="uf-social"
            style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, textDecoration: 'none' }}
          >
            <LinkedInSVG />
          </a>
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} GitHub`}
            className="uf-social"
            style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, textDecoration: 'none' }}
          >
            <GitHubSVG />
          </a>
        </div>
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <section id="team" style={{ background: C.surfaceContainerLow, padding: '96px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.secondary}18`, color: C.secondary, padding: '7px 18px', borderRadius: 9999, marginBottom: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
            <Icon name="engineering" fill={1} size={16} />
            THE ARCHITECTS
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 900, color: C.primary, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Meet the Builders
          </h2>
          <p style={{ fontSize: 16, color: C.onSurfaceVariant, maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
            Four students from SIGCE on a mission to transform the campus experience through technology, design, and community.
          </p>
        </div>

        {/* Team grid */}
        <div className="uf-team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {TEAM.map(member => <MemberCard key={member.name} member={member} />)}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA SECTION
============================================================ */
function CTASection({ onSignup, navigate }) {
  return (
    <section style={{ padding: '80px 24px' }}>
      <div
        className="uf-primary-gradient"
        style={{ maxWidth: 1100, margin: '0 auto', borderRadius: 28, padding: '72px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, background: C.primaryContainer, borderRadius: '50%', opacity: 0.5, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, background: C.secondary, borderRadius: '50%', opacity: 0.3, filter: 'blur(40px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-0.02em' }}>
            Ready to join the network?
          </h2>
          <p style={{ fontSize: 17, color: C.onPrimaryContainer, marginBottom: 44, maxWidth: 500, margin: '0 auto 44px' }}>
            Start exploring your campus marketplace and academic resources today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onSignup}
              className="uf-cta-primary"
              style={{ padding: '16px 40px', borderRadius: 14, background: C.secondary, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,105,106,0.4)' }}
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigate('/home')}
              style={{ padding: '16px 40px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, fontSize: 15, border: '2px solid rgba(255,255,255,0.35)', cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */
function AboutFooter({ navigate }) {
  return (
    <footer style={{ background: C.surfaceContainerLow, padding: '52px 0' }}>
      <div className="uf-footer-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <img src="/UNIFIND.png" alt="UNIFIND" style={{ height: 32, width: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: 20, fontWeight: 900, color: C.primary, fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.04em' }}>UNIFIND</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 280, lineHeight: 1.7 }}>
            The Academic Curator. Revolutionizing how students share and commerce at SIGCE and beyond.
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>© 2026 UNIFIND. All rights reserved.</p>
        </div>
        {/* Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 14 }}>Explore</h4>
            {[
              { label: 'Marketplace', path: '/buyer' },
              { label: 'Need Board', path: '/need-board' },
              { label: 'Dashboard', path: '/dashboard' },
            ].map(({ label, path }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <button onClick={() => navigate(path)}
                  style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.secondary}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >{label}</button>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 14 }}>Legal</h4>
            {[
              { label: 'Privacy Policy', path: '/privacy' },
              { label: 'Terms of Service', path: '/terms' },
              { label: 'Community Guidelines', path: '/community-guidelines' },
            ].map(({ label, path }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <button onClick={() => navigate(path)}
                  style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.secondary}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >{label}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   ROOT
============================================================ */
export default function AboutPage() {
  useAboutStyles();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleProfile = () => navigate(currentUser?.uid ? `/profile/${currentUser.uid}` : '/login');
  const handleLogin   = () => navigate('/login');
  const handleSignup  = () => navigate('/signup');

  return (
    <div className="uf-about" style={{ minHeight: '100vh' }}>
      <Navbar currentUser={currentUser} onProfile={handleProfile} onLogin={handleLogin} onSignup={handleSignup} navigate={navigate} />
      <main>
        <HeroSection />
        <MissionSection />
        <StorySection />
        <TeamSection />
        <CTASection onSignup={handleSignup} navigate={navigate} />
      </main>
      <AboutFooter navigate={navigate} />
    </div>
  );
}
