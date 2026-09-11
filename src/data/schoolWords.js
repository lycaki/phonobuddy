// Transcribed column-by-column from the family's school reading-record photos,
// supplied 11 September 2026. These lists do not change the provisional ELS order.
const list = (id, label, columns) => ({id, label, words:columns.flatMap(column => column.split(' '))});

export const SCHOOL_WORD_LISTS = [
  list('r1', 'Year R and 1', [
    'I the no put of is to go into pull as his he she buses we me be push was her my you they all',
    'are ball tall when what said so have were out like some come there little one do children love oh their people Mr Mrs your',
    'ask should would could asked house mouse water want very please once any many again who whole where two here sugar friend because',
  ]),
  list('y2', 'Year 2', [
    'door floor poor because find kind mind behind child children wild climb most only both old',
    'cold gold hold told every great break steak pretty beautiful after fast last past father class',
    'grass pass plant path bath hour move prove improve sure sugar eye could should would who',
    'whole any many clothes busy people water again half morning Mr Mrs parents Christmas everybody even',
  ]),
  list('y34', 'Years 3 and 4', [
    'accident actual address answer appear arrive believe bicycle breath breathe build busy business calendar caught centre century certain circle complete consider continue decide describe different difficult',
    'disappear early earth eight eighth enough exercise experience experiment extreme famous favourite February forwards fruit grammar group guard guide heard heart height history imagine increase important',
    'interest island knowledge learn length library material medicine mention minute natural naughty notice occasion occasionally often opposite ordinary particular peculiar perhaps popular position possess possession possible',
    'potatoes pressure probably promise purpose question quarter recent regular reign remember sentence separate special straight strange strength suppose surprise therefore though although thought through various weight woman women',
  ]),
];

export const schoolWordId = word => word.toLowerCase();
export const SCHOOL_WORDS = [...new Map(SCHOOL_WORD_LISTS.flatMap(list => list.words).map(word => [schoolWordId(word), word])).values()];
export const SCHOOL_SPOKEN_WORDS = {I:'I', Mr:'Mister', Mrs:'Missus', minute:'minute'};

export const READING_PROMPTS = {
  before: ['Read the title together. What might this be about?', 'What do you already know about this topic?'],
  during: ['Who is here, and where are they?', 'What has happened so far?', 'What might happen next? What makes you think that?'],
  after: ['Tell it back in your own words.', 'Which part did you like best, and why?', 'How is this like another book you have read?'],
};

export function selectSchoolBatch(words, offset = 0, size = 5) {
  if (!words.length) return [];
  const start = ((offset % words.length) + words.length) % words.length;
  return Array.from({length:Math.min(size, words.length)}, (_, index) => words[(start + index) % words.length]);
}
