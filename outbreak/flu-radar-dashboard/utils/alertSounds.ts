export const playAlertSound = (severity: 'red' | 'orange' | 'yellow') => {
    if (typeof window === 'undefined') return;

    const frequencies = { red: 880, orange: 660, yellow: 440 };
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.frequency.value = frequencies[severity];
    osc.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    setTimeout(() => osc.stop(), 500);
};
