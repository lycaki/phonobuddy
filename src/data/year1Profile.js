// Sound Blocks / PhonoBuddy Year 1 working profile.
//
// This aligns to the publicly visible ELS sequence without copying ELS lesson
// scripts, mnemonics, characters, or book text. The practice words below are a
// small, independently authored and reviewed family supplement.

export const YEAR1_PROFILE = {
  id: 'els-copnor-provisional-2026',
  programmeId: 'essential-letters-and-sounds',
  programmeVersion: 'public-year-1-sequence-2026',
  schoolId: 'copnor-primary',
  label: 'Copnor / ELS (provisional)',
  status: 'provisional',
  reviewedDate: '2026-07-25',
  academicYear: '2026-2027',
  schoolConfirmationDue: '2026-09',
  sources: [
    {
      label: 'Copnor Primary Year 1',
      url: 'https://copnorprimary.co.uk/year-1/',
    },
    {
      label: 'Copnor ELS programme letter',
      url: 'https://copnorprimary.co.uk/wp-content/uploads/2022/11/ELS-books-online-letter.pdf',
    },
    {
      label: 'Public Year 1 ELS week-by-week progression',
      url: 'https://www.gothicmede.org.uk/attachments/download.asp?file=2065&type=pdf',
    },
    {
      label: 'ELS optional Year 1 consolidation guidance',
      url: 'https://cdn.oxfordowl.co.uk/2022/06/22/09/21/32/91c4527f-89c9-4179-842e-6a80a58b9fcd/ELS_Y1_ConsolidatingLearning.pdf',
    },
  ],
};

export const YEAR1_BLOCKS = [
  { id: 0, term: 'Autumn 1', label: 'Launch pad', shortLabel: 'Review', detail: 'Assess and review the Phase 2-4 code.' },
  { id: 1, term: 'Autumn 1', label: 'New vowel teams A', shortLabel: 'ay ou ie ea', detail: 'New spellings in reviewed word context.' },
  { id: 2, term: 'Autumn 1', label: 'New vowel teams B', shortLabel: 'oy ir ue aw', detail: 'Continue the new Phase 5 spellings.' },
  { id: 3, term: 'Autumn 1', label: 'Consonant teams', shortLabel: 'wh ph ew oe', detail: 'Word-context practice and review.' },
  { id: 4, term: 'Autumn 2', label: 'Split digraph lab', shortLabel: 'au ey a-e e-e', detail: 'Build and transform split-digraph words.' },
  { id: 5, term: 'Autumn 2', label: 'Split digraph lab 2', shortLabel: 'i-e o-e u-e c y al', detail: 'More split digraphs and alternative spellings.' },
  { id: 6, term: 'Spring 1', label: 'Same sound, new spelling', shortLabel: 'Alternative vowels', detail: 'Compare spellings of sounds Logan already knows.' },
  { id: 7, term: 'Spring 1', label: 'Word detectives', shortLabel: 'Alternative pronunciations', detail: 'Use the whole word to choose the reviewed mapping.' },
  { id: 8, term: 'Spring 1', label: 'Code collectors', shortLabel: 'Complex spellings', detail: 'Less common but useful Year 1 mappings.' },
  { id: 9, term: 'Spring 2', label: 'Silent-letter caves', shortLabel: 'gn kn wr mb', detail: 'Notice letters that work together in longer words.' },
  { id: 10, term: 'Spring 2', label: 'Word endings workshop', shortLabel: 'Suffix patterns', detail: 'Read longer words without guessing from pictures.' },
  { id: 11, term: 'Summer', label: 'Screening trail', shortLabel: 'Review and apply', detail: 'Mixed real and reviewed pseudo-words.' },
];

const mapping = (id, grapheme, soundIds, block, example, options = {}) => ({
  id,
  grapheme,
  soundIds,
  block,
  example,
  acceptedPronunciations: [soundIds],
  ...options,
});

