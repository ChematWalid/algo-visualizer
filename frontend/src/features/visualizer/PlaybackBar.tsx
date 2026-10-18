import { IconPlayerPause, IconPlayerPlay, IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react";
import type { TraceStep } from "../../core/treeTypes";

export function PlaybackBar({ steps, index, setIndex, playing, setPlaying, speed, setSpeed }: { steps: TraceStep[]; index: number; setIndex: (index: number) => void; playing: boolean; setPlaying: (value: boolean) => void; speed: number; setSpeed: (value: number) => void }) {
  if (!steps.length) return <div className="trace-empty">Run an operation to see each algorithm step here.</div>;
  return <div className="playback-panel">
    <div className="playback-controls">
      <button aria-label="Previous step" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index <= 0}><IconPlayerSkipBack size={17} /></button>
      <button className="play-button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)}>{playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}</button>
      <button aria-label="Next step" onClick={() => setIndex(Math.min(steps.length - 1, index + 1))} disabled={index >= steps.length - 1}><IconPlayerSkipForward size={17} /></button>
      <span className="step-count">Step {index + 1} <span>/ {steps.length}</span></span>
      <label className="speed-select">Speed <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={0.7}>0.7×</option><option value={0.4}>0.4×</option><option value={0.2}>0.2×</option></select></label>
    </div>
    <input aria-label="Playback position" className="step-range" type="range" min={0} max={steps.length - 1} value={index} onChange={(event) => setIndex(Number(event.target.value))} />
    <div className="step-explanation"><span className="step-dot" /><div><strong>{steps[index]?.title}</strong><p>{steps[index]?.detail}</p></div></div>
  </div>;
}
