// A second set of original shared-reading stories. Keep IDs permanent so that
// reading places remain valid as the library grows.
const story = (id, block, title, focus, sentences, question, answer) => ({
  id: `y1-story-${id}`, block, title, focus: focus.split(' '), sentences, question, answer,
});

export const YEAR1_MORE_STORIES = [
  story('frog-den', 0, 'A Den for a Frog', 'frog splash', [
    'Sam sat by the pond.', 'A frog hid in the grass.', 'Sam put a flat rock by a log.',
    'The rock made a small den.', 'The frog went hop, hop, splash!', 'Sam left the den and went back to Dad.',
  ], 'Did Sam put the frog in the den?', 'No. Sam left the frog to choose where to go.'),
  story('clock-hunt', 0, 'Tick, Tock, Where?', 'clock', [
    'A clock went tick, tock.', 'Ben had a look by the bed.', 'It was not by the bed.',
    'Ben had a look on the shelf.', 'The clock was in a big red hat!', 'Dad got the hat and Ben got the clock.',
  ], 'Where was the clock?', 'In a big red hat on the shelf.'),
  story('ribbon-twist', 0, 'A Twist in the Strip', 'twist', [
    'Sam had a long red strip.', 'Ben had a long green strip.', 'Sam put a twist in his strip.',
    'Ben held it flat at each end.', 'Dad put a clip on it.', 'The red strip hung up with the green strip.',
  ], 'How did Ben help?', 'Ben held the ends of the strip.'),

  story('cloud-ship', 1, 'The Cloud Ship', 'cloud play', [
    'Sam and Dad sat on a hill.', 'A cloud went past the sun.', 'It had a long flat top.',
    '"A ship!" said Sam.', 'They had a cloud game to play.', 'The wind blew and the ship became a fish.',
  ], 'Why did the cloud ship change?', 'The wind changed the shape of the cloud.'),
  story('pie-shop', 1, 'The Mud Pie Shop', 'pie play', [
    'Ben had a shop in the sand.', 'Sam came to play.', 'Ben put mud in a tin.',
    'He tipped out a mud pie.', 'Sam put a leaf on top.', 'The pie was for the game, not for lunch!',
  ], 'Could Sam eat this pie?', 'No. It was made of mud for their pretend shop.'),
  story('dream-boat', 1, 'The Dream Boat', 'dream cloud', [
    'Sam had a dream of a boat.', 'The boat could float on a cloud.', 'Dad had a map and Sam held a flag.',
    'They went past the moon.', 'A bell rang on the boat.', 'Sam woke up and heard the clock by his bed.',
  ], 'What real sound might have been the bell in the dream?', 'The clock by the bed.'),

  story('bird-rescue', 2, 'A Small Rescue', 'bird rescue saw', [
    'Ben saw a toy bird in a bush.', 'It had fallen from his bag.', 'Ben could not reach it.',
    'Dad lifted the branch out of the way.', 'Ben picked up the toy bird.', 'The small rescue was done, and the toy went back in the bag.',
  ], 'Was it a real bird?', 'No. It was a toy bird from Ben\'s bag.'),
  story('blue-flag', 2, 'The Blue Flag', 'blue joy', [
    'Sam made a blue flag for his den.', 'He put a big sun on it.', 'Ben helped him clip it to a stick.',
    'They stood the stick by the den.', 'The blue flag flapped in the wind.', 'Sam felt joy when Dad came to see it.',
  ], 'What was on the blue flag?', 'A big sun.'),
  story('bird-shadow', 2, 'The Bird on the Wall', 'bird saw blue', [
    'Ben saw a bird on a wall.', 'It was next to the blue shed.', 'Ben moved his hand and the bird moved too.',
    'Dad had a look.', 'It was a shadow from Ben\'s hand!', 'Ben made the shadow bird flap its wings.',
  ], 'Why did the bird move when Ben moved his hand?', 'It was the shadow of his hand.'),

  story('wheel-garden', 3, 'A Wheel in the Garden', 'wheel grew few', [
    'Dad had an old wheel in the garden.', 'He put it flat on the soil.', 'Ben put a few plants in the middle.',
    'They gave the plants a drink.', 'The plants grew in the sun.', 'Soon the wheel had a ring of green leaves.',
  ], 'What did they use the old wheel for?', 'They used it as a border around their plants.'),
  story('dolphin-drawing', 3, 'A Dolphin for Dad', 'dolphin few', [
    'Sam drew a dolphin for Dad.', 'He drew a few fish by its tail.', 'Ben drew the sea.',
    'A drop of blue paint fell on the page.', 'Sam made the drop into a splash.', 'Now the dolphin had a big splash to jump through.',
  ], 'How did Sam turn the paint drop into part of the picture?', 'He made it into a splash.'),
  story('toe-sock', 3, 'The Sock and the Toe', 'toe grew', [
    'Ben put on a red sock.', 'His big toe poked out of the end.', 'The hole grew when he pulled the sock.',
    'Ben showed Dad his toe.', 'Dad got a sock with no hole.', 'The old sock became a soft bed for a toy.',
  ], 'What happened to the old sock?', 'It became a bed for a toy.'),

  story('cape-wind', 4, 'The Cape on the Line', 'cape these', [
    'The red cape was wet.', 'Dad hung it on the line.', '"These pegs will keep it safe," said Dad.',
    'A gust of wind made the cape flap.', 'Sam thought it looked like a flag.', 'When the cape was dry, Sam put it in his play box.',
  ], 'What kept the cape on the line?', 'The pegs.'),
  story('valley-echo', 4, 'A Call in the Valley', 'valley', [
    'Ben and Dad went into the valley.', 'Ben called out a long hello.', 'A faint hello came back.',
    'Ben looked around for a friend.', 'Dad said it was an echo.', 'Ben tried a short clap and heard that come back too.',
  ], 'Who called hello back?', 'It was an echo of Ben\'s own voice.'),
  story('haunt-box', 4, 'The Box That Went Boo', 'haunt these cape', [
    'Sam made a puppet with a small cape.', '"These sticks can hold it up," said Ben.', 'They hid the puppet in a box.',
    'In the play, it would haunt a toy shed.', 'Sam lifted the puppet and said boo.', 'Dad laughed when the puppet dropped its tiny hat.',
  ], 'What made Dad laugh?', 'The puppet dropped its tiny hat.'),

  story('city-kite', 5, 'A Kite Above the City', 'city kite walk', [
    'Ben went for a walk in the city park.', 'Dad had a kite in his bag.', 'They found a wide patch of grass away from the trees.',
    'The kite lifted into the air.', 'Ben held the string while Dad stood beside him.', 'They brought it down before they went home.',
  ], 'Why did they choose a wide patch away from trees?', 'So the kite had room and would not get stuck.'),
  story('cube-race', 5, 'The Ice Cube Race', 'ice cube hope', [
    'Sam put an ice cube on each of two dishes.', 'One dish sat in the sun and one stayed in the shade.', '"I hope mine lasts a long time," said Ben.',
    'They watched the ice get smaller.', 'The cube in the sun melted first.', 'They tipped the water into a plant pot.',
  ], 'Which ice cube melted first?', 'The one in the sun.'),
  story('flute-tune', 5, 'The Lost Flute Tune', 'flute hope', [
    'Ben wanted to play a tune on his flute.', 'He could not remember the end.', 'Dad hummed the first bit with him.',
    'Ben tried again, a little at a time.', '"I hope this is it," he said.', 'The last notes came back to him and he played the whole tune.',
  ], 'What helped Ben remember?', 'Dad hummed with him and Ben tried a little at a time.'),

  story('acorn-pot', 6, 'An Acorn in a Pot', 'acorn father he', [
    'Ben found an acorn by a tree.', 'His father had a small pot of soil.', 'He showed Ben how to plant the acorn.',
    'Ben put the pot in a safe spot.', 'They checked the soil each week.', 'Ben knew a tree would take a long time to grow.',
  ], 'Did Ben expect a big tree the next day?', 'No. A tree takes a long time to grow.'),
  story('eight-cups', 6, 'Eight Cups', 'eight they great', [
    'Sam and Dad set out eight cups.', 'They were getting ready for a picnic.', 'Ben counted only seven cups on the mat.',
    'They looked in the bag and under the rug.', 'The last cup was inside another cup.', '"Great!" said Ben, and set all eight in a row.',
  ], 'Why did Ben first count only seven?', 'One cup was hidden inside another.'),
  story('find-note', 6, 'Find the Next Note', 'find by they', [
    'Dad left a note by the bed.', 'It told Sam to find a red box.', 'A note in the box sent him to the shed.',
    'Ben came along to help.', 'They found a last note by a plant pot.', 'It said that a picnic was ready on the grass.',
  ], 'What was waiting at the end of the note trail?', 'A picnic on the grass.'),

  story('chef-school', 7, 'The Chef Visits School', 'chef school head', [
    'A chef came to school with a tall hat on her head.', 'She brought a bowl and a wooden spoon.', 'The class helped name the vegetables for a soup.',
    'Sam chose a carrot and Ben chose a potato.', 'The chef explained how she would cook them.', 'At lunch, the class tried a little of the soup.',
  ], 'What did the class help the chef choose?', 'Vegetables for the soup.'),
  story('music-stop', 7, 'The Music Would Not Go', 'music go was', [
    'It was time for a dance at school.', 'The music would not go.', 'The teacher checked the speaker.',
    'It needed to be charged.', 'While they waited, Ben tapped a beat on a drum.', 'The class danced to his beat instead.',
  ], 'How did the class dance without the speaker?', 'Ben played a beat on a drum.'),
  story('push-pull', 7, 'Push or Pull?', 'push was go', [
    'Sam made a cart from a small box.', 'It was full of toy blocks.', 'He gave it a push, but a block fell out.',
    'Ben tied a string to the front.', 'Sam pulled gently and the cart began to go.', 'They moved the blocks all the way to the den.',
  ], 'What change helped the cart move gently?', 'They tied on a string and pulled it.'),

  story('world-soup', 8, 'Soup from the World', 'world learn soup have', [
    'Dad had a book about food from around the world.', 'Sam wanted to learn about soup.', 'They chose a page with a soup full of beans.',
    'Dad read the recipe and Sam counted the carrots.', 'They made enough to have some for lunch.', 'Sam drew their soup beside a picture of the book.',
  ], 'What did Sam help count?', 'The carrots.'),
  story('gym-bag', 8, 'The Brief Gym Trip', 'brief gym shoulder care', [
    'Ben had a brief trip to the gym after school.', 'His bag slipped from his shoulder.', 'A water bottle rolled towards the door.',
    'Ben took care to stop and pick it up.', 'Dad helped him close the bag.', 'They went into the gym with everything safely inside.',
  ], 'What did they do before going into the gym?', 'They picked up the bottle and closed the bag.'),
  story('pear-catch', 8, 'Catch the Pear?', 'pear catch there', [
    'A ripe pear hung from the tree.', '"There is one for our lunch," said Dad.', 'Sam held a basket underneath.',
    'Dad reached up to pick the pear.', 'Sam was ready to catch it, but Dad placed it in the basket.', 'They carried it in and cut it to share.',
  ], 'Did Dad throw the pear?', 'No. He placed it carefully in the basket.'),

  story('lamb-sign', 9, 'A Sign for the Lamb', 'lamb sign fence', [
    'Ben saw a lamb by a fence.', 'A sign asked visitors to keep the gate shut.', 'Ben checked that the gate had clicked closed.',
    'The lamb stayed in the field with its mother.', 'Dad thanked Ben for checking.', 'They watched the lamb from the path and then walked on.',
  ], 'Why was it important to shut the gate?', 'To keep the lamb and its mother safely in the field.'),
  story('huge-bridge', 9, 'A Huge Bridge at Home', 'huge bridge house knee', [
    'Sam built a huge bridge from boxes in the house.', 'It was almost as high as his knee.', 'He sent a toy truck underneath it.',
    'The top began to wobble.', 'Sam added a wide box at each end.', 'Now the bridge stayed still as the truck went through.',
  ], 'How did Sam make the bridge steadier?', 'He added wide boxes at both ends.'),
  story('wrap-gift', 9, 'Listen to the Gift', 'wrap listen mother', [
    'Ben helped his mother wrap a gift.', 'The box made a little jingling sound.', 'Ben stopped to listen.',
    'His mother said the gift was for Dad\'s music group.', 'Ben guessed that it might be a bell.', 'Dad opened the gift and found a bright tambourine.',
  ], 'What was inside the gift?', 'A tambourine.'),

  story('station-snack', 10, 'The Station Snack', 'station cheese patient', [
    'Sam and Dad waited at the station.', 'Sam had a cheese roll in a paper bag.', 'He was patient while Dad checked the platform number.',
    'Then they sat down to eat.', 'Sam put the empty bag in a bin.', 'When the train arrived, they were ready with their tickets.',
  ], 'How did Sam keep the station tidy?', 'He put the empty bag in a bin.'),
  story('freeze-photo', 10, 'Freeze for the Photo', 'freeze cheer session', [
    'The class finished a painting session.', 'They held up their pictures for a photo.', '"Freeze for a moment," said the teacher.',
    'Ben tried not to giggle as his picture slipped.', 'Sam helped him hold the bottom corner.', 'After the photo, they gave a cheer for all the paintings.',
  ], 'How did Sam help Ben?', 'He held the bottom corner of Ben\'s picture.'),
  story('caught-leaf', 10, 'The Leaf Sam Caught', 'caught patient cheer', [
    'Sam watched a leaf spin down from a tree.', 'He ran to catch it, but it landed by his foot.', 'For the next leaf, Sam was patient.',
    'He stood still and held out both hands.', 'This time he caught it.', 'Dad gave a little cheer and Sam looked at the leaf\'s fine lines.',
  ], 'What did Sam do differently on the second try?', 'He waited still with both hands out.'),

  story('rescue-parade', 11, 'The Rescue Parade', 'rescue wheel bridge blue', [
    'Ben and Sam made a parade of toy rescue trucks.', 'The blue truck had to cross a bridge first.', 'One wheel caught on the edge.',
    'They stopped the parade and checked the road.', 'A small block was in the way.', 'Ben moved it and Sam sent the truck across again.',
    'This time every truck made it to the other side.', 'They drew a sign to mark the end of their parade.',
  ], 'What was stopping the first truck?', 'A small block on the road by the bridge.'),
  story('school-garden', 11, 'The School Garden Day', 'school grew eight joy', [
    'The class planted eight pots in the school garden.', 'Ben put in a seed and Sam added a label.', 'They took turns checking the pots each week.',
    'For a while, all they could see was soil.', 'Then a small green shoot grew in one pot.', 'Soon there were shoots in the other pots too.',
    'The children felt joy when the first leaves opened.', 'They drew the changes in a garden book.',
  ], 'Why did the labels and garden book help?', 'They helped the class remember what they planted and notice changes.'),
  story('picnic-plan', 11, 'A New Picnic Plan', 'cloud pie house music', [
    'Sam helped Dad pack a pie for a picnic.', 'A dark cloud appeared as they reached the gate.', 'Rain began to splash on the path.',
    'They went back into the house and made a new plan.', 'Ben spread a rug on the floor by the window.', 'Dad put on some quiet music and set the lunch on a tray.',
    'They ate their indoor picnic while they watched the rain.', 'Sam said the best bit was being together.',
  ], 'How did the family change their plan?', 'They made an indoor picnic when it began to rain.'),
];
