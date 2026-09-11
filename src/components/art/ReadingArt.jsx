import { useState } from 'react';
import { ImageOff, Volume2 } from 'lucide-react';
import { artUrl, getWordArt } from '../../data/wordArt';
import './ReadingArt.css';

export function ArtImage({ file, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(null);
  return <span className={`art-image ${className}`}>
    {failed === file ? <ImageOff aria-label={alt ? 'Picture unavailable' : undefined} aria-hidden={!alt} size={24} />
      : <img src={artUrl(file)} alt={alt} width={file === 'dino-valley-v1.webp' ? 1200 : 512}
        height={file === 'dino-valley-v1.webp' ? 800 : 512} loading={eager ? 'eager' : 'lazy'}
        decoding="async" onError={() => setFailed(file)} />}
  </span>;
}

export function DinoArt({ pose = 'reader', className = '', eager = false }) {
  return <ArtImage file={`dino-${pose}-v1.webp`} alt="" className={`dino-art ${className}`} eager={eager} />;
}

export function WordPicture({ word, onHear, compact = false }) {
  const art = getWordArt(word);
  if (!art) return null;
  const picture = <ArtImage key={art.key} file={art.file} alt={onHear || compact ? '' : art.key} eager={!compact} />;
  if (compact) return <span className="word-thumbnail">{picture}</span>;
  return onHear ? <button type="button" className="word-picture word-picture-button" onClick={() => onHear(word)} title={`Hear ${word} again`} aria-label={`Hear ${word} again`}>
    {picture}<span className="picture-caption"><Volume2 size={20} aria-hidden="true" />{word}</span>
  </button> : <div className="word-picture">{picture}</div>;
}