// A block is one reviewed grapheme-to-phoneme mapping. It may emit more than
// one phoneme (for example u -> /y/ + /oo/).
export const YEAR1_GPCS = [
  mapping('ay_ai', 'ay', ['ai'], 1, 'play'),
  mapping('ou_ow', 'ou', ['ow'], 1, 'cloud'),
  mapping('ie_igh', 'ie', ['igh'], 1, 'pie'),
  mapping('ea_ee', 'ea', ['ee'], 1, 'dream'),
  mapping('oy_oi', 'oy', ['oi'], 2, 'joy'),
  mapping('ir_ur', 'ir', ['ur'], 2, 'bird'),
  mapping('ue_oo', 'ue', ['oo_long'], 2, 'blue'),
  mapping('ue_yoo', 'ue', ['y', 'oo_long'], 2, 'rescue'),
  mapping('aw_or', 'aw', ['or'], 2, 'saw'),
  mapping('wh_w', 'wh', ['w'], 3, 'wheel'),
  mapping('ph_f', 'ph', ['f'], 3, 'dolphin'),
  mapping('ew_oo', 'ew', ['oo_long'], 3, 'grew'),
  mapping('ew_yoo', 'ew', ['y', 'oo_long'], 3, 'few'),
  mapping('oe_oa', 'oe', ['oa'], 3, 'toe'),
  mapping('au_or', 'au', ['or'], 4, 'haunt'),
  mapping('ey_ee', 'ey', ['ee'], 4, 'valley'),
  mapping('a_e_ai', 'a-e', ['ai'], 4, 'cake', { split: true }),
  mapping('e_e_ee', 'e-e', ['ee'], 4, 'these', { split: true }),
  mapping('i_e_igh', 'i-e', ['igh'], 5, 'kite', { split: true }),
  mapping('o_e_oa', 'o-e', ['oa'], 5, 'home', { split: true }),
  mapping('u_e_oo', 'u-e', ['oo_long'], 5, 'flute', { split: true }),
  mapping('u_e_yoo', 'u-e', ['y', 'oo_long'], 5, 'cube', { split: true }),
  mapping('c_s', 'c', ['s'], 5, 'ice'),
  mapping('y_ee', 'y', ['ee'], 5, 'city'),
  mapping('al_or', 'al', ['or'], 5, 'walk'),
  mapping('a_ai', 'a', ['ai'], 6, 'acorn'),
  mapping('ey_ai', 'ey', ['ai'], 6, 'they'),
  mapping('ea_ai', 'ea', ['ai'], 6, 'great'),
  mapping('eigh_ai', 'eigh', ['ai'], 6, 'eight'),
  mapping('a_ar', 'a', ['ar'], 6, 'father'),
  mapping('e_ee', 'e', ['ee'], 6, 'he'),
  mapping('i_igh', 'i', ['igh'], 6, 'find'),
  mapping('y_igh', 'y', ['igh'], 6, 'by'),
  mapping('o_oa', 'o', ['oa'], 7, 'go'),
  mapping('a_o', 'a', ['o'], 7, 'was'),
  mapping('u_oo', 'u', ['oo_short'], 7, 'push'),
  mapping('u_yoo', 'u', ['y', 'oo_long'], 7, 'music'),
  mapping('ch_k', 'ch', ['c'], 7, 'school'),
  mapping('ch_sh', 'ch', ['sh'], 7, 'chef'),
  mapping('ea_e', 'ea', ['e'], 7, 'head'),
  mapping('or_ur', 'or', ['ur'], 8, 'world'),
  mapping('ear_ur', 'ear', ['ur'], 8, 'learn'),
  mapping('ou_oo', 'ou', ['oo_long'], 8, 'soup'),
  mapping('ou_oa', 'ou', ['oa'], 8, 'shoulder'),
  mapping('ie_ee', 'ie', ['ee'], 8, 'brief'),
  mapping('ve_v', 've', ['v'], 8, 'have'),
  mapping('g_j', 'g', ['j'], 8, 'gym'),
  mapping('are_air', 'are', ['air'], 8, 'care'),
  mapping('ere_air', 'ere', ['air'], 8, 'there'),
  mapping('ear_air', 'ear', ['air'], 8, 'pear'),
  mapping('tch_ch', 'tch', ['ch'], 8, 'catch'),
  mapping('o_u', 'o', ['u'], 9, 'mother'),
  mapping('ge_j', 'ge', ['j'], 9, 'huge'),
  mapping('dge_j', 'dge', ['j'], 9, 'bridge'),
  mapping('st_s', 'st', ['s'], 9, 'listen'),
  mapping('ce_s', 'ce', ['s'], 9, 'fence'),
  mapping('se_s', 'se', ['s'], 9, 'house'),
  mapping('gn_n', 'gn', ['n'], 9, 'sign'),
  mapping('kn_n', 'kn', ['n'], 9, 'knee'),
  mapping('wr_r', 'wr', ['r'], 9, 'wrap'),
  mapping('mb_m', 'mb', ['m'], 9, 'lamb'),
  mapping('se_z', 'se', ['z'], 10, 'cheese'),
  mapping('ze_z', 'ze', ['z'], 10, 'freeze'),
  mapping('eer_ear', 'eer', ['ear'], 10, 'cheer'),
  mapping('ti_sh', 'ti', ['sh'], 10, 'patient'),
  mapping('tion_shun', 'tion', ['sh', 'schwa', 'n'], 10, 'station'),
  mapping('ssi_sh', 'ssi', ['sh'], 10, 'session'),
  mapping('cious_sh', 'cious', ['sh', 'schwa', 's'], 10, 'delicious'),
  mapping('augh_or', 'augh', ['or'], 10, 'caught'),
];

