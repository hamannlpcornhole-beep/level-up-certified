// Course outline shared by the home page and the course app.
export const MODULES = [
  { id: 'welcome', n: 0, title: 'Welcome', short: 'What certification means and how this works.', min: 2, icon: 'sparkles', xp: 50,
    video: { slot: 'V00', title: 'Why Level Up Certified exists', film: 'You on camera. Why this exists, what players get, and why leagues want it. 60 to 90 seconds.' } },
  { id: 'court', n: 1, title: 'The Court', short: 'Board specs, the 27 foot distance, the pitcher\'s box and foul line.', min: 3, icon: 'ruler', xp: 100,
    video: { slot: 'V01', title: 'Set up a regulation court', film: 'Walk the court with a tape measure. Board size, hole, heights, 27 feet, pitcher\'s box.' } },
  { id: 'game', n: 2, title: 'How a Game Works', short: 'Singles and doubles, rounds, who throws first, playing to 21.', min: 4, icon: 'users', xp: 100,
    video: { slot: 'V02', title: 'One full round, start to finish', film: 'Film a doubles round with voiceover. Who throws, when, and how the score gets called.' } },
  { id: 'scoring', n: 3, title: 'Scoring', short: '3 in the hole, 1 on the board, and cancellation scoring.', min: 4, icon: 'target', xp: 100,
    video: { slot: 'V03', title: 'Call the score', film: 'Five real board layouts. Pause, call the score, then show the answer.' } },
  { id: 'rules', n: 4, title: 'Official Rules', short: 'Foot fouls, the pitch clock, dead bags and disputes.', min: 5, icon: 'clipboard', xp: 100,
    video: { slot: 'V04', title: 'Fouls you need to know', film: 'Act out each foul. Foot over the line, bag hits the ground, too slow to pitch, wrong box.' } },
  { id: 'etiquette', n: 5, title: 'Etiquette', short: 'How to carry yourself before, during and after a game.', min: 4, icon: 'handshake', xp: 100,
    video: { slot: 'V05', title: 'Do this, not that', film: 'Quick do vs don\'t skits. Standing still, calling your own fouls, handshakes, lane manners.' } },
  { id: 'gear', n: 6, title: 'Gear Guide', short: 'Bags, bag speeds, the ACL Pro stamp, boards and shoes.', min: 4, icon: 'bag', xp: 100,
    video: { slot: 'V06', title: 'Pick your first bags', film: 'Unbox and compare bags. Slick side vs sticky side, speeds, and the Level Up x BG collab.' } },
  { id: 'throw', n: 7, title: 'How to Throw', short: 'Stance, grip, swing, release and follow through.', min: 4, icon: 'flame', xp: 100,
    video: { slot: 'V07', title: 'Your first good throw', film: 'Your Basic Grip, Throw Setup and Mechanics videos already fit here.' } },
  { id: 'apps', n: 8, title: 'Apps & Tech', short: 'The apps leagues use and what PPR means.', min: 2, icon: 'phone', xp: 100,
    video: { slot: 'V08', title: 'Check in like a pro', film: 'Screen record checking in, finding your board and reading your stats.' } },
  { id: 'league-night', n: 9, title: 'Your First League Night', short: 'Formats, check-in, reporting scores and what to bring.', min: 3, icon: 'calendar', xp: 100,
    video: { slot: 'V09', title: 'League night POV', film: 'Follow a player from check-in to the last game. What to expect and what to bring.' } },
  { id: 'pledge', n: 10, title: 'Player Pledge', short: 'The code every certified player plays by.', min: 1, icon: 'shield', xp: 150,
    video: { slot: 'V10', title: 'The pledge', film: 'A Level Up pro reads the pledge. Short and serious.' } },
];

export const TOTAL_MIN = MODULES.reduce((a, m) => a + m.min, 0);
export const CERT_XP = 250;

export const LEVELS = [
  { name: 'Rookie', min: 0 },
  { name: 'Contender', min: 400 },
  { name: 'Competitor', min: 800 },
];

export function levelFor(xp, certified) {
  if (certified) return { name: 'Certified', next: null, pct: 100 };
  let i = 0;
  LEVELS.forEach((l, idx) => { if (xp >= l.min) i = idx; });
  const cur = LEVELS[i];
  const nxt = LEVELS[i + 1];
  const pct = nxt ? Math.round(((xp - cur.min) / (nxt.min - cur.min)) * 100) : 100;
  return { name: cur.name, next: nxt ? nxt.name : 'Certified', nextAt: nxt ? nxt.min : null, pct };
}
