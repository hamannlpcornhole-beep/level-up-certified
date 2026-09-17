// Player progress, saved in this browser. Everything is wrapped so a blocked
// or private storage never breaks the page.
import { CONFIG } from './config.js';

const KEY = 'luc.v1';
const LEAGUE_KEY = 'luc.league';

const fresh = () => ({
  v: 1,
  enrolled: null,   // { name, email, league, at }
  paid: null,       // { at, demo:true, order }
  done: {},         // moduleId -> timestamp
  checks: {},       // moduleId -> { right, total }
  xp: 0,
  pledge: null,     // { name, at }
  cert: null,       // { id, name, league, issued, expires }
  checklist: {},
});

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch { return fresh(); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  return state;
}

export function update(fn) {
  const s = load();
  fn(s);
  return save(s);
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function getLeagueCode() {
  try { return localStorage.getItem(LEAGUE_KEY) || ''; } catch { return ''; }
}

export function setLeagueCode(code) {
  try { localStorage.setItem(LEAGUE_KEY, code); } catch { /* ignore */ }
}

export function leagueName(code) {
  if (!code) return '';
  const l = CONFIG.leagues[code];
  return l ? l.name : code.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function makeCertId(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  let tail = '';
  const bytes = new Uint8Array(6);
  try { crypto.getRandomValues(bytes); } catch { bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); }); }
  bytes.forEach((b) => { tail += ALPHABET[b % ALPHABET.length]; });
  return `${CONFIG.certPrefix}-${yy}-${tail}`;
}

export function normalizeId(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^LU(\d{2})([A-Z0-9]{6})$/, 'LU-$1-$2');
}

// Demo registry until the real one lives in Shopify.
export const SAMPLE_CERTS = {
  'LU-26-DEMO01': { name: 'Sample Player', league: 'Demo Cornhole League', issued: '2026-09-01', expires: '2027-09-01' },
  'LU-25-PAST01': { name: 'Expired Sample', league: '', issued: '2025-06-01', expires: '2026-06-01' },
};

export function lookupCert(rawId) {
  const id = normalizeId(rawId);
  if (!id) return null;
  const mine = load().cert;
  const rec = (mine && mine.id === id) ? mine : SAMPLE_CERTS[id];
  if (!rec) return { id, status: 'missing' };
  const expired = new Date(rec.expires) < new Date();
  return { id, ...rec, status: expired ? 'expired' : 'valid', sample: !!SAMPLE_CERTS[id] };
}

export function fmtDate(d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  try { return new Date(d).toLocaleDateString('en-US', opts); } catch { return String(d); }
}
