// Shared site chrome and behaviors: nav, menu, footer, dock, reveals, counters,
// league links, toasts, modals. Every page loads this.
import { CONFIG } from './config.js';
import { icon, hydrateIcons } from './icons.js';
import { load, getLeagueCode, setLeagueCode, leagueName } from './store.js';

export const ROOT = new URL('../../', import.meta.url);
export const url = (p = '') => new URL(p, ROOT).href;
export { icon };

const PAGE = document.body.dataset.page || '';

const LINKS = [
  { id: 'certify', label: 'The Course', href: 'certify/' },
  { id: 'gear', label: 'Gear', href: 'gear/' },
  { id: 'play', label: 'Where to Play', href: 'play/' },
  { id: 'training', label: 'Training', href: 'training/' },
  { id: 'leagues', label: 'Leagues', href: 'leagues/' },
  { id: 'giveaways', label: 'Giveaways', href: 'giveaways/' },
  { id: 'verify', label: 'Verify', href: 'verify/' },
];

/* ---------- league attribution ---------- */
function captureLeague() {
  const q = new URLSearchParams(location.search).get('league');
  if (q) {
    const code = q.toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 40);
    if (code) setLeagueCode(code);
  }
  const code = getLeagueCode();
  if (!code) return;
  const name = leagueName(code);
  document.querySelectorAll('[data-league-name]').forEach((el) => { el.textContent = name; });
  document.querySelectorAll('.league-chip').forEach((el) => el.classList.add('is-on'));
}

/* ---------- CTA label depends on progress ---------- */
function ctaState() {
  const s = load();
  if (s.cert) return { label: 'My Card', tag: '', href: url('certify/#/card') };
  if (s.paid) return { label: 'Continue', tag: '', href: url('certify/#/dashboard') };
  return { label: 'Get Certified', tag: CONFIG.priceLabel, href: url('certify/') };
}

/* ---------- nav + menu ---------- */
function renderNav() {
  const host = document.querySelector('[data-nav]');
  if (!host) return;
  const cta = ctaState();
  const links = LINKS.map((l) => `<a href="${url(l.href)}"${PAGE === l.id ? ' aria-current="page"' : ''}>${l.label}</a>`).join('');
  const menuLinks = [{ id: 'home', label: 'Home', href: '' }, ...LINKS]
    .map((l, i) => `<a href="${url(l.href)}"${PAGE === l.id ? ' aria-current="page"' : ''}><small>${String(i).padStart(2, '0')}</small>${l.label}</a>`).join('');
  host.outerHTML = `
    <a class="skip" href="#main">Skip to content</a>
    <header class="nav" id="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="${url('')}" aria-label="Level Up Certified home">
          <img src="${url('assets/img/logo.png')}" alt="" width="300" height="332">
          <span class="brand-word"><b>Level Up</b><span>Certified</span></span>
        </a>
        <nav class="nav-links" aria-label="Main">${links}</nav>
        <div class="nav-right">
          <a class="btn btn-primary btn-sm nav-cta" href="${cta.href}">${cta.label}${cta.tag ? ` <span class="tag">${cta.tag}</span>` : ''}</a>
          <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu">${icon('menu')}</button>
        </div>
      </div>
    </header>
    <div class="menu" id="menu" aria-hidden="true">
      <button class="icon-btn menu-close" type="button" aria-label="Close menu">${icon('x')}</button>
      <nav aria-label="Menu">${menuLinks}</nav>
      <div class="menu-foot">
        <a class="btn btn-primary btn-lg btn-block" href="${cta.href}">${cta.label}${cta.tag ? ` <span class="tag">${cta.tag}</span>` : ''}</a>
        ${CONFIG.showAclDesignation ? `<span class="acl-line">${icon('shield')} ${CONFIG.aclDesignation}</span>` : ''}
      </div>
    </div>`;

  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const toggle = nav.querySelector('.nav-toggle');
  const close = menu.querySelector('.menu-close');
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) close.focus();
  };
  toggle.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false); });

  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- footer ---------- */