export const YEAR1_GPC_BY_ID = Object.fromEntries(YEAR1_GPCS.map(gpc => [gpc.id, gpc]));

const part = (text, soundIds, mappingId = null) => ({ text, soundIds, mappingId });
const focus = (mappingId) => ({ mappingId });

// The written word is always presented before any semantic reveal. The parts
// are in spoken order; split mappings use a joined a-e/i-e/o-e/u-e sound block.
export const YEAR1_WORDS = [
  { id: 'frog', word: 'frog', block: 0, parts: [part('f', ['f']), part('r', ['r']), part('o', ['o']), part('g', ['g'])] },
  { id: 'clock', word: 'clock', block: 0, parts: [part('c', ['c']), part('l', ['l']), part('o', ['o']), part('ck', ['ck'])] },
  { id: 'splash', word: 'splash', block: 0, parts: [part('s', ['s']), part('p', ['p']), part('l', ['l']), part('a', ['a']), part('sh', ['sh'])] },
  { id: 'twist', word: 'twist', block: 0, parts: [part('t', ['t']), part('w', ['w']), part('i', ['i']), part('s', ['s']), part('t', ['t'])] },
  { id: 'play', word: 'play', block: 1, parts: [part('p', ['p']), part('l', ['l']), part('ay', ['ai'], 'ay_ai')], ...focus('ay_ai') },
  { id: 'cloud', word: 'cloud', block: 1, parts: [part('c', ['c']), part('l', ['l']), part('ou', ['ow'], 'ou_ow'), part('d', ['d'])], ...focus('ou_ow') },
  { id: 'pie', word: 'pie', block: 1, parts: [part('p', ['p']), part('ie', ['igh'], 'ie_igh')], ...focus('ie_igh') },
  { id: 'dream', word: 'dream', block: 1, parts: [part('d', ['d']), part('r', ['r']), part('ea', ['ee'], 'ea_ee'), part('m', ['m'])], ...focus('ea_ee') },
  { id: 'joy', word: 'joy', block: 2, parts: [part('j', ['j']), part('oy', ['oi'], 'oy_oi')], ...focus('oy_oi') },
  { id: 'bird', word: 'bird', block: 2, parts: [part('b', ['b']), part('ir', ['ur'], 'ir_ur'), part('d', ['d'])], ...focus('ir_ur') },
  { id: 'blue', word: 'blue', block: 2, parts: [part('b', ['b']), part('l', ['l']), part('ue', ['oo_long'], 'ue_oo')], ...focus('ue_oo') },
  { id: 'rescue', word: 'rescue', block: 2, parts: [part('r', ['r']), part('e', ['e']), part('s', ['s']), part('c', ['c']), part('ue', ['y', 'oo_long'], 'ue_yoo')], ...focus('ue_yoo') },
  { id: 'saw', word: 'saw', block: 2, parts: [part('s', ['s']), part('aw', ['or'], 'aw_or')], ...focus('aw_or') },
  { id: 'wheel', word: 'wheel', block: 3, parts: [part('wh', ['w'], 'wh_w'), part('ee', ['ee']), part('l', ['l'])], ...focus('wh_w') },
  { id: 'dolphin', word: 'dolphin', block: 3, parts: [part('d', ['d']), part('o', ['o']), part('l', ['l']), part('ph', ['f'], 'ph_f'), part('i', ['i']), part('n', ['n'])], ...focus('ph_f') },
  { id: 'grew', word: 'grew', block: 3, parts: [part('g', ['g']), part('r', ['r']), part('ew', ['oo_long'], 'ew_oo')], ...focus('ew_oo') },
  { id: 'few', word: 'few', block: 3, parts: [part('f', ['f']), part('ew', ['y', 'oo_long'], 'ew_yoo')], ...focus('ew_yoo') },
  { id: 'toe', word: 'toe', block: 3, parts: [part('t', ['t']), part('oe', ['oa'], 'oe_oa')], ...focus('oe_oa') },
  { id: 'haunt', word: 'haunt', block: 4, parts: [part('h', ['h']), part('au', ['or'], 'au_or'), part('n', ['n']), part('t', ['t'])], ...focus('au_or') },
  { id: 'valley', word: 'valley', block: 4, parts: [part('v', ['v']), part('a', ['a']), part('ll', ['ll']), part('ey', ['ee'], 'ey_ee')], ...focus('ey_ee') },
  { id: 'cape', word: 'cape', block: 4, baseWord: 'cap', parts: [part('c', ['c']), part('a-e', ['ai'], 'a_e_ai'), part('p', ['p'])], ...focus('a_e_ai'), mission: 'transform' },
  { id: 'these', word: 'these', block: 4, parts: [part('th', ['th_voiced']), part('e-e', ['ee'], 'e_e_ee'), part('s', ['z'])], ...focus('e_e_ee') },
  { id: 'kite', word: 'kite', block: 5, baseWord: 'kit', parts: [part('k', ['c']), part('i-e', ['igh'], 'i_e_igh'), part('t', ['t'])], ...focus('i_e_igh'), mission: 'transform' },
  { id: 'hope', word: 'hope', block: 5, baseWord: 'hop', parts: [part('h', ['h']), part('o-e', ['oa'], 'o_e_oa'), part('p', ['p'])], ...focus('o_e_oa'), mission: 'transform' },
  { id: 'flute', word: 'flute', block: 5, parts: [part('f', ['f']), part('l', ['l']), part('u-e', ['oo_long'], 'u_e_oo'), part('t', ['t'])], ...focus('u_e_oo') },
  { id: 'cube', word: 'cube', block: 5, baseWord: 'cub', parts: [part('c', ['c']), part('u-e', ['y', 'oo_long'], 'u_e_yoo'), part('b', ['b'])], ...focus('u_e_yoo'), mission: 'transform' },
  { id: 'ice', word: 'ice', block: 5, parts: [part('i', ['igh']), part('ce', ['s'], 'c_s')], ...focus('c_s') },
  { id: 'city', word: 'city', block: 5, parts: [part('c', ['s']), part('i', ['i']), part('t', ['t']), part('y', ['ee'], 'y_ee')], ...focus('y_ee') },
  { id: 'walk', word: 'walk', block: 5, parts: [part('w', ['w']), part('al', ['or'], 'al_or'), part('k', ['c'])], ...focus('al_or') },
  { id: 'acorn', word: 'acorn', block: 6, parts: [part('a', ['ai'], 'a_ai'), part('c', ['c']), part('or', ['or']), part('n', ['n'])], ...focus('a_ai') },
  { id: 'they', word: 'they', block: 6, parts: [part('th', ['th_voiced']), part('ey', ['ai'], 'ey_ai')], ...focus('ey_ai') },
  { id: 'great', word: 'great', block: 6, parts: [part('g', ['g']), part('r', ['r']), part('ea', ['ai'], 'ea_ai'), part('t', ['t'])], ...focus('ea_ai') },
  { id: 'eight', word: 'eight', block: 6, parts: [part('eigh', ['ai'], 'eigh_ai'), part('t', ['t'])], ...focus('eigh_ai') },
  { id: 'father', word: 'father', block: 6, parts: [part('f', ['f']), part('a', ['ar'], 'a_ar'), part('th', ['th_voiced']), part('er', ['schwa'])], ...focus('a_ar') },
  { id: 'he', word: 'he', block: 6, parts: [part('h', ['h']), part('e', ['ee'], 'e_ee')], ...focus('e_ee') },
  { id: 'find', word: 'find', block: 6, parts: [part('f', ['f']), part('i', ['igh'], 'i_igh'), part('n', ['n']), part('d', ['d'])], ...focus('i_igh') },
  { id: 'by', word: 'by', block: 6, parts: [part('b', ['b']), part('y', ['igh'], 'y_igh')], ...focus('y_igh') },
  { id: 'go', word: 'go', block: 7, parts: [part('g', ['g']), part('o', ['oa'], 'o_oa')], ...focus('o_oa') },
  { id: 'was', word: 'was', block: 7, parts: [part('w', ['w']), part('a', ['o'], 'a_o'), part('s', ['z'])], ...focus('a_o') },
  { id: 'push', word: 'push', block: 7, parts: [part('p', ['p']), part('u', ['oo_short'], 'u_oo'), part('sh', ['sh'])], ...focus('u_oo') },
  { id: 'music', word: 'music', block: 7, parts: [part('m', ['m']), part('u', ['y', 'oo_long'], 'u_yoo'), part('s', ['z']), part('i', ['i']), part('c', ['c'])], ...focus('u_yoo') },
  { id: 'school', word: 'school', block: 7, parts: [part('s', ['s']), part('ch', ['c'], 'ch_k'), part('oo', ['oo_long']), part('l', ['l'])], ...focus('ch_k') },
  { id: 'chef', word: 'chef', block: 7, parts: [part('ch', ['sh'], 'ch_sh'), part('e', ['e']), part('f', ['f'])], ...focus('ch_sh') },
  { id: 'head', word: 'head', block: 7, parts: [part('h', ['h']), part('ea', ['e'], 'ea_e'), part('d', ['d'])], ...focus('ea_e') },
  { id: 'world', word: 'world', block: 8, parts: [part('w', ['w']), part('or', ['ur'], 'or_ur'), part('l', ['l']), part('d', ['d'])], ...focus('or_ur') },
  { id: 'learn', word: 'learn', block: 8, parts: [part('l', ['l']), part('ear', ['ur'], 'ear_ur'), part('n', ['n'])], ...focus('ear_ur') },
  { id: 'soup', word: 'soup', block: 8, parts: [part('s', ['s']), part('ou', ['oo_long'], 'ou_oo'), part('p', ['p'])], ...focus('ou_oo') },
  { id: 'shoulder', word: 'shoulder', block: 8, parts: [part('sh', ['sh']), part('ou', ['oa'], 'ou_oa'), part('l', ['l']), part('d', ['d']), part('er', ['schwa'])], ...focus('ou_oa') },
  { id: 'brief', word: 'brief', block: 8, parts: [part('b', ['b']), part('r', ['r']), part('ie', ['ee'], 'ie_ee'), part('f', ['f'])], ...focus('ie_ee') },
  { id: 'have', word: 'have', block: 8, parts: [part('h', ['h']), part('a', ['a']), part('ve', ['v'], 've_v')], ...focus('ve_v') },
  { id: 'gym', word: 'gym', block: 8, parts: [part('g', ['j'], 'g_j'), part('y', ['i']), part('m', ['m'])], ...focus('g_j') },
  { id: 'care', word: 'care', block: 8, parts: [part('c', ['c']), part('are', ['air'], 'are_air')], ...focus('are_air') },
  { id: 'there', word: 'there', block: 8, parts: [part('th', ['th_voiced']), part('ere', ['air'], 'ere_air')], ...focus('ere_air') },
  { id: 'pear', word: 'pear', block: 8, parts: [part('p', ['p']), part('ear', ['air'], 'ear_air')], ...focus('ear_air') },
  { id: 'catch', word: 'catch', block: 8, parts: [part('c', ['c']), part('a', ['a']), part('tch', ['ch'], 'tch_ch')], ...focus('tch_ch') },
  { id: 'mother', word: 'mother', block: 9, parts: [part('m', ['m']), part('o', ['u'], 'o_u'), part('th', ['th_voiced']), part('er', ['schwa'])], ...focus('o_u') },
  { id: 'huge', word: 'huge', block: 9, parts: [part('h', ['h']), part('u', ['y', 'oo_long']), part('ge', ['j'], 'ge_j')], ...focus('ge_j') },
  { id: 'bridge', word: 'bridge', block: 9, parts: [part('b', ['b']), part('r', ['r']), part('i', ['i']), part('dge', ['j'], 'dge_j')], ...focus('dge_j') },
  { id: 'listen', word: 'listen', block: 9, parts: [part('l', ['l']), part('i', ['i']), part('st', ['s'], 'st_s'), part('e', ['schwa']), part('n', ['n'])], ...focus('st_s') },
  { id: 'fence', word: 'fence', block: 9, parts: [part('f', ['f']), part('e', ['e']), part('n', ['n']), part('ce', ['s'], 'ce_s')], ...focus('ce_s') },
  { id: 'house', word: 'house', block: 9, parts: [part('h', ['h']), part('ou', ['ow']), part('se', ['s'], 'se_s')], ...focus('se_s') },
  { id: 'sign', word: 'sign', block: 9, parts: [part('s', ['s']), part('i', ['igh']), part('gn', ['n'], 'gn_n')], ...focus('gn_n') },
  { id: 'knee', word: 'knee', block: 9, parts: [part('kn', ['n'], 'kn_n'), part('ee', ['ee'])], ...focus('kn_n') },
  { id: 'wrap', word: 'wrap', block: 9, parts: [part('wr', ['r'], 'wr_r'), part('a', ['a']), part('p', ['p'])], ...focus('wr_r') },
  { id: 'lamb', word: 'lamb', block: 9, parts: [part('l', ['l']), part('a', ['a']), part('mb', ['m'], 'mb_m')], ...focus('mb_m') },
  { id: 'cheese', word: 'cheese', block: 10, parts: [part('ch', ['ch']), part('ee', ['ee']), part('se', ['z'], 'se_z')], ...focus('se_z') },
  { id: 'freeze', word: 'freeze', block: 10, parts: [part('f', ['f']), part('r', ['r']), part('ee', ['ee']), part('ze', ['z'], 'ze_z')], ...focus('ze_z') },
  { id: 'cheer', word: 'cheer', block: 10, parts: [part('ch', ['ch']), part('eer', ['ear'], 'eer_ear')], ...focus('eer_ear') },
  { id: 'patient', word: 'patient', block: 10, parts: [part('p', ['p']), part('a', ['ai']), part('ti', ['sh'], 'ti_sh'), part('e', ['schwa']), part('n', ['n']), part('t', ['t'])], ...focus('ti_sh') },
  { id: 'station', word: 'station', block: 10, parts: [part('s', ['s']), part('t', ['t']), part('a', ['ai']), part('tion', ['sh', 'schwa', 'n'], 'tion_shun')], ...focus('tion_shun') },
  { id: 'session', word: 'session', block: 10, parts: [part('s', ['s']), part('e', ['e']), part('ssi', ['sh'], 'ssi_sh'), part('o', ['schwa']), part('n', ['n'])], ...focus('ssi_sh') },
  { id: 'caught', word: 'caught', block: 10, parts: [part('c', ['c']), part('augh', ['or'], 'augh_or'), part('t', ['t'])], ...focus('augh_or') },
];

