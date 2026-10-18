/** Un petit « ding » joué par le navigateur, sans fichier son. Deux notes pour la cuisine. */
export function sonnerette(notes: number[] = [880]) {
  try {
    const contexte = new AudioContext();
    notes.forEach((frequence, index) => {
      const debut = contexte.currentTime + index * 0.18;
      const oscillateur = contexte.createOscillator();
      const volume = contexte.createGain();
      oscillateur.frequency.value = frequence;
      volume.gain.setValueAtTime(0.22, debut);
      volume.gain.exponentialRampToValueAtTime(0.001, debut + 0.8);
      oscillateur.connect(volume).connect(contexte.destination);
      oscillateur.start(debut);
      oscillateur.stop(debut + 0.8);
    });
    window.setTimeout(() => void contexte.close(), 1500 + notes.length * 200);
  } catch {
    /* son bloqué par le navigateur : l'affichage suffit */
  }
}
