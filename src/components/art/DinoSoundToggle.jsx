import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { dinoSoundsEnabled, playDinoRoar, setDinoSoundsEnabled } from '../../utils/dinoSounds';

export default function DinoSoundToggle() {
  const [enabled, setEnabled] = useState(dinoSoundsEnabled);
  return <button type="button" className="dino-sound-toggle" aria-label="Dinosaur page sounds" aria-pressed={enabled}
    title={enabled ? 'Turn dinosaur page sounds off' : 'Turn dinosaur page sounds on'} onClick={() => {
      setDinoSoundsEnabled(!enabled);
      setEnabled(!enabled);
      if (!enabled) void playDinoRoar();
    }}>{enabled ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Dino sounds</span></button>;
}
