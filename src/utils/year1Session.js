import { YEAR1_WORDS, YEAR1_PSEUDO_WORDS } from '../data/year1Profile.js';

export function chooseSessionItems(blockId, completedCount, pseudoApproved) {
  const current = YEAR1_WORDS.filter(item => item.block === blockId);
  const review = YEAR1_WORDS.filter(item => item.block < blockId);
  const pool = current.length ? [...current, ...review.slice(-8)] : review;
  const offset = completedCount % (pool.length || 1);
  const chosen = Array.from({ length: pool.length ? 6 : 0 }, (_, index) => pool[(offset + index) % pool.length]);
  const pseudo = YEAR1_PSEUDO_WORDS.filter(item => item.block <= blockId);
  if (pseudoApproved && blockId >= 2 && pseudo.length) {
    chosen[5] = pseudo[completedCount % pseudo.length];
  }
  return chosen;
}

export function requiredSessionSounds(items) {
  return [...new Set(items.flatMap(item => item.parts.flatMap(part => part.soundIds || [])))];
}

export function getBlockReadiness(blockId, attempts) {
  const words = YEAR1_WORDS.filter(word => word.block === blockId);
  const secure = words.filter(word => {
    const recent = attempts.filter(event => event.itemId === word.id && event.itemType === 'real')
      .sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
    return recent.length === 2 && recent.every(event => event.correct && !event.retries);
  });
  return { ready: words.length > 0 && secure.length === words.length, secure: secure.length, total: words.length };
}
