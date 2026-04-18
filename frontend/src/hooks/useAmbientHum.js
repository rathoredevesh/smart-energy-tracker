import { useEffect, useRef } from "react";

export function useAmbientHum(enabled) {
  const contextRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!enabled || !AudioContextClass) {
      stopNodes();
      return undefined;
    }

    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;

    const gain = context.createGain();
    gain.gain.value = 0.012;
    gain.connect(context.destination);

    const oscillatorA = context.createOscillator();
    oscillatorA.type = "sine";
    oscillatorA.frequency.value = 52;
    oscillatorA.connect(gain);

    const oscillatorB = context.createOscillator();
    oscillatorB.type = "triangle";
    oscillatorB.frequency.value = 104;
    oscillatorB.detune.value = 6;
    oscillatorB.connect(gain);

    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.2;

    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.006;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    context.resume();
    oscillatorA.start();
    oscillatorB.start();
    lfo.start();
    nodesRef.current = [oscillatorA, oscillatorB, lfo, gain, lfoGain];

    return () => {
      stopNodes();
    };
  }, [enabled]);

  function stopNodes() {
    const [oscillatorA, oscillatorB, lfo, gain, lfoGain] = nodesRef.current;
    [oscillatorA, oscillatorB, lfo].forEach((node) => {
      try {
        node?.stop();
      } catch {
        return;
      }
    });
    [oscillatorA, oscillatorB, lfo, gain, lfoGain].forEach((node) => {
      try {
        node?.disconnect();
      } catch {
        return;
      }
    });
    nodesRef.current = [];
  }
}

