import '../../landing.css';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';

const SLIDES = [
  {
    img: '/images/entrepreneur-1.png',
    caption: 'Mary Johnson — Women-led produce market, Monrovia',
    badge: 'Women-Led Business',
  },
  {
    img: '/images/entrepreneur-2.png',
    caption: 'Youth-driven ICT and mobile repair services',
    badge: 'Youth Entrepreneur',
  },
  {
    img: '/images/entrepreneur-3.png',
    caption: 'Women cooperative tailoring & fashion — Kakata',
    badge: "Women's Cooperative",
  },
  {
    img: '/images/entrepreneur-4.png',
    caption: 'Agricultural entrepreneur — Cassava & crop farming',
    badge: 'Youth in Agriculture',
  },
  {
    img: '/images/entrepreneur-5.png',
    caption: 'Traditional crafts & exports at national trade fair',
    badge: 'Creative Industry',
  },
  {
    img: '/images/entrepreneur-6.png',
    caption: 'Youth startup incubation — Monrovia tech hub',
    badge: 'Innovation & Tech',
  },
];

const STATS_FALLBACK = [
  { label: 'MSMEs Registered', value: '12,400+', icon: '🏢' },
  { label: 'Counties Covered', value: '15 / 15', icon: '🗺️' },
  { label: 'Youth-Led Businesses', value: '38%', icon: '⚡' },
  { label: 'Women Entrepreneurs', value: '52%', icon: '💪' },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const { data: dashboardData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => analyticsApi.getDashboard().then(r => r.data.data),
    retry: false,
    staleTime: 300_000,
  });

  const stats = dashboardData ? [
    { label: 'MSMEs Registered', value: dashboardData.totalMSMEs?.toLocaleString() || '—', icon: '🏢' },
    { label: 'Counties Covered', value: '15 / 15', icon: '🗺️' },
    { label: 'Youth-Led Businesses', value: dashboardData.youthLedPercent ? `${dashboardData.youthLedPercent}%` : '38%', icon: '⚡' },
    { label: 'Women-Led Businesses', value: dashboardData.womenLedPercent ? `${dashboardData.womenLedPercent}%` : '52%', icon: '💪' },
  ] : STATS_FALLBACK;

  const goToSlide = (idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => { setActiveSlide(idx); setIsTransitioning(false); }, 300);
  };

  const nextSlide = () => goToSlide((activeSlide + 1) % SLIDES.length);
  const prevSlide = () => goToSlide((activeSlide - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => clearInterval(intervalRef.current);
  }, [activeSlide]);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="landing-page">
      {/* ── Animated Background ────────────────────────────────── */}
      <div className="landing-bg">
        <div className="landing-orb orb-1" />
        <div className="landing-orb orb-2" />
        <div className="landing-orb orb-3" />
        <div className="landing-grid" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrollY > 20 ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-crest">🇱🇷</div>
            <div>
              <p className="landing-logo-title">SBA MSME Portal</p>
              <p className="landing-logo-sub">Ministry of Commerce &amp; Industry</p>
            </div>
          </div>
          <div className="landing-nav-links">
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#stats" className="landing-nav-link">Statistics</a>
            <a href="#partners" className="landing-nav-link">Partners</a>
            <Link href="/login"><a className="landing-nav-cta">Sign In</a></Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">

          {/* LEFT — Content */}
          <div className="landing-hero-left">
            {/* Program badge */}
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              PAYEI Program — Sub-Project A: YEIB
            </div>

            <h1 className="landing-h1">
              <span className="landing-h1-line1">Liberia's National</span>
              <span className="landing-h1-line2">MSME Registry</span>
              <span className="landing-h1-accent">&amp; Reporting Portal</span>
            </h1>

            <p className="landing-subtitle">
              A centralized, real-time national database empowering micro, small, and medium
              enterprises across all <strong>15 counties</strong> of Liberia — supporting youth
              entrepreneurship, women-led businesses, and sustainable economic growth.
            </p>

            {/* CTA Buttons */}
            <div className="landing-ctas">
              <Link href="/login">
                <a className="landing-cta-primary">
                  <span>Access Portal</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </Link>
              <a href="#stats" className="landing-cta-secondary">
                <span>View Statistics</span>
              </a>
            </div>

            {/* Live Stats Strip */}
            <div id="stats" className="landing-stats-strip">
              {stats.map((s, i) => (
                <div key={i} className="landing-stat">
                  <span className="landing-stat-icon">{s.icon}</span>
                  <div>
                    <p className="landing-stat-value">{s.value}</p>
                    <p className="landing-stat-label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Carousel */}
          <div className="landing-hero-right">
            <div className="landing-carousel">
              {/* Glow ring */}
              <div className="landing-carousel-glow" />

              {/* Images */}
              <div className="landing-carousel-images">
                {SLIDES.map((slide, i) => (
                  <div
                    key={i}
                    className={`landing-carousel-slide ${i === activeSlide ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
                  >
                    <img src={slide.img} alt={slide.caption} loading="lazy" />
                    <div className="landing-slide-overlay">
                      <span className="landing-slide-badge">{slide.badge}</span>
                      <p className="landing-slide-caption">{slide.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <button className="landing-carousel-btn landing-carousel-prev" onClick={prevSlide} aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="landing-carousel-btn landing-carousel-next" onClick={nextSlide} aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {/* Dots */}
              <div className="landing-carousel-dots">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`landing-dot ${i === activeSlide ? 'active' : ''}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Floating info cards */}
              <div className="landing-float-card landing-float-card--tl">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-bold text-white">PAYEI Funded</p>
                  <p className="text-xs text-white/60">AfDB Program</p>
                </div>
              </div>
              <div className="landing-float-card landing-float-card--br">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs font-bold text-white">All 15 Counties</p>
                  <p className="text-xs text-white/60">National Coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section id="about" className="landing-features">
        <div className="landing-container">
          <div className="landing-section-header">
            <p className="landing-section-tag">Platform Features</p>
            <h2 className="landing-section-title">Everything You Need to Support MSMEs</h2>
            <p className="landing-section-sub">A comprehensive digital platform built for government efficiency, field operations, and data-driven policy decisions.</p>
          </div>

          <div className="landing-features-grid">
            {[
              { icon: '🗄️', title: 'National Registry', desc: 'Centralized database of MSMEs and BDSPs across all 15 Liberian counties with full business profiles.' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Real-time KPI tracking, sector analysis, county performance, and youth/women inclusion metrics.' },
              { icon: '🗺️', title: 'GIS Mapping', desc: 'Geographic visualization of enterprise distribution with interactive Leaflet maps and county filters.' },
              { icon: '📴', title: 'Offline-First PWA', desc: 'Field data collection without internet. IndexedDB-backed offline mode with automatic sync when online.' },
              { icon: '✅', title: 'Approval Workflow', desc: 'Multi-stage approval pipeline: Draft → Submit → Verify → Approve with role-based access control.' },
              { icon: '📄', title: 'Automated Reports', desc: 'Generate donor-ready reports by county, sector, period, and inclusion indicators. Export to CSV.' },
              { icon: '📥', title: 'Bulk Import', desc: 'Upload CSV or Excel files for bulk MSME registration with automatic deduplication and validation.' },
              { icon: '🔐', title: 'Secure & Auditable', desc: 'RBAC with 10 user roles, JWT authentication, account lockout, and complete audit trail.' },
            ].map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners Section ────────────────────────────────────── */}
      <section id="partners" className="landing-partners">
        <div className="landing-container">
          <div className="landing-section-header">
            <p className="landing-section-tag">Development Partners</p>
            <h2 className="landing-section-title">Supported By</h2>
          </div>
          <div className="landing-partners-grid">
            {[
              { name: 'Republic of Liberia', abbr: 'GoL', flag: '🇱🇷' },
              { name: 'Ministry of Commerce', abbr: 'MoCI', flag: '🏛️' },
              { name: 'PAYEI Program', abbr: 'PAYEI', flag: '🤝' },
              { name: 'African Development Bank', abbr: 'AfDB', flag: '🌍' },
              { name: 'YEIB Program', abbr: 'YEIB', flag: '💼' },
              { name: 'Bureau of Small Business', abbr: 'SBA', flag: '⭐' },
            ].map((p, i) => (
              <div key={i} className="landing-partner-card">
                <span className="text-3xl">{p.flag}</span>
                <p className="landing-partner-abbr">{p.abbr}</p>
                <p className="landing-partner-name">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-container landing-cta-inner">
          <div className="landing-cta-glass">
            <h2 className="landing-cta-title">Ready to Access the Portal?</h2>
            <p className="landing-cta-sub">Sign in to register MSMEs, generate reports, and monitor Liberia's enterprise growth.</p>
            <Link href="/login">
              <a className="landing-cta-primary landing-cta-large">
                <span>Sign In to Portal</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🇱🇷</span>
              <span className="font-bold text-white">SBA MSME Portal</span>
            </div>
            <p className="text-white/50 text-xs">Ministry of Commerce &amp; Industry<br />Republic of Liberia</p>
          </div>
          <div className="landing-footer-links">
            <p className="landing-footer-heading">Quick Links</p>
            <Link href="/login"><a className="landing-footer-link">Sign In</a></Link>
            <a href="#about" className="landing-footer-link">About</a>
            <a href="#stats" className="landing-footer-link">Statistics</a>
          </div>
          <div className="landing-footer-links">
            <p className="landing-footer-heading">Program</p>
            <a className="landing-footer-link">PAYEI Initiative</a>
            <a className="landing-footer-link">YEIB Sub-Project A</a>
            <a className="landing-footer-link">AfDB Partnership</a>
          </div>
          <div className="landing-footer-links">
            <p className="landing-footer-heading">Contact</p>
            <a href="mailto:info@sba.gov.lr" className="landing-footer-link">info@sba.gov.lr</a>
            <a className="landing-footer-link">+231 77 000 0000</a>
            <a className="landing-footer-link">Monrovia, Liberia</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} Bureau of Small Business Administration — Republic of Liberia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