const initialPseudoReview = {
  reviewer: 'Codex initial content pass',
  date: '2026-07-25',
  status: 'pending-parent-review',
  checks: [
    'intended as a non-word',
    'English orthographic structure checked',
    'must be approved in Parent controls before use',
  ],
};

export const YEAR1_PSEUDO_WORDS = [
  { id: 'pseudo-zay', word: 'zay', block: 2, pseudo: true, creature: true, mappingId: 'ay_ai', parts: [part('z', ['z']), part('ay', ['ai'], 'ay_ai')], review: { ...initialPseudoReview } },
  { id: 'pseudo-droy', word: 'droy', block: 3, pseudo: true, creature: true, mappingId: 'oy_oi', parts: [part('d', ['d']), part('r', ['r']), part('oy', ['oi'], 'oy_oi')], review: { ...initialPseudoReview } },
  { id: 'pseudo-splone', word: 'splone', block: 5, pseudo: true, creature: true, mappingId: 'o_e_oa', parts: [part('s', ['s']), part('p', ['p']), part('l', ['l']), part('o-e', ['oa'], 'o_e_oa'), part('n', ['n'])], review: { ...initialPseudoReview } },
  { id: 'pseudo-phusp', word: 'phusp', block: 7, pseudo: true, creature: true, mappingId: 'ph_f', parts: [part('ph', ['f'], 'ph_f'), part('u', ['u']), part('s', ['s']), part('p', ['p'])], review: { ...initialPseudoReview } },
  { id: 'pseudo-vairn', word: 'vairn', block: 8, pseudo: true, creature: true, parts: [part('v', ['v']), part('air', ['air']), part('n', ['n'])], review: { ...initialPseudoReview } },
  { id: 'pseudo-knusp', word: 'knusp', block: 9, pseudo: true, creature: true, mappingId: 'kn_n', parts: [part('kn', ['n'], 'kn_n'), part('u', ['u']), part('s', ['s']), part('p', ['p'])], review: { ...initialPseudoReview } },
];

