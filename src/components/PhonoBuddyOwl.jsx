export default function PhonoBuddyOwl({ size = 120, mood = "happy", speaking = false, className = "" }) {
  const eyeScale = mood === "excited" ? 1.15 : mood === "thinking" ? 0.9 : 1;
  const mouthPath = mood === "happy" ? "M 48 78 Q 60 88 72 78" : mood === "excited" ? "M 46 76 Q 60 92 74 76" : "M 50 80 L 70 80";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} style={{filter:"drop-shadow(0 4px 12px rgba(255,183,77,0.3))"}}>
      {/* Body */}
      <ellipse cx="60" cy="68" rx="38" ry="42" fill="#8B6914" />
      <ellipse cx="60" cy="70" rx="30" ry="34" fill="#D4A845" />
      {/* Belly */}
      <ellipse cx="60" cy="80" rx="20" ry="22" fill="#F5DEB3" />
      {/* Eyes */}
      <circle cx="45" cy="55" r={14 * eyeScale} fill="white" stroke="#5C4033" strokeWidth="2" />
      <circle cx="75" cy="55" r={14 * eyeScale} fill="white" stroke="#5C4033" strokeWidth="2" />
      <circle cx={speaking ? 47 : 45} cy="55" r={6 * eyeScale} fill="#2C1810">
        <animate attributeName="cy" values="55;53;55" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={speaking ? 77 : 75} cy="55" r={6 * eyeScale} fill="#2C1810">
        <animate attributeName="cy" values="55;53;55" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={speaking ? 49 : 47} cy="53" r="2" fill="white" />
      <circle cx={speaking ? 79 : 77} cy="53" r="2" fill="white" />
      {/* Beak */}
      <polygon points="55,65 65,65 60,72" fill="#FF8C00" stroke="#E07000" strokeWidth="1" />
      {/* Mouth */}
      <path d={mouthPath} fill="none" stroke="#5C4033" strokeWidth="2" strokeLinecap="round" />
      {/* Ear tufts */}
      <polygon points="30,32 38,22 42,38" fill="#8B6914" />
      <polygon points="90,32 82,22 78,38" fill="#8B6914" />
      {/* Wings */}
      <ellipse cx="24" cy="72" rx="10" ry="20" fill="#A07828" transform={speaking ? "rotate(-5 24 72)" : ""}>
        {speaking && <animateTransform attributeName="transform" type="rotate" values="-5 24 72;5 24 72;-5 24 72" dur="0.4s" repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="96" cy="72" rx="10" ry="20" fill="#A07828" transform={speaking ? "rotate(5 96 72)" : ""}>
        {speaking && <animateTransform attributeName="transform" type="rotate" values="5 96 72;-5 96 72;5 96 72" dur="0.4s" repeatCount="indefinite" />}
      </ellipse>
      {/* Feet */}
      <ellipse cx="48" cy="108" rx="10" ry="5" fill="#FF8C00" />
      <ellipse cx="72" cy="108" rx="10" ry="5" fill="#FF8C00" />
    </svg>
  );
}
