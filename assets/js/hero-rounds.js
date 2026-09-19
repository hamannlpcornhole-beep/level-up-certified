// Scripted rounds for the home hero. Every bag is thrown for real through the
// physics in bagsim.js, so pushes, hangers and stacks play out on their own.
//   kind 'slide'  lands on the board and skids.  stop: natural stop point, len: skid length
//                 to: 'hole' aims it through the hole.  push: { bag, extra } drives an earlier bag
//                 toward the hole (len is the run-up, follow: pusher goes in too or stays out).
//                 onto: lands on top of an earlier bag.
//   kind 'air'    airmail, straight in the hole.
//   kind 'short'  comes up short and lands on the mat.
// Board-local feet: x across the board, z along it (+2 front edge, -2 back edge, hole at -1.25).

// release points in world feet, low and to the right of the camera like an over the shoulder
// broadcast shot, so every arc stays clear of the headline
export const FROM = { o: [3.55, 1.75, 8.3], w: [3.25, 1.7, 8.1] };

export const ROUNDS = [
  [
    { t: 'o', kind: 'slide', name: 'Slide', to: 'hole', len: 1.7 },
    { t: 'w', kind: 'slide', name: 'Woodie', stop: [-0.5, -0.35], len: 1.2 },
    { t: 'o', kind: 'slide', name: 'Blocker', stop: [0.03, -0.62], len: 1.1 },
    { t: 'w', kind: 'air', name: 'Airmail' },
    { t: 'o', kind: 'slide', name: 'Push', push: { bag: 2, extra: 1.7, follow: false }, len: 0.9 },
    { t: 'w', kind: 'slide', name: 'Woodie', stop: [0.52, -0.88], len: 0.95 },
    { t: 'o', kind: 'air', name: 'Airmail' },
    { t: 'w', kind: 'short', name: 'Short', land: [0.35, 2.9], len: 0.3 },
  ],
  [
    { t: 'o', kind: 'slide', name: 'Slide', to: 'hole', len: 1.5 },
    { t: 'w', kind: 'slide', name: 'Hanger', stop: [0.02, -0.93], len: 1.3 },
    { t: 'o', kind: 'air', name: 'Airmail' },
    { t: 'w', kind: 'slide', name: 'Push', push: { bag: 1, extra: 3.0, follow: true }, len: 0.8 },
    { t: 'o', kind: 'slide', name: 'Blocker', stop: [0.08, -0.52], len: 1.0 },
    { t: 'w', kind: 'slide', name: 'Stack', onto: 4, off: [0.13, -0.15], speed: 3 },
    { t: 'o', kind: 'slide', name: 'Woodie', stop: [0.5, -0.25], len: 0.8 },
    { t: 'w', kind: 'short', name: 'Short', land: [-0.2, 2.75], len: 0.3 },
  ],
  [
    { t: 'w', kind: 'slide', name: 'Slide', to: 'hole', len: 1.6 },
    { t: 'o', kind: 'slide', name: 'Slide', to: 'hole', len: 1.9 },
    { t: 'w', kind: 'slide', name: 'Hanger', stop: [-0.06, -0.9], len: 1.2 },
    { t: 'o', kind: 'air', name: 'Airmail' },
    { t: 'w', kind: 'air', name: 'Airmail' },
    { t: 'o', kind: 'short', name: 'Short', land: [0.5, 2.8], len: 0.3 },
    { t: 'w', kind: 'slide', name: 'Push', push: { bag: 2, extra: 1.2, follow: false }, len: 1.0 },
    { t: 'o', kind: 'slide', name: 'Woodie', stop: [0.52, -0.38], len: 0.85 },
  ],
];
