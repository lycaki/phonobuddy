import PhonoBuddyOwl from './PhonoBuddyOwl';
import { MONETIZATION, hasPaidProductLink } from '../data/monetization';

const card = {
  background: '#1a2744',
  border: '2px solid #2a3a5c',
  borderRadius: 16,
  padding: 16,
};

const buttonBase = {
  border: 'none',
  borderRadius: 14,
  padding: '13px 16px',
  fontSize: 15,
  fontFamily: "'Fredoka', sans-serif",
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

export default function ParentResources() {
  const paidProductReady = hasPaidProductLink();

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <PhonoBuddyOwl size={60} mood="happy" />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:26,color:'#ffd966',margin:0}}>Parent Resources</h2>
          <p style={{fontFamily:"'Andika'",fontSize:14,color:'#a0aec0',margin:0}}>Printable practice for short home sessions</p>
        </div>
      </div>

      <div style={{...card,borderColor:'#4ecdc4',marginBottom:16}}>
        <div style={{fontFamily:"'Fredoka'",fontSize:18,color:'#4ecdc4',marginBottom:8}}>
          {MONETIZATION.productName}
        </div>
        <p style={{fontFamily:"'Andika'",fontSize:14,color:'#dce6f5',margin:'0 0 12px'}}>
          Sound cards, blending ladders, word writing, tricky word practice, and a 14-day parent routine.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <a
            href={MONETIZATION.samplePdfPath}
            target="_blank"
            rel="noreferrer"
            style={{...buttonBase,background:'#4ecdc4',color:'#0f1729'}}
          >
            Open free sample
          </a>
          {paidProductReady ? (
            <a
              href={MONETIZATION.productUrl}
              target="_blank"
              rel="noreferrer"
              style={{...buttonBase,background:'#ffd966',color:'#0f1729'}}
            >
              Get full pack {MONETIZATION.suggestedPrice}
            </a>
          ) : (
            <a
              href={MONETIZATION.sampleHtmlPath}
              target="_blank"
              rel="noreferrer"
              style={{...buttonBase,background:'#1e2d4f',color:'#ffd966',border:'2px solid #ffd966'}}
            >
              Print sample
            </a>
          )}
        </div>
      </div>

      <div style={{...card,marginBottom:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:'#7bc67e',margin:'0 0 8px'}}>
          Daily routine
        </h3>
        <div style={{display:'grid',gap:8}}>
          {[
            ['1', 'Say one sound clearly.'],
            ['2', 'Find that sound in two or three words.'],
            ['3', 'Blend one short word ladder together.'],
            ['4', 'Stop while it still feels easy.'],
          ].map(([step, text]) => (
            <div key={step} style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{width:24,height:24,borderRadius:12,background:'#7bc67e',color:'#0f1729',display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:"'Fredoka'",fontSize:13}}>
                {step}
              </span>
              <span style={{fontFamily:"'Andika'",fontSize:14,color:'#dce6f5'}}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{...card,borderColor:'#3a4c70'}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:'#b088f9',margin:'0 0 8px'}}>
          Disclosure
        </h3>
        <p style={{fontFamily:"'Andika'",fontSize:12,color:'#a0aec0',margin:0}}>
          {MONETIZATION.disclosure}
        </p>
      </div>
    </div>
  );
}