export const YEAR1_HRS_WORDS = [
  'please', 'once', 'any', 'many', 'again', 'who', 'whole',
  'where', 'two', 'here', 'sugar', 'because', 'friend',
];

export function getYear1Items(blockId) {
  const real = YEAR1_WORDS.filter(item => item.block === blockId);
  const pseudo = YEAR1_PSEUDO_WORDS.filter(item => item.block <= blockId);
  return { real, pseudo };
}

export function getYear1Coverage(recordingIds = new Set()) {
  const requiredSoundIds = new Set([
    ...YEAR1_GPCS.flatMap(gpc => gpc.soundIds),
    ...YEAR1_WORDS.flatMap(item => item.parts.flatMap(itemPart => itemPart.soundIds || [])),
  ]);
  const reusableSounds = [...requiredSoundIds].filter(id => recordingIds.has(id));
  const missingSounds = [...requiredSoundIds].filter(id => !recordingIds.has(id));
  const questionableSounds = ['th_voiced', 'schwa'].filter(id => requiredSoundIds.has(id));
  const recordedWords = YEAR1_WORDS.filter(item => recordingIds.has(`word:${item.word}`));
  const dadModelWords = YEAR1_WORDS.filter(item => !recordingIds.has(`word:${item.word}`));
  return { requiredSoundIds: [...requiredSoundIds], reusableSounds, missingSounds, questionableSounds, recordedWords, dadModelWords };
}