function renderFooter() {
  const host = document.querySelector('[data-footer]');
  if (!host) return;
  const socials = Object.entries(CONFIG.social).filter(([, v]) => v)
    .map(([k, v]) => `<a class="icon-btn" href="${v}" target="_blank" rel="noopener" aria-label="${k}">${icon(k)}</a>`).join('');
  host.outerHTML = `
    <footer class="footer">
      <div class="wrap">
        <div class="footer-top">
          <div>
            <a class="brand" href="${url('')}"><img src="${url('assets/img/logo.png')}" alt="Level Up Cornhole" width="300" height="332"><span class="brand-word"><b>Level Up</b><span>Certified</span></span></a>
            <p class="f-blurb">The one-stop certification for cornhole players. Know the rules. Respect the game. Play like you belong.</p>
            ${CONFIG.showAclDesignation ? `<p class="mt-16"><span class="acl-line">${icon('shield')} ${CONFIG.aclDesignation}</span></p>` : ''}
            ${socials ? `<div class="socials">${socials}</div>` : ''}
          </div>
          <div>
            <h4>Certification</h4>
            <ul>
              <li><a href="${url('certify/')}">Get certified</a></li>
              <li><a href="${url('#inside')}">What's inside</a></li>
              <li><a href="${url('verify/')}">Verify a player</a></li>
              <li><a href="${url('giveaways/')}">Giveaways</a></li>
            </ul>
          </div>
          <div>
            <h4>The Hub</h4>
            <ul>
              <li><a href="${url('gear/')}">Gear guide</a></li>
              <li><a href="${url('play/')}">Where to play</a></li>
              <li><a href="${url('training/')}">Training center</a></li>
              <li><a href="${url('leagues/')}">For leagues</a></li>
            </ul>
          </div>
          <div>
            <h4>Level Up Cornhole</h4>
            <ul>
              <li><a href="${CONFIG.shop}" target="_blank" rel="noopener">Coaching programs</a></li>
              <li><a href="${CONFIG.findYourProgramUrl}" target="_blank" rel="noopener">Find your program</a></li>
              <li><a href="${CONFIG.bgCollabUrl}" target="_blank" rel="noopener">Level Up x BG bags</a></li>
              <li><a href="mailto:${CONFIG.contactEmail}">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-word" aria-hidden="true">Level Up Certified</div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} Level Up Cornhole LLC. All rights reserved.</span>
          <span class="row wrap-row" style="gap:18px"><a href="${url('giveaways/#rules')}">Giveaway rules</a><a href="${url('verify/')}">Verify</a>${CONFIG.demoMode ? '<span>Demo build</span>' : ''}</span>
        </div>
      </div>
    </footer>`;
}

/* ---------- mobile dock + demo pill ---------- */
function renderDock() {
  if (PAGE === 'certify' || document.body.dataset.noDock !== undefined) return;
  const cta = ctaState();
  const dock = document.createElement('div');
  dock.className = 'dock glass';
  dock.innerHTML = `<div class="dock-text"><b>${cta.label === 'Get Certified' ? 'Get Level Up Certified' : cta.label}</b><span>${CONFIG.priceLabel} &middot; good for a year</span></div><a class="btn btn-primary btn-sm" href="${cta.href}">${cta.label === 'Get Certified' ? 'Start' : 'Open'} ${icon('arrow', 'arrow')}</a>`;
  document.body.appendChild(dock);
  const footer = () => document.querySelector('.footer');
  const onScroll = () => {
    const f = footer();
    const nearFooter = f && f.getBoundingClientRect().top < window.innerHeight;
    const show = window.scrollY > window.innerHeight * 0.6 && !nearFooter;
    dock.classList.toggle('is-visible', show);
    document.body.classList.toggle('dock-on', show);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function renderDemoPill() {
  if (!CONFIG.demoMode) return;
  const pill = document.createElement('div');
  pill.className = 'demo-pill';
  pill.title = 'Demo mode: payments are off and nothing is charged.';
  pill.innerHTML = '<i class="dot"></i> Demo mode';
  document.body.appendChild(pill);
}

/* ---------- reveals, counters, magnetic, cursor glow ---------- */
function initReveals() {
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    const step = parseFloat(parent.dataset.stagger) || 0.07;
    [...parent.children].forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
      child.style.setProperty('--d', `${(i * step).toFixed(2)}s`);
    });
  });
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => io.observe(el));
}

export function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || '0', 10);
  const pre = el.dataset.prefix || '';
  const suf = el.dataset.suffix || '';
  const dur = 1400;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = pre + (target * eased).toFixed(dec) + suf;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

function initMagnetic() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.28;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

function initCursorGlow() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.prepend(glow);
  let raf = 0; let x = -999; let y = -999;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; glow.style.setProperty('--cx', `${x}px`); glow.style.setProperty('--cy', `${y}px`); });
  }, { passive: true });
}

/* ---------- toasts + modals + helpers ---------- */
export function toast(message, iconName = 'checkCircle', ms = 3200) {
  let host = document.querySelector('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${icon(iconName)}<span>${message}</span>`;
  host.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
}

export function openModal(el) {
  const m = typeof el === 'string' ? document.getElementById(el) : el;
  if (!m) return;
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const focusable = m.querySelector('input, button, a, select, textarea');
  if (focusable) setTimeout(() => focusable.focus(), 60);
}

export function closeModal(el) {
  const m = typeof el === 'string' ? document.getElementById(el) : el;
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal.is-open')) document.body.classList.remove('modal-open');
}

function initModals() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-modal]');
    if (opener) { e.preventDefault(); openModal(opener.dataset.openModal); return; }
    const closer = e.target.closest('[data-close-modal]');
    if (closer) { closeModal(closer.closest('.modal')); return; }
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.is-open').forEach((m) => closeModal(m));
  });
}

const scriptCache = new Map();
export function loadScript(src) {
  if (!scriptCache.has(src)) {
    scriptCache.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve(); s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    }));
  }
  return scriptCache.get(src);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove(); return ok;
  }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- boot ---------- */
renderNav();
renderFooter();
hydrateIcons();
captureLeague();
renderDock();
renderDemoPill();
initReveals();
initCounters();
initMagnetic();
initCursorGlow();
initModals();
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = CONFIG.priceLabel; });
document.querySelectorAll('[data-season]').forEach((el) => { el.textContent = CONFIG.season; });
if (!CONFIG.showAclDesignation) document.querySelectorAll('[data-acl]').forEach((el) => el.remove());
