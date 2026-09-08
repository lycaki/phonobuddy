import { YEAR1_WORDS } from './year1Profile.js';
import { YEAR1_MORE_STORIES } from './year1MoreStories.js';

// Original supplementary stories, not school reading books. Support words are
// derived conservatively from an explicit review bank, never a readiness score.
const REVIEW_WORDS = new Set(`a an and at back bag bat bed bell ben big bit black box bug bump bus but can cap cat chat check chin chip chop clap clock coat cold cup dad damp den did dig dish dog down duck end fed feet fell felt fin fish fit flat fog for fox fresh frog from fun get gift good got green grin had hand hard hat help hen hid hill his hit hop hot hug hut in is it jam jet job jog jump just keep kick kit lap last leg let lid lift log long look lost lot lunch mad man map mat met milk mix mud mum must neck nest net next nod not now off on out pack pan patch pat path peg pen pet pick pig pink pit plan pond pop pot puff quick quack quilt rag rain ramp ran red rest rich ring rip road rock rod roof room round rug run rush sad safe sam sand sat see seed sees set shed shell ship shop shut sick sing sit six skin skip slip smell snap sock soft song soon sound spin splash spot spring stand stick still stop sun swim tag tail tap tell tent ten that them then thick thin thing this tick tight tin tip toad top track train tree trick trip truck trunk tuck turn twist up van vest wait wall way web weep went wet when which win wind wish with wood wool will yam yap yell yes yet zip zoom`.split(/\s+/));

function story(id, block, title, focus, sentences, question, answer) {
  return { id: `y1-story-${id}`, block, title, focus: focus.split(' '), sentences, question, answer };
}

