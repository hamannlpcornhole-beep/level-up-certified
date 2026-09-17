// Where to play: the ladder, the league finder and the game day list.
import { CONFIG } from '../config.js';
import { icon, hydrateIcons } from '../icons.js';
import { escapeHtml as esc, toast } from '../site.js';

const $ = (id) => document.getElementById(id);

const LADDER = [
  {
    t: 'Backyard', d: 'Family cookouts, tailgates, the driveway. No pressure, no brackets. This is where most people fall in love with it.',
    need: ['Any board set', 'Somebody to play'],
  },
  {
    t: 'Bar and social leagues', d: 'A weekly night at a bar, brewery or rec center. Usually 6 to 10 weeks, often blind draw so you meet people fast.',
    need: ['Level Up Certified', 'Your own bags', 'Show up on time'],
  },
  {
    t: 'Local tournaments', d: 'Saturday events with real brackets. Many run ACL points nights, and directors usually run them through Scoreholio.',
    need: ['Level Up Certified', 'ACL stamped bags', 'An app account'],
  },
  {
    t: 'State and regional', d: 'Your local points roll up into state and regional standings. Bigger fields, better players, longer days.',
    need: ['ACL membership', 'PRO or COMP bags', 'A travel bag'],
  },
  {
    t: 'Opens, Pro and Worlds', d: 'National Opens draw players from everywhere, top ranked players earn Pro eligibility, and the season builds to the ACL World Championship. Pro and Worlds action streams on ESPN platforms.',
    need: ['Ranked play', 'Pro level membership', 'A lot of reps'],
  },
];

$('ladder').innerHTML = LADDER.map((l, i) => `
  <li>
    <span class="lv">${String(i + 1).padStart(2, '0')}</span>
    <div class="lv-body">
      <h3>${esc(l.t)}</h3>
      <p class="text-2">${esc(l.d)}</p>
      <div class="need">${l.need.map((n) => `<span class="badge muted">${esc(n)}</span>`).join('')}</div>
    </div>
  </li>`).join('');

const BRING = ['Your bags, clean and dry', 'Your Level Up player card', 'The apps your league uses', 'Entry fee or a payment app', 'Water', 'A towel', 'Flat, stable shoes'];
$('bringList').innerHTML = BRING.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('');

$('findForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const city = $('city').value.trim();
  if (!city) { toast('Type a city or zip first.', 'info'); return; }
  $('findResult').innerHTML = `
    <div class="card mt-16">
      <span class="badge muted">${icon('mapPin')} ${esc(city)}</span>
      <h3 class="card-title mt-12">No partner leagues here yet</h3>
      <p class="card-text">Level Up Certified leagues are signing up right now. Tell us where you play and we'll let you know the second one opens near you. In the meantime, the ACL event finder and Scoreholio both list games in most areas.</p>
      <div class="row wrap-row mt-12">
        <a class="btn btn-primary btn-sm" href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Certified league near ' + city)}&body=${encodeURIComponent('I play around ' + city + ' and want to know when a Level Up Certified league opens near me.')}">Tell me when one opens</a>
        <a class="btn btn-ghost btn-sm" href="https://www.iplaycornhole.com/events" target="_blank" rel="noopener">Search ACL events</a>
      </div>
    </div>`;
  hydrateIcons($('findResult'));
});

hydrateIcons(document);
