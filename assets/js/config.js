// Level Up Certified: one place for the settings that change.
export const CONFIG = {
  // Demo mode: the $1 checkout is simulated and nothing is charged.
  // Flip to false only after the Shopify side is connected.
  demoMode: true,

  price: 1,
  priceLabel: '$1',
  season: '2026/27',
  certPrefix: 'LU',
  validDays: 365,
  estMinutes: 35,

  shop: 'https://levelupcornhole.shop',
  bgCollabUrl: 'https://levelupcornhole.shop/products/2026-bg-multiple-bag-models-level-up-cornhole-collab-acl-pro-stamped-cornhole-bags-set-of-4-bags',
  findYourProgramUrl: 'https://hamannlpcornhole-beep.github.io/find-your-program/',
  contactEmail: 'hamann@levelupcornhole.shop',

  // ACL partnership line. The agreement runs through May 31, 2027 unless renewed.
  // Set to false to remove the designation everywhere.
  showAclDesignation: true,
  aclDesignation: 'Official Training Program of the American Cornhole League',
  aclRulesUrl: 'https://www.iplaycornhole.com/about/acl-information/rules-regulations',

  // Sample date so the countdown has something to count to in the layout.
  nextDrawing: '2026-10-31T20:00:00-04:00',

  // League codes used in links like /certify/?league=demo
  leagues: {
    demo: { name: 'Demo Cornhole League', city: 'Your City' },
  },

  // Add handles to show icons in the footer.
  social: { instagram: '', tiktok: '', youtube: '', facebook: '' },
};
