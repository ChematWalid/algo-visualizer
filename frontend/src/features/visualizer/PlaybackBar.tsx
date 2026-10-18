import { IconPlayerPause, IconPlayerPlay, IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react";
import type { TraceStep } from "../../core/treeTypes";

const frenchTitles: Record<string, string> = { "Start traversal": "Début du parcours", "Run preorder": "Parcours préordre", "Run inorder": "Parcours inordre", "Run postorder": "Parcours postordre", "Run levelorder": "Parcours par niveau", "Create node": "Créer un nœud", "Create root": "Créer la racine", Compare: "Comparer", "Compare key": "Comparer une clé", Insert: "Insérer", "Insert in node": "Insérer dans le nœud", "Insert in leaf": "Insérer dans la feuille", "Add node": "Ajouter un nœud", "Add to heap": "Ajouter au tas", "Sift up": "Remonter dans le tas", "Sift down": "Descendre dans le tas", "Duplicate key": "Clé déjà présente", "Split node": "Diviser le nœud", "Split child": "Diviser le fils", "Split root": "Diviser la racine", "Grow root": "Augmenter la hauteur", "Remove key": "Supprimer la clé", "Remove from leaf": "Supprimer de la feuille", "Merge children": "Fusionner les fils", "Merge siblings": "Fusionner les frères", "Borrow from left": "Emprunter à gauche", "Borrow from right": "Emprunter à droite", "Replace with predecessor": "Remplacer par le prédécesseur", "Replace with successor": "Remplacer par le successeur", "Extract root": "Extraire la racine", Minimum: "Minimum", Maximum: "Maximum", "Move left": "Aller à gauche", "Move right": "Aller à droite" };

export function PlaybackBar({ steps, index, setIndex, playing, setPlaying, speed, setSpeed, language = "en" }: { steps: TraceStep[]; index: number; setIndex: (index: number) => void; playing: boolean; setPlaying: (value: boolean) => void; speed: number; setSpeed: (value: number) => void; language?: "en" | "fr" }) {
  const en = language === "en";
  if (!steps.length) return <div className="trace-empty">{en ? "Run an operation to see each algorithm step here." : "Lancez une opération pour voir chaque étape de l’algorithme."}</div>;
  return <div className="playback-panel">
    <div className="playback-controls">
      <button aria-label="Previous step" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index <= 0}><IconPlayerSkipBack size={17} /></button>
      <button className="play-button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)}>{playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}</button>
      <button aria-label="Next step" onClick={() => setIndex(Math.min(steps.length - 1, index + 1))} disabled={index >= steps.length - 1}><IconPlayerSkipForward size={17} /></button>
      <span className="step-count">{en ? "Step" : "Étape"} {index + 1} <span>/ {steps.length}</span></span>
      <label className="speed-select">{en ? "Speed" : "Vitesse"} <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={0.7}>0.7×</option><option value={0.4}>0.4×</option><option value={0.2}>0.2×</option></select></label>
    </div>
    <input aria-label="Playback position" className="step-range" type="range" min={0} max={steps.length - 1} value={index} onChange={(event) => setIndex(Number(event.target.value))} />
    <div className="step-explanation"><span className="step-dot" /><div><strong>{en ? steps[index]?.title : frenchTitles[steps[index]?.title ?? ""] ?? steps[index]?.title}</strong><p>{en ? steps[index]?.detail : steps[index]?.detailFr ?? "Étape de l’algorithme : observer la structure mise en évidence."}</p></div></div>
  </div>;
}
