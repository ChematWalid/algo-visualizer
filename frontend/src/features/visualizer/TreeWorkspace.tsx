import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ActionIcon, Badge, Button, Group, Menu, Select, TextInput, Tooltip } from "@mantine/core";
import { IconArrowDownToArc, IconChevronDown, IconCirclePlus, IconFileImport, IconFileCode, IconPlayerPlay, IconTrash, IconTree, IconUpload, IconX } from "@tabler/icons-react";
import { buildFromArray, reconstructBinary, runOperation } from "../../core/algorithms";
import { cloneNode, makeDocument, validateDocument, type TraceStep, type TreeDocument, type TreeKind, type TreeOperation } from "../../core/treeTypes";
import { ComplexityCard } from "./ComplexityCard";
import { PlaybackBar } from "./PlaybackBar";
import { TreeCanvas } from "./TreeCanvas";

const FreeformEditor = lazy(() => import("./FreeformEditor").then((module) => ({ default: module.FreeformEditor })));

const kinds: { value: TreeKind; label: string; group: string }[] = [
  { value: "custom-binary", label: "Binary tree", group: "Build your own" }, { value: "custom-nary", label: "N-ary tree", group: "Build your own" },
  { value: "bst", label: "Binary search tree", group: "Search trees" }, { value: "avl", label: "AVL tree", group: "Search trees" }, { value: "mway", label: "M-way search tree", group: "Search trees" }, { value: "btree", label: "B-tree", group: "Search trees" },
  { value: "heap-min", label: "Min heap", group: "Heaps" }, { value: "heap-max", label: "Max heap", group: "Heaps" },
];
const operations: { value: TreeOperation; en: string; fr: string }[] = [{ value: "insert", en: "Insert", fr: "Insérer" }, { value: "delete", en: "Delete key", fr: "Supprimer une clé" }, { value: "extract-root", en: "Remove root", fr: "Extraire la racine" }, { value: "search", en: "Search", fr: "Rechercher" }, { value: "preorder", en: "Preorder", fr: "Préordre" }, { value: "inorder", en: "Inorder", fr: "Inordre" }, { value: "postorder", en: "Postorder", fr: "Postordre" }, { value: "levelorder", en: "Level order", fr: "Par niveau" }, { value: "min", en: "Find minimum", fr: "Minimum" }, { value: "max", en: "Find maximum", fr: "Maximum" }];
const kindLabel: Record<TreeKind, { en: string; fr: string }> = { "custom-binary": { en: "Binary tree", fr: "Arbre binaire" }, "custom-nary": { en: "N-ary tree", fr: "Arbre n-aire" }, bst: { en: "Binary search tree", fr: "Arbre binaire de recherche" }, avl: { en: "AVL tree", fr: "Arbre AVL" }, "heap-min": { en: "Min heap", fr: "Tas-min" }, "heap-max": { en: "Max heap", fr: "Tas-max" }, mway: { en: "M-way search tree", fr: "Arbre m-aire de recherche" }, btree: { en: "B-tree", fr: "Arbre B" } };
function keyCount(root: TreeDocument["root"]): number { return root ? root.keys.length + root.children.reduce((sum, child) => sum + keyCount(child), 0) : 0; }

