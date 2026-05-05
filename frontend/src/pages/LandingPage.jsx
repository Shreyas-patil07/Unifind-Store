import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserCount } from '../services/api';

/* ============================================================
   INLINE STYLES — matches code.html + DESIGN.md spec
   Color tokens, ghost-shadow, glass-header, primary-gradient,
   signature-underline animation – all implemented via inline
   style objects or a scoped <style> tag injected once.
============================================================ */

const COLORS = {
  background: '#f8f9ff',
  onSurface: '#171c22',
  onSurfaceVariant: '#42474f',
  primary: '#003358',
  primaryContainer: '#004a7c',
  secondary: '#00696a',
  secondaryContainer: '#90eff0',
  onSecondaryContainer: '#006e6f',
  tertiaryFixedDim: '#ffba3f',
  surfaceContainerLow: '#f0f4fd',
  surfaceContainer: '#eaeef7',
  surfaceContainerHigh: '#e4e8f1',
  surfaceContainerHighest: '#dee3eb',
  surfaceContainerLowest: '#ffffff',
  outlineVariant: '#c1c7d0',
  onPrimaryContainer: '#87baf3',
};

const ghostShadow = '0 12px 40px rgba(0,74,124,0.06)';

/* Inject Google Fonts + custom styles once */
function usePageStyles() {
  useEffect(() => {
    // Google Fonts
    if (!document.getElementById('uf-gfonts')) {
      const link = document.createElement('link');
      link.id = 'uf-gfonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
    // Scoped CSS
    if (!document.getElementById('uf-landing-styles')) {
      const tag = document.createElement('style');
      tag.id = 'uf-landing-styles';
      tag.textContent = `
        .uf-body { font-family: 'Manrope', sans-serif; background: #f8f9ff; color: #171c22; }
        .uf-mso { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal;
                  font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none;
                  display: inline-block; white-space: nowrap; word-wrap: normal;
                  direction: ltr; -webkit-font-smoothing: antialiased; }
        .uf-glass-header { background: rgba(255,255,255,0.80); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .uf-primary-gradient { background: linear-gradient(135deg, #003358 0%, #004a7c 100%); }
        .uf-bulletin-card { transition: background 0.25s; }
        .uf-bulletin-card:hover { background-color: #e4e8f1 !important; }
        .uf-sig-underline { position: relative; display: inline-block; }
        .uf-sig-underline::after { content: ''; position: absolute; bottom: -2px; left: 0;
          width: 100%; height: 3px; background: #ffba3f; transform: scaleX(0.45);
          transform-origin: left; transition: transform 0.3s ease; border-radius: 2px; }
        .uf-sig-underline:hover::after { transform: scaleX(1); }
        .uf-path-card { transition: background 0.25s; cursor: pointer; }
        .uf-path-card:hover { background-color: #e4e8f1 !important; }
        .uf-path-card:hover .uf-path-arrow { color: #003358 !important; }
        .uf-btn-contact { transition: background 0.2s, color 0.2s; }
        .uf-btn-contact:hover { background: #00696a !important; color: #fff !important; }
        .uf-upload-btn:hover { opacity: 0.88; }
        .uf-cta-primary:hover { transform: scale(1.04); }
        .uf-cta-secondary:hover { background: #dee3eb !important; }
        .uf-footer-social:hover { background: #90eff0 !important; }
        .uf-nav-link { transition: color 0.2s; }
        .uf-nav-link:hover { color: #00696a !important; }
        @media (max-width: 768px) {
          .uf-search-bar { flex-direction: column !important; }
        }
        @media (min-width: 769px) {
          .uf-mobile-btn { display: none !important; }
        }
      `;
      document.head.appendChild(tag);
    }
  }, []);
}

/* ============================================================
   ICON wrapper (Material Symbols Outlined)
============================================================ */
function Icon({ name, fill = 0, size = 24, className = '', style = {} }) {
  return (
    <span
      className={`uf-mso ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: size,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

/* ============================================================
   NAVBAR
============================================================ */
function Navbar({ currentUser, onProfile, onLogin, onSignup }) {
  const [activeSection, setActiveSection] = useState('market');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['market', 'library', 'community'];
      const scrollPosition = window.scrollY + 100; // Offset for fixed navbar

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  return (
    <nav
      className="uf-glass-header"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/UNIFIND.png" alt="UNIFIND Logo" style={{ height: 48, width: 48, objectFit: 'contain' }} />
          <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: COLORS.primary }}>
            UNIFIND
          </span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="uf-desktop-nav">
          <a 
            href="#market" 
            className="uf-nav-link" 
            onClick={() => handleNavClick('market')}
            style={{ 
              color: activeSection === 'market' ? COLORS.primary : '#475569', 
              fontWeight: activeSection === 'market' ? 700 : 500, 
              fontSize: 13, 
              borderBottom: activeSection === 'market' ? `2px solid ${COLORS.tertiaryFixedDim}` : 'none', 
              paddingBottom: 4, 
              textDecoration: 'none' 
            }}
          >
            Market
          </a>
          <a 
            href="#library" 
            className="uf-nav-link" 
            onClick={() => handleNavClick('library')}
            style={{ 
              color: activeSection === 'library' ? COLORS.primary : '#475569', 
              fontWeight: activeSection === 'library' ? 700 : 500, 
              fontSize: 13, 
              borderBottom: activeSection === 'library' ? `2px solid ${COLORS.tertiaryFixedDim}` : 'none', 
              paddingBottom: 4, 
              textDecoration: 'none' 
            }}
          >
            Library
          </a>
          <a 
            href="#community" 
            className="uf-nav-link" 
            onClick={() => handleNavClick('community')}
            style={{ 
              color: activeSection === 'community' ? COLORS.primary : '#475569', 
              fontWeight: activeSection === 'community' ? 700 : 500, 
              fontSize: 13, 
              borderBottom: activeSection === 'community' ? `2px solid ${COLORS.tertiaryFixedDim}` : 'none', 
              paddingBottom: 4, 
              textDecoration: 'none' 
            }}
          >
            Community
          </a>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentUser ? (
            <button
              onClick={onProfile}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 12,
                background: 'linear-gradient(135deg, #003358 0%, #004a7c 100%)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                border: 'none', cursor: 'pointer',
              }}
              data-testid="landing-profile-btn"
            >
              <Icon name="person" size={18} />
              Profile
            </button>
          ) : (
            <button
              onClick={onLogin}
              style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'transparent', color: COLORS.onSurfaceVariant,
                fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLORS.surfaceContainer)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              data-testid="landing-login-btn"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   SIGCE BANNER
============================================================ */
function SIGCEBanner() {
  return (
    <div style={{ background: COLORS.surfaceContainerLow, borderBottom: `1px solid ${COLORS.outlineVariant}22`, padding: '8px 0', marginTop: 64 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: COLORS.onSurfaceVariant }}>
          Active Campus
        </span>
        <span style={{ height: 6, width: 6, borderRadius: '50%', background: COLORS.tertiaryFixedDim, display: 'inline-block' }} />
        <a
          href="https://sigce.edu.in/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary, textDecoration: 'none' }}
          data-testid="sigce-link"
        >
          Smt. Indira Gandhi College of Engineering
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   HERO SECTION
============================================================ */
function HeroSection({ onSignup, onBrowse, onAbout, userCount }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 72, paddingBottom: 96 }}>
      <div
        style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
        }}
        className="uf-hero-grid"
      >
        {/* Left: Text + Search */}
        <div style={{ zIndex: 10 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.secondaryContainer, color: COLORS.onSecondaryContainer, padding: '8px 16px', borderRadius: 9999, marginBottom: 24 }}>
            <Icon name="bolt" fill={1} size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>AI-MATCHING ACTIVE FOR SIGCE</span>
          </div>

          {/* H1 */}
          <h1
            style={{ fontSize: 'clamp(2.8rem, 5vw, 5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: COLORS.primary, lineHeight: 1.05, marginBottom: 20 }}
            data-testid="hero-title"
          >
            Buy &amp; Sell on{' '}
            <span style={{ color: COLORS.secondary, fontStyle: 'italic' }}>Campus.</span>
          </h1>

          <p style={{ fontSize: 17, color: COLORS.onSurfaceVariant, marginBottom: 36, maxWidth: 420, lineHeight: 1.65 }} data-testid="hero-description">
            The curated marketplace for textbooks, electronics, and study guides. Verified by peers, matched by AI.
          </p>

          {/* Get Started Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <button
              onClick={onSignup}
              className="uf-primary-gradient"
              style={{
                padding: '16px 48px',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                boxShadow: ghostShadow,
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,74,124,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = ghostShadow;
              }}
            >
              Get Started
            </button>

            {/* About Us Button */}
            <button
              onClick={onAbout}
              style={{
                padding: '16px 48px',
                borderRadius: 12,
                color: COLORS.onSurface,
                fontWeight: 600,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                background: COLORS.surfaceContainerHigh,
                transition: 'transform 0.2s, background 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = COLORS.surfaceContainerHighest;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = COLORS.surfaceContainerHigh;
              }}
            >
              About Us
            </button>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative', height: 480, borderRadius: 16, overflow: 'hidden', boxShadow: ghostShadow, transform: 'rotate(2deg)' }}>
            <img
              src="https://gonzaga.azureedge.net/-/media/Website/Images/Body-Content/About/Our-Campus-and-Location/body-college-hall.ashx?h=428px&w=750px&rev=a09c7976b5bb4fad80a88ae77daaa227&hash=AB682326061999B3FF357764EE74082B"
              alt="College students sharing notes"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,51,88,0.40) 0%, transparent 60%)' }} />
          </div>
          {/* Float badge */}
          <div style={{ position: 'absolute', bottom: -20, left: -24, background: '#fff', padding: 20, borderRadius: 16, boxShadow: ghostShadow, border: `1px solid ${COLORS.outlineVariant}1A` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: `${COLORS.tertiaryFixedDim}33`, padding: 10, borderRadius: 10 }}>
                <Icon name="stars" fill={1} size={24} style={{ color: '#614100' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: 500 }}>Community Verified</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.primary }}>4.9/5 Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive override styles */}
      <style>{`
        @media (max-width: 768px) {
          .uf-hero-grid { grid-template-columns: 1fr !important; }
          .uf-hero-grid > div:last-child { display: none; }
          .uf-desktop-nav { display: none !important; }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   DUAL PATH SECTION
============================================================ */
function DualPath({ onMarket, onLibrary }) {
  return (
    <section id="market" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="uf-dual-grid">
        <style>{`@media (max-width: 640px) { .uf-dual-grid { grid-template-columns: 1fr !important; } }`}</style>
        {/* Marketplace */}
        <div
          className="uf-path-card"
          onClick={onMarket}
          style={{ padding: 32, borderRadius: 16, background: COLORS.surfaceContainerLow, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
            <div style={{ background: '#fff', padding: 14, borderRadius: 10, boxShadow: ghostShadow }}>
              <Icon name="shopping_cart" size={28} style={{ color: COLORS.secondary }} />
            </div>
            <span className="uf-path-arrow" style={{ color: COLORS.outlineVariant, transition: 'color 0.2s' }}>
              <Icon name="arrow_forward" size={22} />
            </span>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: COLORS.primary, marginBottom: 8 }}>Student Marketplace</h3>
          <p style={{ color: COLORS.onSurfaceVariant, marginBottom: 20, fontSize: 14, maxWidth: 280 }}>Buy and sell physical gear from peers directly on campus.</p>
          <span className="uf-sig-underline" style={{ color: COLORS.secondary, fontWeight: 700, fontSize: 13 }}>Browse Gear</span>
        </div>

        {/* Library */}
        <div
          className="uf-path-card"
          onClick={onLibrary}
          style={{ padding: 32, borderRadius: 16, background: COLORS.surfaceContainerLow, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
            <div style={{ background: '#fff', padding: 14, borderRadius: 10, boxShadow: ghostShadow }}>
              <Icon name="library_books" size={28} style={{ color: COLORS.primary }} />
            </div>
            <span className="uf-path-arrow" style={{ color: COLORS.outlineVariant, transition: 'color 0.2s' }}>
              <Icon name="arrow_forward" size={22} />
            </span>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: COLORS.primary, marginBottom: 8 }}>Academic Library</h3>
          <p style={{ color: COLORS.onSurfaceVariant, marginBottom: 20, fontSize: 14, maxWidth: 280 }}>Access high-quality study guides, notes, and digital resources.</p>
          <span className="uf-sig-underline" style={{ color: COLORS.primary, fontWeight: 700, fontSize: 13 }}>Explore Library</span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   DIGITAL LIBRARY SECTION
============================================================ */
const LIBRARY_NOTES = [
  { icon: 'picture_as_pdf', iconColor: '#f87171', iconBg: '#fef2f2', iconBorder: '#fecaca', title: 'SEM-4 Discrete Mathematics Solutions', meta: 'Uploaded by Prof. Gupta\'s Lab', downloads: 52, price: 'FREE', priceColor: COLORS.secondary },
  { icon: 'article', iconColor: '#60a5fa', iconBg: '#eff6ff', iconBorder: '#bfdbfe', title: 'Microprocessors Quick Revision Guide', meta: 'Handwritten • Verified', downloads: 128, price: '₹49', priceColor: COLORS.secondary },
  { icon: 'description', iconColor: '#34d399', iconBg: '#ecfdf5', iconBorder: '#a7f3d0', title: 'DBMS Normalization Flashcards', meta: 'Top Rated • 2024', downloads: 89, price: 'FREE', priceColor: COLORS.secondary },
  { icon: 'picture_as_pdf', iconColor: '#a78bfa', iconBg: '#f5f3ff', iconBorder: '#ddd6fe', title: 'Operating Systems Lab Manual', meta: 'PDF Version • Verified', downloads: 210, price: 'FREE', priceColor: COLORS.secondary },
];

function LibraryNote({ note }) {
  return (
    <div
      className="uf-bulletin-card"
      style={{ padding: 18, background: '#fff', borderRadius: 14, boxShadow: ghostShadow, display: 'flex', gap: 14, alignItems: 'center' }}
    >
      <div style={{ height: 60, width: 46, background: note.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${note.iconBorder}`, flexShrink: 0 }}>
        <Icon name={note.icon} size={22} style={{ color: note.iconColor }} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <h5 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</h5>
        <p style={{ fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 2 }}>{note.meta}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 10, background: COLORS.surfaceContainer, padding: '2px 8px', borderRadius: 4, color: COLORS.onSurfaceVariant }}>{note.downloads} Downloads</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: note.priceColor }}>{note.price}</span>
        </div>
      </div>
    </div>
  );
}

function DigitalLibrary({ onUploadNotes }) {
  return (
    <section id="library" style={{ background: COLORS.surfaceContainerLow, padding: '72px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'start' }} className="uf-lib-grid">
          <style>{`@media (max-width: 768px) { .uf-lib-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 20 }}>
              Digital Library<br />for Scholars
            </h2>
            <p style={{ color: COLORS.onSurfaceVariant, marginBottom: 28, fontSize: 14, lineHeight: 1.7 }}>
              Access hundreds of peer-reviewed study guides and handwritten notes specific to your curriculum at SIGCE.
            </p>
            <button
              onClick={onUploadNotes}
              className="uf-primary-gradient uf-upload-btn"
              style={{ padding: '14px 28px', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'opacity 0.2s' }}
            >
              Upload Your Notes
              <Icon name="upload" size={20} style={{ color: '#fff' }} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="uf-notes-grid">
            <style>{`@media (max-width: 500px) { .uf-notes-grid { grid-template-columns: 1fr !important; } }`}</style>
            {LIBRARY_NOTES.map((note, i) => <LibraryNote key={i} note={note} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   VALUE PROPS SECTION
============================================================ */
const VALUE_PROPS = [
  {
    icon: 'psychology',
    iconBg: COLORS.secondaryContainer,
    iconColor: COLORS.onSecondaryContainer,
    title: 'AI Smart Matching',
    desc: 'Our algorithms match you with books and notes based on your semester, branch, and current subjects.',
  },
  {
    icon: 'shield_with_heart',
    iconBg: `${COLORS.tertiaryFixedDim}4D`,
    iconColor: '#614100',
    title: 'Student Trust Score',
    desc: 'Shop with confidence using our transparency-first trust scores calculated from actual peer reviews and verified exchanges.',
  },
  {
    icon: 'task_alt',
    iconBg: '#d0e4ff',
    iconColor: COLORS.primary,
    title: 'Condition Grading',
    desc: "Every item goes through a standardized condition check—from 'Library Mint' to 'Scholar's Choice' with heavy annotations.",
  },
];

function ValueProps() {
  return (
    <section style={{ padding: '80px 0', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }} className="uf-val-grid">
        <style>{`@media (max-width: 768px) { .uf-val-grid { grid-template-columns: 1fr !important; } }`}</style>
        {VALUE_PROPS.map((vp, i) => (
          <div key={i}>
            <div style={{ width: 48, height: 48, background: vp.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginBottom: 20 }}>
              <Icon name={vp.icon} fill={1} size={24} style={{ color: vp.iconColor }} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary, marginBottom: 10 }}>{vp.title}</h4>
            <p style={{ color: COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 1.75 }}>{vp.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   TRUST & COMMUNITY (CTA Banner)
============================================================ */
function TrustSection({ onSignup, userCount }) {
  return (
    <section id="community" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>
      <div
        className="uf-primary-gradient"
        style={{ borderRadius: 20, padding: '56px 64px', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 18, lineHeight: 1.2 }}>Verified Campus Identity</h2>
          <p style={{ color: COLORS.onPrimaryContainer, fontSize: 15, marginBottom: 28, lineHeight: 1.7, maxWidth: 420 }}>
            Every buyer and seller on UNIFIND is a verified student or faculty member of Smt. Indira Gandhi College of Engineering. No outsiders, no scams.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[{ icon: 'domain', label: 'Campus Pickups' }, { icon: 'payments', label: 'Secure Escrow' }].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, backdropFilter: 'blur(8px)' }}>
                <Icon name={icon} size={18} style={{ color: COLORS.secondaryContainer }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats card */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', minWidth: 260, flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: COLORS.secondaryContainer }}>Community Stats</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Live</span>
          </div>
          {[
            { label: 'Active Students', value: userCount > 0 ? userCount.toLocaleString() : '0' }, 
            { label: 'Items Exchanged', value: '0' }, 
            { label: 'Library Saves', value: '₹0' }
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <span style={{ color: '#fff', fontSize: 13 }}>{label}</span>
              <span style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA SECTION
============================================================ */
function FinalCTA({ onSignup, onBrowse }) {
  return (
    <section style={{ padding: '72px 24px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, color: COLORS.primary, marginBottom: 20, letterSpacing: '-0.03em' }} data-testid="cta-title">
        Ready to join your campus ecosystem?
      </h2>
      <p style={{ fontSize: 17, color: COLORS.onSurfaceVariant, marginBottom: 44, lineHeight: 1.6 }}>
        Join thousands of students at SIGCE saving money and improving grades every single semester.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={onSignup}
          className="uf-primary-gradient uf-cta-primary"
          style={{ padding: '16px 36px', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: ghostShadow, transition: 'transform 0.2s' }}
          data-testid="cta-signup-btn"
        >
          Get Started for Free
        </button>
        <button
          onClick={onBrowse}
          className="uf-cta-secondary"
          style={{ padding: '16px 36px', borderRadius: 14, color: COLORS.primary, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', background: COLORS.surfaceContainerHigh, transition: 'background 0.2s' }}
        >
          Browse Listings
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */
function LandingFooter({ onNavigate }) {
  const footerLinks = {
    resources: [
      { label: 'About Us', path: '/about' },
      { label: 'Safety Guidelines', path: '/community-guidelines' },
      { label: 'Terms of Service', path: '/terms-conditions' }
    ],
    support: [
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Contact Support', path: 'mailto:systemrecords@gmail.com', isExternal: true }
    ]
  };

  const socialLinks = [
    { icon: 'public', url: 'https://sigce.edu.in/', label: 'Website' },
    { icon: 'mail', url: 'mailto:systemrecords@gmail.com', label: 'Email' }
  ];

  return (
    <footer style={{ background: COLORS.surfaceContainerLow, padding: '56px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }} className="uf-footer-grid">
        <style>{`@media (max-width: 640px) { .uf-footer-grid { grid-template-columns: 1fr !important; } }`}</style>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <img src="/UNIFIND.png" alt="UNIFIND" style={{ height: 24, width: 24, objectFit: 'contain' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>UNIFIND</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 300, marginBottom: 20 }}>© 2026 UNIFIND. The Academic Curator for Modern Campus Life.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {socialLinks.map(({ icon, url, label }) => (
              <a 
                key={icon} 
                href={url} 
                target={url.startsWith('http') ? '_blank' : undefined}
                rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="uf-footer-social" 
                style={{ height: 32, width: 32, borderRadius: '50%', background: COLORS.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary, transition: 'background 0.2s', textDecoration: 'none' }}
              >
                <Icon name={icon} size={16} style={{ color: COLORS.primary }} />
              </a>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 14 }}>Resources</h4>
            {footerLinks.resources.map(({ label, path }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => onNavigate(path)}
                  style={{ 
                    fontSize: 13, 
                    color: '#64748b', 
                    textDecoration: 'underline', 
                    transition: 'color 0.2s',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = COLORS.secondary)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >{label}</button>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 14 }}>Support</h4>
            {footerLinks.support.map(({ label, path, isExternal }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                {isExternal ? (
                  <a
                    href={path}
                    style={{ 
                      fontSize: 13, 
                      color: '#64748b', 
                      textDecoration: 'underline', 
                      transition: 'color 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = COLORS.secondary)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  >{label}</a>
                ) : (
                  <button
                    onClick={() => onNavigate(path)}
                    style={{ 
                      fontSize: 13, 
                      color: '#64748b', 
                      textDecoration: 'underline', 
                      transition: 'color 0.2s',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = COLORS.secondary)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  >{label}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   ROOT COMPONENT
============================================================ */
const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  
  usePageStyles();

  // Fetch user count on mount
  useEffect(() => {
    const fetchUserCount = async () => {
      const count = await getUserCount();
      setUserCount(count);
    };
    fetchUserCount();
  }, []);

  const handleUploadNotes = () => {
    if (currentUser) {
      navigate('/seller');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="uf-body" style={{ minHeight: '100dvh', overflowX: 'hidden' }}>
      <Navbar
        currentUser={currentUser}
        onProfile={() => navigate('/profile')}
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
      />
      <SIGCEBanner />
      <HeroSection onSignup={() => navigate('/signup')} onBrowse={() => navigate('/buyer')} onAbout={() => navigate('/about')} userCount={userCount} />
      <DualPath onMarket={() => navigate('/buyer')} onLibrary={() => navigate('/buyer')} />
      <DigitalLibrary onUploadNotes={handleUploadNotes} />
      <ValueProps />
      <TrustSection onSignup={() => navigate('/signup')} userCount={userCount} />
      <FinalCTA onSignup={() => navigate('/signup')} onBrowse={() => navigate('/buyer')} />
      <LandingFooter onNavigate={navigate} />
    </div>
  );
};

export default LandingPage;
