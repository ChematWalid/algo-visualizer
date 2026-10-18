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
const operations: { value: TreeOperation; label: string }[] = [{ value: "insert", label: "Insert" }, { value: "delete", label: "Delete" }, { value: "search", label: "Search" }, { value: "preorder", label: "Preorder" }, { value: "inorder", label: "Inorder" }, { value: "postorder", label: "Postorder" }, { value: "levelorder", label: "Level order" }, { value: "min", label: "Find minimum" }, { value: "max", label: "Find maximum" }];
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
  const title = language === "fr" ? "Laboratoire d’arbres" : "Tree laboratory";
  const run = (nextOperation = operation, value = input) => {
    const result = runOperation(document, nextOperation, value);
    setDocument((current) => ({ ...current, root: cloneNode(result.root), updatedAt: new Date().toISOString() }));
    setOperation(nextOperation); setSteps(result.steps); setStepIndex(0); setPlaying(false); setNotice(result.result ?? "");
  };
  const changeKind = (kind: string | null) => { if (!kind) return; setDocument((current) => ({ ...makeDocument(kind as TreeKind), name: current.name, order: current.order })); setSteps([]); setNotice(""); };
  const buildArray = () => {
    const values = arrayInput.split(/[\s,;]+/).filter(Boolean);
    if (!values.length) { setNotice("Enter one or more keys separated by spaces or commas."); return; }
    const next = buildFromArray({ ...document, root: null }, values);
    setDocument(next); setSteps([]); setNotice(`Built ${values.length} input key${values.length === 1 ? "" : "s"} in order.`);
  };
  const reconstruct = () => {
    try {
      const first = traversalInput.trim().split(/[\s,;]+/).filter(Boolean); const second = inorderInput.trim().split(/[\s,;]+/).filter(Boolean);
      const root = reconstructBinary(first, second, traversalMode);
      setDocument((current) => ({ ...current, kind: "custom-binary", root })); setSteps([]); setNotice("Tree reconstructed. The first sequence was paired with inorder.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "These traversal inputs could not construct a unique tree."); }
  };
  const exportProject = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" })); const link = window.document.createElement("a"); link.href = url; link.download = `${document.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tree"}.json`; link.click(); URL.revokeObjectURL(url); };
  const importProject = async (file?: File) => { if (!file) return; try { const value: unknown = JSON.parse(await file.text()); if (!validateDocument(value)) throw new Error("This file is not a valid tree project."); setDocument(value); setSteps([]); setNotice("Project imported successfully."); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not read this project file."); } if (fileRef.current) fileRef.current.value = ""; };
  const openEnglish = language === "en";

  return <div className="workspace-page">
    <div className="page-heading"><div><div className="breadcrumbs"><span>Workspace</span><span>›</span><span>{kinds.find((item) => item.value === document.kind)?.label}</span></div><h1>{title}<span className="heading-period">.</span></h1><p>{openEnglish ? "Build a structure, run an algorithm, and follow every decision." : "Construisez une structure, lancez un algorithme et suivez chaque décision."}</p></div><div className="heading-actions"><Button variant="default" leftSection={<IconFileImport size={16} />} onClick={() => fileRef.current?.click()}>{openEnglish ? "Import" : "Importer"}</Button><Button className="primary-button" leftSection={<IconArrowDownToArc size={16} />} onClick={exportProject}>{openEnglish ? "Export project" : "Exporter"}</Button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importProject(event.currentTarget.files?.[0])} /></div></div>

    <div className="workspace-grid">
      <aside className="workspace-sidebar">
        <section className="panel setup-panel"><div className="panel-heading"><div><span className="eyebrow">01 · STRUCTURE</span><h2>Choose a tree</h2></div><IconTree size={20} className="heading-icon" /></div>
          <Select label="Tree type" value={document.kind} data={kinds} onChange={changeKind} searchable />
          {(document.kind === "mway" || document.kind === "btree") && <Select mt="md" label="Order · m" value={String(document.order)} data={(document.kind === "btree" ? [3, 5, 7, 9] : [3, 4, 5, 6, 7, 8]).map((value) => ({ value: String(value), label: `Order ${value}` }))} onChange={(value) => setDocument((current) => ({ ...current, order: Number(value ?? 3) }))} />}
          <div className="tree-summary"><span className="summary-icon"><IconTree size={16} /></span><div><strong>{kinds.find((item) => item.value === document.kind)?.label}</strong><span>{nodeCount} {nodeCount === 1 ? "key" : "keys"} · {document.kind === "avl" ? "self-balancing" : document.kind.startsWith("heap-") ? "complete binary" : "mutable structure"}</span></div></div>
        </section>

        <section className="panel action-panel"><div className="panel-heading"><div><span className="eyebrow">02 · OPERATION</span><h2>Try an operation</h2></div><span className="step-tag">Interactive</span></div>
          <Select label="Algorithm" value={operation} data={operations} onChange={(value) => setOperation((value ?? "insert") as TreeOperation)} searchable />
          {(operation === "insert" || operation === "delete" || operation === "search") && <TextInput mt="md" label={operation === "insert" ? "Key or array" : "Key"} value={input} onChange={(event) => setInput(event.currentTarget.value)} placeholder={operation === "insert" ? "e.g. 12, 24, 36" : "Enter a key"} onKeyDown={(event) => { if (event.key === "Enter") run(); }} />}
          <Button fullWidth mt="md" className="primary-button run-button" leftSection={<IconPlayerPlay size={16} />} onClick={() => run()}>{operation === "insert" && input.includes(",") ? "Run insertion sequence" : `Run ${operations.find((item) => item.value === operation)?.label.toLowerCase()}`}</Button>
        </section>

        <section className="panel array-panel"><div className="panel-heading"><div><span className="eyebrow">QUICK START</span><h2>Build from an array</h2></div><IconCirclePlus size={19} className="heading-icon" /></div><TextInput aria-label="Array values" value={arrayInput} onChange={(event) => setArrayInput(event.currentTarget.value)} placeholder="8, 3, 10, 1, 6, 14" /><Button variant="default" fullWidth mt="sm" leftSection={<IconCirclePlus size={16} />} onClick={buildArray}>Build structure</Button></section>

        {document.kind === "custom-binary" && <section className="panel reconstruct-panel"><div className="panel-heading"><div><span className="eyebrow">TRAVERSAL BUILDER</span><h2>Reconstruct a tree</h2></div></div><Select label="First traversal" value={traversalMode} data={[{ value: "preorder", label: "Preorder" }, { value: "postorder", label: "Postorder" }]} onChange={(value) => setTraversalMode((value ?? "preorder") as "preorder" | "postorder")} /><TextInput mt="sm" label={traversalMode === "preorder" ? "Preorder sequence" : "Postorder sequence"} value={traversalInput} onChange={(event) => setTraversalInput(event.currentTarget.value)} placeholder={traversalMode === "preorder" ? "A B D E C F" : "D E B F C A"} /><TextInput mt="sm" label="Inorder sequence" value={inorderInput} onChange={(event) => setInorderInput(event.currentTarget.value)} placeholder="D B E A F C" /><p className="footnote">Unique labels are required. Preorder/postorder alone can be ambiguous.</p><Button fullWidth mt="sm" variant="default" onClick={reconstruct}>Reconstruct tree</Button></section>}
      </aside>

      <main className="workspace-main">
        <section className="panel canvas-panel"><div className="canvas-heading"><div><div className="canvas-title"><span className="live-dot" /><h2>{document.name}</h2><Badge variant="light" color="green" radius="sm">{kinds.find((item) => item.value === document.kind)?.label}</Badge></div><p>{document.kind === "avl" ? "Balance factor is restored after every insert and removal." : document.kind.startsWith("heap-") ? "The root holds the current priority value." : "Select a node to inspect how values relate."}</p></div><Group gap={6}><Tooltip label="Clear tree"><ActionIcon variant="subtle" color="gray" aria-label="Clear tree" onClick={() => { setDocument((current) => ({ ...current, root: null })); setSteps([]); setNotice(""); }}><IconTrash size={17} /></ActionIcon></Tooltip><Menu shadow="md" width={180}><Menu.Target><Button variant="subtle" size="xs" rightSection={<IconChevronDown size={14} />}>Tree tools</Button></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconFileCode size={15} />} onClick={exportProject}>Export JSON</Menu.Item><Menu.Item leftSection={<IconUpload size={15} />} onClick={() => fileRef.current?.click()}>Import JSON</Menu.Item><Menu.Divider /><Menu.Item color="red" leftSection={<IconX size={15} />} onClick={() => { setDocument((current) => ({ ...current, root: null })); setSteps([]); }}>Clear tree</Menu.Item></Menu.Dropdown></Menu></Group></div>
          {document.kind === "custom-binary" || document.kind === "custom-nary" ? <Suspense fallback={<div className="tree-empty">Loading tree editor…</div>}><FreeformEditor root={document.root} kind={document.kind} onChange={(root) => setDocument((current) => ({ ...current, root }))} /></Suspense> : <TreeCanvas root={shownRoot} activeKey={input.trim().split(/[\s,;]+/).at(-1)} />}
          {notice && <div className="notice-line"><span className="notice-mark">↳</span>{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}
          <div className="canvas-legend"><span><i className="legend-node" /> Node</span><span><i className="legend-edge" /> Relationship</span><span className="canvas-hint">Drag to pan · Scroll to zoom</span></div>
        </section>
        <section className="panel playback-section"><div className="panel-heading"><div><span className="eyebrow">03 · EXECUTION</span><h2>Step through the algorithm</h2></div><span className="run-label">{steps.length ? `${steps.length} steps` : "Ready"}</span></div><PlaybackBar steps={steps} index={stepIndex} setIndex={setStepIndex} playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} /></section>
        <ComplexityCard kind={document.kind} operation={operation} counters={shownCounters ?? { comparisons: 0, visits: 0, swaps: 0, rotations: 0 }} count={nodeCount} />
      </main>
    </div>
  </div>;
}