interface Props { language: "en" | "fr"; }
export function TreeWorkspace({ language }: Props) {
  const [document, setDocument] = useState<TreeDocument>(() => {
    try { const saved = localStorage.getItem("algo-visualizer.project"); if (saved) { const value = JSON.parse(saved); if (validateDocument(value)) return value; } } catch { /* A damaged browser draft should not prevent the workspace from opening. */ }
    return makeDocument("bst");
  });
  const [operation, setOperation] = useState<TreeOperation>("insert");
  const [input, setInput] = useState("42, 18, 67, 9, 25, 54, 81");
  const [arrayInput, setArrayInput] = useState("");
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [notice, setNotice] = useState("");
  const [traversalMode, setTraversalMode] = useState<"preorder" | "postorder">("preorder");
  const [traversalInput, setTraversalInput] = useState("");
  const [inorderInput, setInorderInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { localStorage.setItem("algo-visualizer.project", JSON.stringify({ ...document, updatedAt: new Date().toISOString() })); }, [document]);
  useEffect(() => { if (!playing || !steps.length) return; const timer = window.setTimeout(() => { if (stepIndex >= steps.length - 1) setPlaying(false); else setStepIndex((current) => current + 1); }, 1100 * speed); return () => window.clearTimeout(timer); }, [playing, speed, stepIndex, steps.length]);
  const shownRoot = steps.length ? steps[stepIndex]?.tree ?? document.root : document.root;
  const shownCounters = steps[stepIndex]?.counters;
  const nodeCount = keyCount(document.root);
  const en = language === "en";
  const visibleOperations = operations.filter((item) => (item.value !== "extract-root" || document.kind.startsWith("heap-")) && (item.value !== "min" || !document.kind.startsWith("heap-max")) && (item.value !== "max" || !document.kind.startsWith("heap-min"))).map((item) => ({ value: item.value, label: item[language] }));
  const visibleKinds = kinds.map((item) => ({ value: item.value, label: kindLabel[item.value][language], group: language === "en" ? item.group : item.group === "Build your own" ? "Créer" : item.group === "Search trees" ? "Arbres de recherche" : "Tas" }));
  const title = language === "fr" ? "Laboratoire d’arbres" : "Tree laboratory";
  const run = (nextOperation = operation, value = input) => {
    const result = runOperation(document, nextOperation, value);
    setDocument((current) => ({ ...current, root: cloneNode(result.root), updatedAt: new Date().toISOString() }));
    setOperation(nextOperation); setSteps(result.steps); setStepIndex(0); setPlaying(false);
    const message = result.result ?? "";
    setNotice(!en ? message.replace("was found.", "a été trouvé.").replace("was not found.", "n’a pas été trouvé.").replace("Extracted ", "Valeur extraite : ").replace("Tree is empty.", "L’arbre est vide.") : message);
  };
  const changeKind = (kind: string | null) => { if (!kind) return; setDocument((current) => ({ ...makeDocument(kind as TreeKind), name: current.name, order: current.order })); setSteps([]); setNotice(""); };
  const buildArray = () => {
    const values = arrayInput.split(/[\s,;]+/).filter(Boolean);
    if (!values.length) { setNotice(en ? "Enter one or more keys separated by spaces or commas." : "Saisissez une ou plusieurs clés séparées par des espaces ou des virgules."); return; }
    const next = buildFromArray({ ...document, root: null }, values);
    setDocument(next); setSteps([]); setNotice(en ? `Built ${values.length} input key${values.length === 1 ? "" : "s"} in order.` : `${values.length} clé${values.length > 1 ? "s" : ""} insérée${values.length > 1 ? "s" : ""} dans l’ordre.`);
  };
  const reconstruct = () => {
    try {
      const first = traversalInput.trim().split(/[\s,;]+/).filter(Boolean); const second = inorderInput.trim().split(/[\s,;]+/).filter(Boolean);
      const root = reconstructBinary(first, second, traversalMode);
      setDocument((current) => ({ ...current, kind: "custom-binary", root })); setSteps([]); setNotice(en ? "Tree reconstructed. The first sequence was paired with inorder." : "Arbre reconstruit à partir du premier parcours et de l’inordre.");
    } catch (error) { setNotice(error instanceof Error ? (en ? error.message : "Ces parcours sont incompatibles ou ne permettent pas une reconstruction unique.") : (en ? "These traversal inputs could not construct a unique tree." : "Ces parcours ne permettent pas une reconstruction unique.")); }
  };
  const exportProject = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" })); const link = window.document.createElement("a"); link.href = url; link.download = `${document.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tree"}.json`; link.click(); URL.revokeObjectURL(url); };
  const importProject = async (file?: File) => { if (!file) return; try { const value: unknown = JSON.parse(await file.text()); if (!validateDocument(value)) throw new Error(en ? "This file is not a valid tree project." : "Ce fichier ne contient pas un projet d’arbre valide."); setDocument(value); setSteps([]); setNotice(en ? "Project imported successfully." : "Projet importé avec succès."); } catch (error) { setNotice(error instanceof Error ? error.message : (en ? "Could not read this project file." : "Impossible de lire ce fichier projet.")); } if (fileRef.current) fileRef.current.value = ""; };

  return <div className="workspace-page">
    <div className="page-heading"><div><div className="breadcrumbs"><span>{en ? "Workspace" : "Espace de travail"}</span><span>›</span><span>{kindLabel[document.kind][language]}</span></div><h1>{title}<span className="heading-period">.</span></h1><p>{en ? "Build a structure, run an algorithm, and follow every decision." : "Construisez une structure, lancez un algorithme et suivez chaque décision."}</p></div><div className="heading-actions"><Button variant="default" leftSection={<IconFileImport size={16} />} onClick={() => fileRef.current?.click()}>{en ? "Import" : "Importer"}</Button><Button className="primary-button" leftSection={<IconArrowDownToArc size={16} />} onClick={exportProject}>{en ? "Export project" : "Exporter"}</Button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importProject(event.currentTarget.files?.[0])} /></div></div>

    <div className="workspace-grid">
      <aside className="workspace-sidebar">
        <section className="panel setup-panel"><div className="panel-heading"><div><span className="eyebrow">01 · {en ? "STRUCTURE" : "STRUCTURE"}</span><h2>{en ? "Choose a tree" : "Choisir un arbre"}</h2></div><IconTree size={20} className="heading-icon" /></div>
          <Select label={en ? "Tree type" : "Type d’arbre"} value={document.kind} data={visibleKinds} onChange={changeKind} searchable />
          {(document.kind === "mway" || document.kind === "btree") && <Select mt="md" label={en ? "Order · m" : "Ordre · m"} value={String(document.order)} data={(document.kind === "btree" ? [3, 5, 7, 9] : [3, 4, 5, 6, 7, 8]).map((value) => ({ value: String(value), label: `${en ? "Order" : "Ordre"} ${value}` }))} onChange={(value) => setDocument((current) => ({ ...current, order: Number(value ?? 3) }))} />}
          <div className="tree-summary"><span className="summary-icon"><IconTree size={16} /></span><div><strong>{kindLabel[document.kind][language]}</strong><span>{nodeCount} {en ? (nodeCount === 1 ? "key" : "keys") : (nodeCount === 1 ? "clé" : "clés")} · {document.kind === "avl" ? (en ? "self-balancing" : "auto-équilibré") : document.kind.startsWith("heap-") ? (en ? "complete binary" : "binaire complet") : (en ? "mutable structure" : "structure modifiable")}</span></div></div>
        </section>

        <section className="panel action-panel"><div className="panel-heading"><div><span className="eyebrow">02 · {en ? "OPERATION" : "OPÉRATION"}</span><h2>{en ? "Try an operation" : "Essayer une opération"}</h2></div><span className="step-tag">{en ? "Interactive" : "Interactif"}</span></div>
          <Select label={en ? "Algorithm" : "Algorithme"} value={operation} data={visibleOperations} onChange={(value) => setOperation((value ?? "insert") as TreeOperation)} searchable />
          {(operation === "insert" || operation === "delete" || operation === "search") && <TextInput mt="md" label={operation === "insert" ? (en ? "Key or array" : "Clé ou tableau") : (en ? "Key" : "Clé")} value={input} onChange={(event) => setInput(event.currentTarget.value)} placeholder={operation === "insert" ? "e.g. 12, 24, 36" : (en ? "Enter a key" : "Saisir une clé")} onKeyDown={(event) => { if (event.key === "Enter") run(); }} />}
          <Button fullWidth mt="md" className="primary-button run-button" leftSection={<IconPlayerPlay size={16} />} onClick={() => run()}>{operation === "insert" && input.includes(",") ? (en ? "Run insertion sequence" : "Insérer la séquence") : `${en ? "Run" : "Lancer"} ${visibleOperations.find((item) => item.value === operation)?.label.toLowerCase()}`}</Button>
        </section>

        <section className="panel array-panel"><div className="panel-heading"><div><span className="eyebrow">{en ? "QUICK START" : "DÉMARRAGE RAPIDE"}</span><h2>{en ? "Build from an array" : "Créer depuis un tableau"}</h2></div><IconCirclePlus size={19} className="heading-icon" /></div><TextInput aria-label={en ? "Array values" : "Valeurs du tableau"} value={arrayInput} onChange={(event) => setArrayInput(event.currentTarget.value)} placeholder="8, 3, 10, 1, 6, 14" /><Button variant="default" fullWidth mt="sm" leftSection={<IconCirclePlus size={16} />} onClick={buildArray}>{en ? "Build structure" : "Construire la structure"}</Button></section>

        {document.kind === "custom-binary" && <section className="panel reconstruct-panel"><div className="panel-heading"><div><span className="eyebrow">{en ? "TRAVERSAL BUILDER" : "CONSTRUCTION PAR PARCOURS"}</span><h2>{en ? "Reconstruct a tree" : "Reconstruire un arbre"}</h2></div></div><Select label={en ? "First traversal" : "Premier parcours"} value={traversalMode} data={[{ value: "preorder", label: en ? "Preorder" : "Préordre" }, { value: "postorder", label: en ? "Postorder" : "Postordre" }]} onChange={(value) => setTraversalMode((value ?? "preorder") as "preorder" | "postorder")} /><TextInput mt="sm" label={traversalMode === "preorder" ? (en ? "Preorder sequence" : "Séquence préordre") : (en ? "Postorder sequence" : "Séquence postordre")} value={traversalInput} onChange={(event) => setTraversalInput(event.currentTarget.value)} placeholder={traversalMode === "preorder" ? "A B D E C F" : "D E B F C A"} /><TextInput mt="sm" label={en ? "Inorder sequence" : "Séquence inordre"} value={inorderInput} onChange={(event) => setInorderInput(event.currentTarget.value)} placeholder="D B E A F C" /><p className="footnote">{en ? "Unique labels are required. Preorder/postorder alone can be ambiguous." : "Les étiquettes doivent être uniques. Préordre/postordre seuls peuvent être ambigus."}</p><Button fullWidth mt="sm" variant="default" onClick={reconstruct}>{en ? "Reconstruct tree" : "Reconstruire l’arbre"}</Button></section>}
      </aside>

      <main className="workspace-main">
        <section className="panel canvas-panel"><div className="canvas-heading"><div><div className="canvas-title"><span className="live-dot" /><h2>{document.name}</h2><Badge variant="light" color="green" radius="sm">{kindLabel[document.kind][language]}</Badge></div><p>{document.kind === "avl" ? (en ? "Balance is restored after each insertion and removal." : "L’équilibre est restauré après chaque insertion ou suppression.") : document.kind.startsWith("heap-") ? (en ? "The root holds the current priority value." : "La racine contient la valeur prioritaire.") : (en ? "Select a node to inspect how values relate." : "Sélectionnez un nœud pour explorer ses relations.")}</p></div><Group gap={6}><Tooltip label={en ? "Clear tree" : "Vider l’arbre"}><ActionIcon variant="subtle" color="gray" aria-label={en ? "Clear tree" : "Vider l’arbre"} onClick={() => { setDocument((current) => ({ ...current, root: null })); setSteps([]); setNotice(""); }}><IconTrash size={17} /></ActionIcon></Tooltip><Menu shadow="md" width={180}><Menu.Target><Button variant="subtle" size="xs" rightSection={<IconChevronDown size={14} />}>{en ? "Tree tools" : "Outils"}</Button></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconFileCode size={15} />} onClick={exportProject}>{en ? "Export JSON" : "Exporter JSON"}</Menu.Item><Menu.Item leftSection={<IconUpload size={15} />} onClick={() => fileRef.current?.click()}>{en ? "Import JSON" : "Importer JSON"}</Menu.Item><Menu.Divider /><Menu.Item color="red" leftSection={<IconX size={15} />} onClick={() => { setDocument((current) => ({ ...current, root: null })); setSteps([]); }}>{en ? "Clear tree" : "Vider l’arbre"}</Menu.Item></Menu.Dropdown></Menu></Group></div>
          {document.kind === "custom-binary" || document.kind === "custom-nary" ? <Suspense fallback={<div className="tree-empty">{en ? "Loading tree editor…" : "Chargement de l’éditeur…"}</div>}><FreeformEditor root={document.root} kind={document.kind} language={language} onChange={(root) => setDocument((current) => ({ ...current, root }))} /></Suspense> : <TreeCanvas root={shownRoot} activeKey={input.trim().split(/[\s,;]+/).at(-1)} />}
          {notice && <div className="notice-line"><span className="notice-mark">↳</span>{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}
          <div className="canvas-legend"><span><i className="legend-node" /> {en ? "Node" : "Nœud"}</span><span><i className="legend-edge" /> {en ? "Relationship" : "Relation"}</span><span className="canvas-hint">{en ? "Playback highlights each algorithm step" : "Le parcours met en évidence chaque étape"}</span></div>
        </section>
        <section className="panel playback-section"><div className="panel-heading"><div><span className="eyebrow">03 · {en ? "EXECUTION" : "EXÉCUTION"}</span><h2>{en ? "Step through the algorithm" : "Suivre l’algorithme étape par étape"}</h2></div><span className="run-label">{steps.length ? `${steps.length} ${en ? "steps" : "étapes"}` : (en ? "Ready" : "Prêt")}</span></div><PlaybackBar steps={steps} index={stepIndex} setIndex={setStepIndex} playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} language={language} /></section>
        <ComplexityCard kind={document.kind} operation={operation} counters={shownCounters ?? { comparisons: 0, visits: 0, swaps: 0, rotations: 0 }} count={nodeCount} language={language} />
      </main>
    </div>
  </div>;
}
