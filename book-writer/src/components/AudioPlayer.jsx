import { useState, useEffect, useRef, useCallback } from 'react';
import './AudioPlayer.css';

export default function AudioPlayer({ text, chapterTitle, bookTitle }) {
  const [playing, setPlaying]     = useState(false);
  const [paused, setPaused]       = useState(false);
  const [voices, setVoices]       = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate]           = useState(1);
  const [pitch, setPitch]         = useState(1);
  const [progress, setProgress]   = useState(0);   // 0-100
  const [wordIndex, setWordIndex] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const utterRef  = useRef(null);
  const wordsRef  = useRef([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        setVoices(v);
        // Default to first English voice
        const eng = v.find(x => x.lang.startsWith('en'));
        if (eng) setSelectedVoice(eng.name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  // Stop when component unmounts or text changes
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [text, supported]);

  // Reset when chapter changes
  useEffect(() => {
    if (supported) window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setWordIndex(0);
  }, [text, supported]);

  const speak = useCallback(() => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();

    const words = text.trim().split(/\s+/);
    wordsRef.current = words;
    setTotalWords(words.length);

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = rate;
    utter.pitch = pitch;

    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utter.voice = voice;
    }

    utter.onboundary = (e) => {
      if (e.name === 'word') {
        // Count approximate word index from char position
        const spoken = text.slice(0, e.charIndex);
        const idx = spoken.trim().split(/\s+/).filter(Boolean).length;
        setWordIndex(idx);
        setProgress(Math.round((idx / words.length) * 100));
      }
    };

    utter.onend = () => {
      setPlaying(false);
      setPaused(false);
      setProgress(100);
    };

    utter.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
    setPaused(false);
  }, [text, rate, pitch, selectedVoice, voices, supported]);

  const handlePlay = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
    } else {
      speak();
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setWordIndex(0);
  };

  if (!supported) {
    return (
      <div className="audio-player">
        <span className="audio-unsupported">
          Text-to-speech is not supported in this browser. Try Chrome or Edge.
        </span>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <div className="audio-info">
        <span className="audio-icon">▶</span>
        <div className="audio-meta">
          <span className="audio-chapter">{chapterTitle}</span>
          <span className="audio-book">{bookTitle}</span>
        </div>
      </div>

      <div className="audio-controls">
        {!playing ? (
          <button className="audio-btn audio-play" onClick={handlePlay} title={paused ? 'Resume' : 'Play'}>
            {paused ? '▶ Resume' : '▶ Play'}
          </button>
        ) : (
          <button className="audio-btn audio-pause" onClick={handlePause} title="Pause">
            ⏸ Pause
          </button>
        )}
        <button className="audio-btn audio-stop" onClick={handleStop} title="Stop" disabled={!playing && !paused}>
          ⏹ Stop
        </button>
      </div>

      <div className="audio-progress-wrap">
        <div className="audio-progress-bar">
          <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="audio-progress-label">
          {totalWords > 0 ? `${wordIndex} / ${totalWords} words` : 'Ready'}
        </span>
      </div>

      <div className="audio-settings">
        <label className="audio-label">
          Voice
          <select
            className="audio-select"
            value={selectedVoice}
            onChange={e => setSelectedVoice(e.target.value)}
            disabled={playing}
          >
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </label>

        <label className="audio-label">
          Speed: {rate.toFixed(1)}×
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={rate}
            onChange={e => setRate(parseFloat(e.target.value))}
            disabled={playing}
            className="audio-range"
          />
        </label>

        <label className="audio-label">
          Pitch: {pitch.toFixed(1)}
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={pitch}
            onChange={e => setPitch(parseFloat(e.target.value))}
            disabled={playing}
            className="audio-range"
          />
        </label>
      </div>
    </div>
  );
}