export function validateYear1Content() {
  const errors = [];
  const mappingIds = new Set();
  for (const gpc of YEAR1_GPCS) {
    if (mappingIds.has(gpc.id)) errors.push(`Duplicate GPC id: ${gpc.id}`);
    mappingIds.add(gpc.id);
    if (!gpc.grapheme || !gpc.soundIds?.length) errors.push(`Incomplete GPC: ${gpc.id}`);
  }

  const itemIds = new Set();
  for (const item of [...YEAR1_WORDS, ...YEAR1_PSEUDO_WORDS]) {
    if (itemIds.has(item.id)) errors.push(`Duplicate word id: ${item.id}`);
    itemIds.add(item.id);
    if (!item.word || !item.parts?.length) errors.push(`Incomplete word: ${item.id}`);
    if (item.mappingId && !mappingIds.has(item.mappingId)) {
      errors.push(`Unknown focus mapping ${item.mappingId} in ${item.id}`);
    }
    for (const itemPart of item.parts || []) {
      if (itemPart.mappingId && !mappingIds.has(itemPart.mappingId)) {
        errors.push(`Unknown part mapping ${itemPart.mappingId} in ${item.id}`);
      }
    }
    if (item.pseudo && (!item.creature || !item.review?.date || !item.review?.status || !item.review?.checks?.length)) {
      errors.push(`Pseudo-word lacks creature/review provenance: ${item.id}`);
    }
    if (!item.pseudo && item.creature) errors.push(`Real word uses creature convention: ${item.id}`);
  }

  return errors;
}
