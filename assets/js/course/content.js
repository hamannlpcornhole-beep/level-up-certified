// Lesson content for every module. Rules follow the official ACL rulebook
// (2025/26 text, checked September 2026). Copy rule: no em-dashes.
// Section shape: { h, html, widget, callout: { tone, html } }
// Check shape: { q, options, a (index of right answer), why }

export const CONTENT = {
  welcome: {
    intro: 'Welcome to Level Up Certified. This is everything a cornhole player should know, all in one place. Go through each module, tap Got it at the end, and when they\'re all done you tap I\'m Done. That\'s it.',
    sections: [
      { h: 'What certification means', html: '<p>Being Level Up Certified means you know the rules, you know how to carry yourself on the boards, and you know what gear you need. Leagues that require it know you\'re ready to play.</p>' },
      { h: 'How this works', html: '<ol><li>Watch the video at the top of each module.</li><li>Read the short lesson and try the interactive part.</li><li>Answer the quick check for bonus XP.</li><li>Tap <strong>Got it</strong> to finish the module.</li><li>Finish all 11, then tap <strong>I\'m Done</strong> to get your card.</li></ol>' },
      { h: 'What you get', html: '<ul><li>A player card with your own certification ID and QR code.</li><li>Your league can verify you in seconds.</li><li>You\'re entered in Level Up giveaways all year.</li><li>It\'s good for one year. Renew every season.</li></ul>' },
      { h: 'Level up as you go', html: '<p>Every module gives you XP. You start as a <strong>Rookie</strong>. Hit 400 XP and you\'re a <strong>Contender</strong>. Hit 800 and you\'re a <strong>Competitor</strong>. Finish everything and you\'re <strong>Certified</strong>.</p>',
        callout: { tone: 'info', html: 'The rules in this course follow the official ACL rules. Your league might add house rules on top. When in doubt, ask your director.' } },
    ],
    takeaways: ['Finish every module, then tap I\'m Done', 'Certification lasts one year', 'Your card has an ID and QR code leagues can check'],
    checks: [
      { q: 'How long does Level Up Certified last?', options: ['One league season', 'One year', 'Forever'], a: 1, why: 'Certification is good for one year. Renew to stay certified and stay in the giveaways.' },
    ],
  },

  court: {
    intro: 'Before you throw a bag, know the court. Regulation setups are the same everywhere, so once you know this you can set up a legit court anywhere.',
    sections: [
      { h: 'The court, piece by piece', html: '<p>Tap the numbers to see each spec.</p>', widget: 'court' },
      { h: 'The board', html: '<ul><li><strong>Size:</strong> 2 feet wide by 4 feet long.</li><li><strong>Hole:</strong> 6 inches across, centered side to side. The center of the hole is 9 inches from the back edge.</li><li><strong>Height:</strong> the back edge sits 12 inches off the ground. The front edge sits 2.5 to 3.5 inches off the ground.</li><li><strong>Surface:</strong> smooth wood. At least 1/2 inch thick with backing, or 3/4 inch without.</li></ul>' },
      { h: 'The distance', html: '<p>Boards face each other <strong>27 feet apart</strong>, measured front edge to front edge. That\'s the distance at every ACL event. You\'ll see people play closer in the backyard. For league play, it\'s 27 feet.</p>' },
      { h: 'Pitcher\'s box and foul line', html: '<p>Each board has a pitcher\'s box on both sides. Each box is <strong>3 feet wide and 4 feet long</strong>, the same length as the board. That\'s 4 boxes per court.</p><p>The <strong>foul line</strong> is the front edge of the board. It lines up with the front of the pitcher\'s box.</p>',
        callout: { tone: 'orange', html: 'When you let go of the bag, part of one foot has to be in your box and touching the ground. Your foot can\'t touch or cross the foul line until the bag lands.' } },
      { h: 'Playing inside', html: '<p>ACL events need at least <strong>12 feet</strong> of ceiling clearance. A bag that clips the ceiling is a dead bag, so low ceilings wreck games.</p>' },
    ],
    takeaways: ['Board is 2 x 4 feet with a 6 inch hole', '27 feet apart, front edge to front edge', 'Back edge 12 inches up, front edge 2.5 to 3.5 inches', 'Pitcher\'s box is 3 x 4 feet. The foul line is the front of the board'],
    checks: [
      { q: 'How far apart are regulation boards?', options: ['21 feet, back edge to back edge', '27 feet, front edge to front edge', '30 feet, hole to hole'], a: 1, why: '27 feet, measured from the front edge of one board to the front edge of the other.' },
      { q: 'Where is the foul line?', options: ['The front edge of the board', '3 feet in front of the board', 'The back of the pitcher\'s box'], a: 0, why: 'The foul line is the front edge of the board. It lines up with the front of the pitcher\'s box.' },
      { q: 'How big is the hole?', options: ['5 inches', '6 inches', '8 inches'], a: 1, why: 'The hole is 6 inches across, with its center 9 inches from the back edge.' },
    ],
  },

  game: {
    intro: 'Here\'s how a game actually runs, from the coin toss to 21.',
    sections: [
      { h: 'Singles and doubles', html: '<p>In <strong>singles</strong>, both players start at the same board. You take turns pitching, then walk to the other board together and pitch back.</p><p>In <strong>doubles</strong>, partners stand at opposite boards in the same lane. Your partner is straight across from you, never diagonal.</p>', widget: 'lanes' },
      { h: 'What a round is', html: '<p>A <strong>round</strong> is 8 bags. Each side pitches 4 bags, one at a time, taking turns. When all 8 are down, you score the round. Some people call it a frame or an inning. Same thing.</p>', widget: 'round' },
      { h: 'Who throws first', html: '<ul><li><strong>First round:</strong> coin toss or bag flip. The winner picks who throws first.</li><li><strong>After that:</strong> whoever scored last round throws first.</li><li><strong>Nobody scored?</strong> That\'s a wash. The same side keeps throwing first.</li></ul>' },
      { h: 'How you win', html: '<p>First to <strong>21 or more</strong> at the end of a round wins. You don\'t have to hit 21 exactly, there\'s no bust, and you don\'t have to win by 2.</p>',
        callout: { tone: 'info', html: 'Some backyard games use a bust rule. Official rules don\'t. If you\'re not sure what a league plays, ask before the game starts.' } },
      { h: 'Stay in your box', html: '<p>Pitch all your bags from your own pitcher\'s box. Bags thrown from the wrong box are fouls. And yes, ACL rules allow underhand or overhand. Most players throw underhand.</p>' },
    ],
    takeaways: ['A round is 8 bags, 4 per side, taking turns', 'Whoever scored last round throws first', 'First to 21 or more at the end of a round wins. No bust'],
    checks: [
      { q: 'Nobody scored last round. Who throws first now?', options: ['The side that threw second last round', 'The same side that threw first last round', 'Flip a coin again'], a: 1, why: 'On a wash, the side that threw first keeps throwing first.' },
      { q: 'You\'re at 19 and score 4 this round. What happens?', options: ['You bust back to 15', 'You win with 23', 'You stay at 19'], a: 1, why: 'Under official rules, 21 or more at the end of a round wins. No bust.' },
      { q: 'In doubles, where is your partner?', options: ['Next to you in your box', 'At the other board, straight across from you', 'At the other board, diagonal from you'], a: 1, why: 'Partners stand at opposite boards in the same lane, straight across. Never diagonal.' },
    ],
  },

  scoring: {
    intro: 'Scoring is simple once cancellation clicks. This is where new players get lost, so spend a minute here.',
    sections: [
      { h: 'What counts', html: '<div class="pts-grid"><div class="pts"><b>3</b><span>In the hole</span></div><div class="pts"><b>1</b><span>On the board when the round ends. That includes a bag hanging over the hole.</span></div><div class="pts zero"><b>0</b><span>Touching the ground at all. That bag gets pulled.</span></div></div>' },
      { h: 'Cancellation scoring', html: '<p>Only one side scores each round. Add up both sides, then take the smaller number away from the bigger one.</p><p>You have 5, they have 3? <strong>You score 2.</strong> They score nothing. Both have 4? That\'s a <strong>wash</strong> and nobody scores.</p>', widget: 'scorer' },
      { h: 'Tricky calls', html: '<ul><li><strong>Knocked in:</strong> a bag knocked into the hole by another bag counts 3, no matter whose bag did it.</li><li><strong>Hanging over the hole:</strong> still worth 1 until it falls in.</li><li><strong>Hits the ground first:</strong> if a bag touches the ground and then bounces onto the board, it\'s worth 0.</li><li><strong>Hanging off the board onto the ground:</strong> worth 0. Pull it.</li></ul>' },
      { h: 'Call it out loud', html: '<p>Say the score after every round. Something like <em>"5 to 3, we get 2, we\'re at 14."</em> Both sides agree before anybody touches a bag.</p>',
        callout: { tone: 'orange', html: 'Missed a scoring mistake? It can be fixed until the end of the next round. After that, the score is locked.' } },
    ],
    takeaways: ['Hole 3, board 1, ground 0', 'Cancellation: take the smaller score away from the bigger one', 'Agree on the score before you pick up bags'],
    checks: [
      { q: 'You get 2 in the hole and 1 on the board. They get 1 in and 2 on. The result?', options: ['You score 7, they score 5', 'You score 2', 'Wash, nobody scores'], a: 1, why: 'You have 7 and they have 5. Only the difference counts, so you score 2.' },
      { q: 'Your bag gets knocked into the hole by your opponent\'s bag. It\'s worth:', options: ['3 points', '1 point', '0, it was knocked in'], a: 0, why: 'A bag knocked into the hole counts 3, no matter who knocked it in.' },
      { q: 'A bag is on the board but a corner touches the ground. It\'s worth:', options: ['1 point', '0 points', 'Half a point'], a: 1, why: 'Any bag touching the ground is worth 0 and gets pulled.' },
    ],
  },

  rules: {
    intro: 'These are the rules that come up every single league night. Know them and you\'ll never be the one holding up a game.',
    sections: [
      { h: 'Foot fouls', html: '<p>When you let go of the bag, part of one foot has to be inside your pitcher\'s box, touching the ground. Your foot can\'t touch or cross the foul line before the bag lands.</p><p>At ACL events you usually get a warning first. Keep doing it and your fouled bags don\'t count.</p>' },
      { h: 'The pitch clock', html: '<p>You get <strong>15 seconds</strong> to pitch once your opponent\'s bag stops moving. Have your next bag in your hand and be ready.</p>' },
      { h: 'Dead bags', html: '<p>A dead bag is worth 0 and gets pulled off the board. A bag is dead if it:</p><ul><li>Hits the ground before the board.</li><li>Hits a person, the ceiling or anything else before the board.</li><li>Was pitched from the wrong box.</li><li>Was pitched out of turn. Your opponent may throw two in a row to get things back in order.</li></ul>' },
      { h: 'Hands off the bags', html: '<p>Never touch or pick up bags before the round is over and scored. If you do, the round ends right there and the other side gets bonus points.</p>' },
      { h: 'Legal bags', html: '<p>At ACL events, your bags have to be ACL stamped and on the current approved list. Your opponent or the director can ask to check your bags before a match starts.</p>' },
      { h: 'Disputes', html: '<p>Can\'t agree on a call? Don\'t argue. Call an official or the director over. Their call stands, and they\'ll watch the rest of the match.</p>' },
      { h: 'Legal or foul?', html: '<p>Test yourself. Pick legal or foul for each situation.</p>', widget: 'foul' },
    ],
    footer: 'rules',
    takeaways: ['Part of one foot in the box at release. Don\'t cross the foul line', '15 seconds to pitch', 'Ground, ceiling, people, wrong box: dead bag', 'Never touch bags before the round is scored'],
    checks: [
      { q: 'How long do you have to pitch after your opponent\'s bag stops?', options: ['10 seconds', '15 seconds', '30 seconds'], a: 1, why: 'ACL rules give you 15 seconds.' },
      { q: 'Your bag clips the ceiling, then lands on the board. It\'s:', options: ['Worth 1 point', 'A dead bag worth 0', 'A redo'], a: 1, why: 'A bag that hits the ceiling, a person or anything else before the board is a dead bag.' },
      { q: 'You and your opponent disagree on a call. You:', options: ['Flip a coin', 'Replay the round', 'Call an official or the director'], a: 2, why: 'Get an official or the director. Their call stands.' },
    ],
  },

  etiquette: {
    intro: 'Rules keep the game fair. Etiquette keeps people wanting to play with you. This is the stuff nobody writes down, so we did.',
    sections: [
      { h: 'Before the game', html: '<ul><li>Show up on time and check in with the director.</li><li>Introduce yourself. Shake hands or fist bump.</li><li>Settle who throws first with a coin toss or bag flip.</li><li>If your opponent asks to see your bags, let them.</li></ul>' },
      { h: 'While they throw', html: '<ul><li>Stand still and stay quiet.</li><li>Stay behind or beside your box, out of their line of sight.</li><li>No trash talk, no coaching them, no jingling your bags.</li><li>Don\'t walk across other lanes while people are throwing. Wait for the round to end.</li></ul>' },
      { h: 'During the game', html: '<ul><li>Call your own foot fouls. Seriously.</li><li>Call the score out loud after every round.</li><li>Hands off the bags until the score is agreed.</li><li>Keep drinks and phones off the boards and out of the boxes.</li><li>Tell people nice shot. Even your opponent.</li></ul>' },
      { h: 'When things go wrong', html: '<ul><li>Missed a shot? Reset. Don\'t slam bags, kick boards or cuss.</li><li>Disagree on a call? Get the director. Don\'t argue.</li><li>Respect officials. Their call stands.</li></ul>',
        callout: { tone: 'info', html: 'Leagues can penalize bad conduct. Under ACL rules it can go from a warning all the way to losing bags, rounds or whole matches.' } },
      { h: 'After the game', html: '<ul><li>Shake hands, win or lose.</li><li>Report the score right away. Usually the winner reports.</li><li>Grab your bags, straighten the boards and clean up your spot.</li><li>Help the next new player. Everybody started somewhere.</li></ul>' },
      { h: 'What would you do?', html: '<p>Real situations from league night. Pick the move a certified player makes.</p>', widget: 'etiquette' },
    ],
    takeaways: ['Still and quiet when they throw', 'Call your own fouls and the score', 'Hands off the bags until the score is agreed', 'Win or lose, shake hands and clean up'],
    checks: [
      { q: 'Your foot touched the foul line and nobody saw. You:', options: ['Keep quiet, nobody saw', 'Call it on yourself', 'Ask your partner'], a: 1, why: 'Certified players call their own fouls. That\'s the whole point.' },
      { q: 'Your opponent is about to throw. You should be:', options: ['Right by the board watching', 'Still and quiet, behind or beside your box', 'Walking to grab a drink'], a: 1, why: 'Stay still, quiet and out of their line of sight.' },
    ],
  },

  gear: {
    intro: 'You don\'t need to spend a ton to start. But the right bags make learning way easier. Here\'s what actually matters.',
    sections: [
      { h: 'Bags 101', html: '<p>Tap through the parts of a legal bag.</p>', widget: 'bag' },
      { h: 'Two sides, two speeds', html: '<p>Most league bags have two different sides. A <strong>slick side</strong> that slides more, and a <strong>sticky side</strong> that stops faster. Each company rates speed on its own scale, usually 1 to 10. A middle speed bag you can both slide and stop is an easy place to start.</p>' },
      { h: 'The ACL stamp', html: '<p>ACL approved bags get stamped with a level: <strong>PRO, COMP, REC or MINI</strong>. For ACL events your bags have to be on the current approved list, and stamps from before 2023 don\'t count anymore. Pro division players have to use PRO stamped bags. All 4 bags in your set have to match.</p>' },
      { h: 'Boards', html: '<p>Regulation boards are 2 by 4 feet of smooth wood, built to the specs from the court module. For practice, get the most regulation board you can. A board that plays different than league boards builds habits you\'ll have to break later.</p>' },
      { h: 'Shoes and the rest', html: '<ul><li>Flat, stable shoes you can plant in. Skip the sandals on league night.</li><li>A bag tote so your bags stay clean and dry.</li><li>A towel. Dusty or wet bags play different.</li></ul>', widget: 'collab' },
    ],
    takeaways: ['6 x 6 inches, 15.5 to 16.5 oz, resin filled', 'Slick side slides, sticky side stops', 'ACL events need bags on the current approved list'],
    checks: [
      { q: 'Which ACL stamp do Pro division players need?', options: ['REC', 'COMP', 'PRO'], a: 2, why: 'Pro division players have to throw PRO stamped bags.' },
      { q: 'What\'s inside a league bag?', options: ['Corn', 'Plastic resin', 'Sand'], a: 1, why: 'League bags use plastic resin so they play the same every time.' },
    ],
  },

  throw: {
    intro: 'Everybody\'s throw looks a little different. But good throws share the same basics. Nail these and you\'ll get better fast.',
    sections: [
      { h: 'Five parts of a throw', html: '<p>Work through each step. Check the box when you\'ve got it.</p>', widget: 'throw' },
      { h: 'The shots', html: '<ul><li><strong>Slide:</strong> land it on the board and slide it into the hole. Your bread and butter.</li><li><strong>Airmail:</strong> straight into the hole without touching the board. Great for getting over bags in the way.</li><li><strong>Blocker:</strong> a bag you leave in front of the hole to make your opponent\'s slide harder.</li><li><strong>Push:</strong> slide a bag into a bag sitting in front of the hole and push it in.</li><li><strong>Roll:</strong> the bag flips over a blocker instead of sliding into it.</li></ul><p>Cuts and rolls take practice. The Level Up training center has drills for all of them.</p>' },
      { h: 'Practice the right way', html: '<ul><li>Throw with a purpose. Pick a spot on the board for every bag.</li><li>Track your PPR so you know you\'re improving.</li><li>Film yourself. You\'ll see problems you can\'t feel.</li></ul>', widget: 'training' },
    ],
    takeaways: ['Use the same stance every throw', 'Smooth pendulum swing, flat release, a little spin', 'Follow through at your target'],
    checks: [
      { q: 'Which shot lands on the board and slides into the hole?', options: ['Airmail', 'Slide', 'Blocker'], a: 1, why: 'That\'s a slide, the most common scoring shot.' },
      { q: 'Why put a little spin on the bag?', options: ['It looks cool', 'It keeps the bag flat and predictable', 'It makes it go farther'], a: 1, why: 'A little spin keeps the bag flat in the air so it lands the same way every time.' },
    ],
  },

  apps: {
    intro: 'Most leagues and tournaments run on apps now. Get these on your phone before your first night.',
    sections: [
      { h: 'Download these two', html: '', widget: 'apps' },
      { h: 'What PPR means', html: '<p><strong>PPR</strong> is points per round. It\'s the average points you put up each round, counting every bag before cancellation. It\'s the number players use to size each other up. The ACL also tracks <strong>DPR</strong> and uses both in its CPI player rating.</p>', widget: 'ppr' },
    ],
    takeaways: ['Get The Cornhole App and Scoreholio', 'PPR means points per round', 'Track your PPR to see yourself improve'],
    checks: [
      { q: 'You put up 60 points over 10 rounds. Your PPR is:', options: ['6', '10', '60'], a: 0, why: '60 points divided by 10 rounds is a 6 PPR.' },
    ],
  },

  'league-night': {
    intro: 'Your first league night doesn\'t have to be nerve racking. Here\'s exactly what to expect.',
    sections: [
      { h: 'Common formats', html: '', widget: 'formats' },
      { h: 'How the night goes', html: '<ol><li>Get there early and check in with the director or in the app.</li><li>Pay your entry if there is one.</li><li>Warm up when boards are open. Never throw on a board that\'s in a game.</li><li>Wait for your board to get called, then head over.</li><li>Play your game. Call the score every round.</li><li>Report your score right away. Usually the winner reports.</li><li>Stick around. Your next game might be right after.</li></ol>' },
      { h: 'Divisions and skill levels', html: '<p>Lots of leagues split players by skill so everybody gets good games. Be honest about your level. Playing down to beat weaker players is called <strong>sandbagging</strong>, and nobody likes a sandbagger.</p>' },
      { h: 'Game day checklist', html: '<p>Check it off before you leave the house.</p>', widget: 'checklist' },
    ],
    takeaways: ['Check in early', 'Know the format before you start', 'Report your score right away', 'Be honest about your skill level'],
    checks: [
      { q: 'In a blind draw you:', options: ['Bring your own partner', 'Get paired with a random partner', 'Only play singles'], a: 1, why: 'Blind draw means you sign up solo and get a random partner.' },
      { q: 'Who usually reports the score?', options: ['The winner', 'The loser', 'Whoever wants to'], a: 0, why: 'Most leagues have the winner report. Either way, do it right away.' },
    ],
  },

  pledge: {
    intro: 'Last one. This is the code every Level Up Certified player plays by. Check each line and sign your name.',
    sections: [
      { h: 'The Player Pledge', html: '', widget: 'pledge' },
    ],
    requires: 'pledge',
    takeaways: [],
    checks: [],
  },
};

export const PLEDGE = [
  'I know the rules and I play by them.',
  'I call my own fouls, even when nobody\'s watching.',
  'I stay still and quiet when my opponent throws.',
  'I call the score honestly and agree before touching bags.',
  'I respect directors, officials and their calls.',
  'I win with class and I lose with class.',
  'I\'m honest about my skill level. No sandbagging.',
  'I help new players feel welcome.',
];