export const YEAR1_STORIES = [
  story('frog-pond', 0, 'A Frog in the Pond', 'frog splash', [
    'A frog sat on a log.', 'A big fish swam past.', 'The frog got wet.',
    'Hop, hop, splash!', 'The frog hid in the pond.', 'Then the frog got back on the log.',
  ], 'Why did the frog get wet?', 'A big fish swam past the log.'),
  story('clock-box', 0, 'The Clock in the Box', 'clock', [
    'Dad had a big box.', 'Sam sat next to Dad.', 'Tick, tock! Tick, tock!',
    'Sam had a look in the box.', 'A red clock sat in the box.', 'Dad put the clock on the shelf.',
  ], 'What was making the sound in the box?', 'The red clock.'),
  story('twist-track', 0, 'A Twist in the Track', 'twist splash', [
    'Ben had a red truck.', 'The truck went up a ramp.', 'The track had a twist.',
    'The truck went off the track.', 'Splash! It fell in the mud.', 'Ben got the truck and put it back.',
  ], 'What happened after the twist?', 'The truck went off the track and fell in the mud.'),

  story('cloud-play', 1, 'A Cloud at Play', 'cloud play', [
    'Sam and Ben went out to play.', 'A cloud hid the sun.', 'The cloud went past the hill.',
    'Sam ran up the hill.', 'The sun lit up the grass.', 'Sam and Ben sat down to rest.',
  ], 'What hid the sun?', 'A cloud.'),
  story('pie-tin', 1, 'The Pie Tin', 'pie', [
    'Dad had a pie in a tin.', 'Sam had a look at the pie.', 'The pie felt hot.',
    'Sam must wait.', 'Dad put the pie on a dish.', 'Then Sam and Dad had a bit of pie.',
  ], 'Why did Sam need to wait?', 'The pie was hot.'),
  story('dream-road', 1, 'A Road in a Dream', 'dream play cloud', [
    'Ben had a dream.', 'In the dream, a road went up to a cloud.', 'Ben had a truck to play with.',
    'The truck went up the road.', 'The cloud went puff!', 'Ben woke up with a grin.',
  ], 'Was the road to the cloud real?', 'No. It was in a dream.'),

  story('blue-bird', 2, 'The Blue Bird', 'blue bird', [
    'A blue bird sat on a shed.', 'Sam put seed in a dish.', 'The bird had a look.',
    'Sam sat still.', 'The blue bird had a bit of seed.', 'Then the bird sang a song.',
  ], 'What did Sam do to help the bird feel safe?', 'Sam sat still.'),
  story('rescue-boat', 2, 'The Rescue Boat', 'rescue saw', [
    'Ben saw a toy boat in the pond.', 'The boat was stuck in thick mud.', 'Dad had a long net.',
    'Ben held the net with Dad.', 'They got the boat back.', 'The rescue was a success!',
  ], 'How did Dad and Ben get the boat back?', 'They used a long net.'),
  story('joy-box', 2, 'A Box of Joy', 'joy blue saw', [
    'Sam saw a blue box on the bed.', 'In the box was a toy truck.', 'Sam felt joy.',
    'Sam took the truck out to play.', 'Ben had a go with the truck.', 'Now Ben felt joy as well.',
  ], 'Why did Ben feel joy too?', 'Sam let Ben have a go with the truck.'),

  story('loose-wheel', 3, 'The Wheel', 'wheel toe', [
    'Ben had a truck with a loose wheel.', 'The wheel fell off.', 'It hit the end of his shoe, by his toe.',
    'Dad had a look at the truck.', 'Dad put the wheel back on.', 'Ben sent the truck up the ramp.',
  ], 'What did Dad fix?', 'The loose wheel on the truck.'),
  story('dolphin', 3, 'A Dolphin at Sea', 'dolphin few', [
    'Sam saw a dolphin from a boat.', 'The dolphin went up, then down.', 'A few fish swam past.',
    'Splash! The dolphin had a jump.', 'Sam sat still in the boat.', 'The dolphin went off with the fish.',
  ], 'What did the dolphin do before it went away?', 'It jumped with a splash.'),
  story('seed-grew', 3, 'The Seed Grew', 'grew few', [
    'Ben put a few seeds in a pot.', 'The pot sat in the sun.', 'Ben kept the soil damp.',
    'A green shoot grew.', 'The shoot grew tall.', 'Ben took the pot to show Dad.',
  ], 'What helped the seeds grow?', 'Sun and damp soil.'),

  story('cape', 4, 'The Red Cape', 'cape these', [
    'Sam had a red cape.', 'These clips kept the cape on.', 'Sam ran past the shed.',
    'The cape got stuck on a peg.', 'Sam stopped and Dad got it off.', 'Sam put the cape in the box for now.',
  ], 'Why did Sam stop running?', 'The cape got stuck on a peg.'),
  story('valley', 4, 'The Valley Path', 'valley', [
    'Ben and Dad went down to the valley.', 'The path went past a pond.', 'A frog sat on a flat rock.',
    'Ben kept to the path.', 'The frog went hop, hop, splash!', 'Ben and Dad sat on a log in the valley.',
  ], 'Where did Ben and Dad rest?', 'On a log in the valley.'),
  story('haunt', 4, 'Who Will Haunt the Shed?', 'haunt cape these', [
    'Sam and Ben put on a play.', 'Sam had a cape and a big hat.', 'These were props for the play.',
    '"I will haunt the shed," said Sam.', 'Ben rang a bell and Sam went boo!', 'Dad had a clap at the end.',
  ], 'Was Sam really a ghost?', 'No. Sam was acting in a play.'),

  story('kite', 5, 'The Kite Walk', 'kite walk hope', [
    'Ben and Dad went for a walk.', 'Ben took a kite.', '"I hope the wind will lift it," said Ben.',
    'The kite went up, up, up.', 'Then the wind dropped.', 'Dad and Ben let the kite rest on the grass.',
  ], 'Why did the kite come down?', 'The wind dropped.'),
  story('ice-cube', 5, 'The Ice Cube', 'ice cube city', [
    'Sam was in a flat in the city.', 'Dad put an ice cube in a cup.', 'Sam felt the cold cup.',
    'The cup sat in the sun.', 'The ice cube got small.', 'Soon the ice was gone and the cup was wet.',
  ], 'What changed while the cup was in the sun?', 'The ice cube melted.'),
  story('flute', 5, 'A Flute in the Park', 'flute hope walk', [
    'Ben took his flute on a walk.', 'Ben sat with Dad in the park.', '"I hope I can play this tune," said Ben.',
    'Ben had a go.', 'A bird sang from a tree.', 'Ben and the bird made a fine band.',
  ], 'Who joined in with Ben?', 'A bird in a tree.'),

  story('eight-acorns', 6, 'Eight Acorns', 'eight acorn father', [
    'Sam went out with his father.', 'An acorn fell by his foot.', 'Sam put the acorn in his hand.',
    'His father found a few more.', 'They had eight in a small bag.', 'They left the bag open to look at them.',
  ], 'How many acorns did they collect?', 'Eight.'),
  story('find-truck', 6, 'Find the Truck', 'find they he by', [
    'Ben could not find his truck.', 'He had a look by the bed.', 'Dad had a look by the shed.',
    'Then they saw a red wheel by a box.', 'They had a look in the box.', 'Ben got his truck back and gave Dad a hug.',
  ], 'What clue helped them find the truck?', 'A red wheel by a box.'),
  story('great-ramp', 6, 'A Great Ramp', 'great they eight', [
    'Sam and Ben had eight blocks.', 'They put the blocks in a long line.', 'They made a ramp at the end.',
    'The blue truck went up the ramp.', 'It landed on a soft mat.', '"That was a great jump," said Ben.',
  ], 'What made a soft landing for the truck?', 'The mat.'),

  story('school-cart', 7, 'The School Cart', 'school push go', [
    'Ben had a job at school.', 'The class had a cart of books.', 'Ben and Sam gave the cart a push.',
    'It would not go past a box.', 'They moved the box out of the way.', 'Now the cart could go to the book shelf.',
  ], 'Why would the cart not move?', 'A box was in the way.'),
  story('chef-hat', 7, 'The Chef Hat', 'chef head was', [
    'Dad was the chef for lunch.', 'His hat was on his head.', 'Sam put a small hat on too.',
    'Dad made soup and Sam set out cups.', 'The soup was hot, so they let it cool.', 'Then the two chefs sat down to eat.',
  ], 'What job did Sam do?', 'Sam set out the cups.'),
  story('music', 7, 'Music at School', 'music school go', [
    'It was time for music at school.', 'Ben had a drum and Sam had a bell.', 'First, Ben had a go.',
    'Then Sam rang the bell.', 'They played softly, then loudly.', 'At the end they stopped at the same time.',
  ], 'Which instrument did Sam play?', 'The bell.'),

  story('soup-pear', 8, 'Soup and a Pear', 'soup pear have there', [
    'Sam had soup for lunch.', 'There was a pear on a dish too.', '"Can I have the pear first?" asked Sam.',
    'Dad cut the pear and they had a bit.', 'Then Sam had the warm soup.', 'There was just an empty dish at the end.',
  ], 'What did Sam eat first?', 'Some pear.'),
  story('gym-catch', 8, 'Catch in the Gym', 'gym catch shoulder care', [
    'Ben went to the gym with his class.', 'Sam had a soft ball.', 'They took care to leave a big gap.',
    'Sam sent the ball up by his shoulder.', 'Ben held out his hands to catch it.', 'Then Ben sent the ball back to Sam.',
  ], 'Why did they leave a big gap?', 'So they had room to throw and catch safely.'),
  story('world-map', 8, 'A Brief Trip', 'brief world learn', [
    'Dad had a map of the world.', 'Sam put a toy boat on the map.', 'They went on a brief trip in their minds.',
    'The boat went past land and out to sea.', 'Sam could learn the names of places with Dad.', 'Then the boat went back to its box for the night.',
  ], 'Did Sam really sail around the world?', 'No. Sam imagined a trip with a toy boat and a map.'),

  story('lamb-bridge', 9, 'The Lamb and the Bridge', 'lamb bridge fence', [
    'A lamb stood by a fence.', 'Its mother was across a small bridge.', 'Sam and Dad kept back on the path.',
    'The lamb had a look at the bridge.', 'Then it went across to its mother.', 'Sam was glad they had not rushed it.',
  ], 'Why did Sam and Dad keep back?', 'To give the lamb space to cross.'),
  story('sign-house', 9, 'The Sign by the House', 'sign house huge listen', [
    'Ben saw a huge sign by a house.', 'The sign said to listen for the bell.', 'Ben and Dad stood by the door.',
    'Ding! They went in to see a puppet show.', 'A puppet in a red cape waved at Ben.', 'Ben clapped at the end of the show.',
  ], 'What told Ben that the show was ready?', 'The bell.'),
  story('knee', 9, 'A Bump on the Knee', 'knee wrap mother', [
    'Sam fell on the grass and bumped his knee.', 'His mother sat with him on a bench.', 'She checked his knee and gave him a hug.',
    'They put a cool cloth on the bump.', 'Then Sam helped wrap the cloth in a bag.', 'After a rest, Sam felt ready to walk home.',
  ], 'How did Sam feel after a rest?', 'Ready to walk home.'),

  story('station', 10, 'At the Station', 'station patient cheese', [
    'Ben and Dad went to the station.', 'The train was not there yet.', 'Ben was patient and sat on a bench.',
    'Dad had a cheese sandwich for him.', 'Then the train came slowly into the station.', 'They let people get off before they got on.',
  ], 'What did Ben do while he waited?', 'He sat patiently and had a cheese sandwich.'),
  story('freeze', 10, 'Freeze and Cheer', 'freeze cheer session', [
    'The class had a music session.', 'They could dance when the music was on.', 'When it stopped, they had to freeze.',
    'Ben stood still with his hands in the air.', 'Sam stood still on one foot.', 'At the end, the class gave a big cheer.',
  ], 'When did the children have to freeze?', 'When the music stopped.'),
  story('caught', 10, 'The Ball Ben Caught', 'caught cheer', [
    'Sam sent a soft ball to Ben.', 'Ben missed it and the ball rolled past.', 'They tried again with a smaller gap.',
    'This time Ben caught the ball.', 'Sam gave a little cheer.', 'Then Ben sent it back and Sam caught it too.',
  ], 'What change helped Ben catch the ball?', 'They made the gap smaller.'),

  story('road-show', 11, 'The Road Show', 'wheel bridge great cheer', [
    'Sam and Ben made a road for their toy trucks.', 'The road had a bridge and a twist.', 'Dad came to watch the first truck go.',
    'A wheel got stuck at the bridge.', 'They moved a block and tried again.', 'The truck went right across and landed on the mat.',
    'Dad gave a cheer.', 'What a great road show!',
  ], 'How did they solve the problem at the bridge?', 'They moved a block and tried again.'),
  story('picnic', 11, 'A Picnic in the Valley', 'valley pie cheese cloud', [
    'Ben and his father went for a walk in the valley.', 'They had a pie, cheese and a pear in a bag.', 'A cloud hid the sun as they sat on a log.',
    'Ben saw a lamb by the fence.', 'The lamb stayed with its mother.', 'Ben and his father ate their lunch and watched from the path.',
    'Then the sun came out again.', 'They packed every bit of rubbish and went home.',
  ], 'How did they leave the valley tidy?', 'They packed every bit of rubbish to take home.'),
  story('school-play', 11, 'The School Play', 'school play cape joy', [
    'Sam had a red cape for the school play.', 'Ben had a hat and a bell.', 'Sam felt shy when it was time to go on.',
    'Ben gave him a grin and rang the bell.', 'Sam took a breath and said his first line.', 'The class listened, then clapped at the end.',
    'Sam felt joy.', 'He put the cape away, ready for another play.',
  ], 'What helped Sam begin?', 'Ben gave him a grin and rang the bell.'),
  ...YEAR1_MORE_STORIES,
];

export function storyWords(story) {
  return [...new Set(story.sentences.join(' ').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [])];
}

export function getStorySupportWords(story) {
  const focus = new Set(YEAR1_WORDS.filter(word => word.block <= story.block).map(word => word.word));
  return storyWords(story).filter(word => !REVIEW_WORDS.has(word) && !focus.has(word)).sort();
}
