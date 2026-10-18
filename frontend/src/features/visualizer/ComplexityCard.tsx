import type { TreeKind, TreeOperation, TreeCounters } from "../../core/treeTypes";

type Bounds = [string, string, string, string];
const linear: Bounds = ["O(n)", "O(n)", "O(n)", "O(1)"];
const traversal: Partial<Record<TreeOperation, Bounds>> = { preorder: ["O(n)", "O(n)", "O(n)", "O(h)"], inorder: ["O(n)", "O(n)", "O(n)", "O(h)"], postorder: ["O(n)", "O(n)", "O(n)", "O(h)"], levelorder: ["O(n)", "O(n)", "O(n)", "O(w)"] };
const allNodes: Partial<Record<TreeOperation, Bounds>> = { ...traversal, search: linear, min: linear, max: linear, delete: ["O(1)", "O(n)", "O(n)", "O(h)"] };
const table: Record<TreeKind, Partial<Record<TreeOperation, Bounds>>> = {
  "custom-binary": { ...allNodes, min: ["O(n)", "O(n)", "O(n)", "O(h)"], max: ["O(n)", "O(n)", "O(n)", "O(h)"], insert: ["O(1)", "O(1)", "O(1)", "O(1)"] },
  "custom-nary": { ...allNodes, min: ["O(n)", "O(n)", "O(n)", "O(h)"], max: ["O(n)", "O(n)", "O(n)", "O(h)"], insert: ["O(1)", "O(1)", "O(1)", "O(1)"] },
  bst: { ...traversal, search: ["O(1)", "O(log n)", "O(n)", "O(h)"], insert: ["O(1)", "O(log n)", "O(n)", "O(h)"], delete: ["O(1)", "O(log n)", "O(n)", "O(h)"], min: ["O(1)", "O(log n)", "O(n)", "O(1)"], max: ["O(1)", "O(log n)", "O(n)", "O(1)"] },
  avl: { ...traversal, search: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"], delete: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"], min: ["O(log n)", "O(log n)", "O(log n)", "O(1)"], max: ["O(log n)", "O(log n)", "O(log n)", "O(1)"] },
  "heap-min": { ...traversal, search: linear, min: ["O(1)", "O(1)", "O(1)", "O(1)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(1)"], delete: ["O(n)", "O(n)", "O(n)", "O(n)"], "extract-root": ["O(log n)", "O(log n)", "O(log n)", "O(1)"] },
  "heap-max": { ...traversal, search: linear, max: ["O(1)", "O(1)", "O(1)", "O(1)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(1)"], delete: ["O(n)", "O(n)", "O(n)", "O(n)"], "extract-root": ["O(log n)", "O(log n)", "O(log n)", "O(1)"] },
  mway: { ...traversal, search: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"], insert: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"], delete: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(h)"], min: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"], max: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"] },
  btree: { ...traversal, search: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], insert: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], delete: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], min: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], max: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"] },
};

export function ComplexityCard({ kind, operation, counters, count, language = "en" }: { kind: TreeKind; operation: TreeOperation; counters: TreeCounters; count: number; language?: "en" | "fr" }) {
  const en = language === "en";
  const value = table[kind][operation];
  return <section className="panel complexity-panel">
    <div className="panel-heading"><div><span className="eyebrow">{en ? "ANALYSIS" : "ANALYSE"}</span><h2>{en ? "Complexity" : "Complexité"}</h2></div><span className="n-chip">n = {count}</span></div>
    {value ? <div className="complexity-grid"><div><span>{en ? "Best time" : "Meilleur temps"}</span><strong>{value[0]}</strong></div><div><span>{en ? "Average time" : "Temps moyen"}</span><strong>{value[1]}</strong></div><div><span>{en ? "Worst time" : "Pire temps"}</span><strong>{value[2]}</strong></div><div><span>{en ? "Extra space" : "Espace auxiliaire"}</span><strong>{value[3]}</strong></div></div> : <p className="muted small-copy">{en ? "Choose an operation to see its asymptotic bounds." : "Choisissez une opération pour voir ses bornes asymptotiques."}</p>}
    <div className="counter-grid"><div><strong>{counters.comparisons}</strong><span>{en ? "Comparisons" : "Comparaisons"}</span></div><div><strong>{counters.visits}</strong><span>{en ? "Node visits" : "Nœuds visités"}</span></div><div><strong>{counters.swaps}</strong><span>{en ? "Swaps" : "Échanges"}</span></div><div><strong>{counters.rotations}</strong><span>{en ? "Rotations" : "Rotations"}</span></div></div>
    <p className="footnote">{en ? "Run counters describe this input. Asymptotic bounds describe growth as the tree gets larger." : "Les compteurs décrivent cette entrée. Les bornes asymptotiques décrivent la croissance avec la taille de l’arbre."}</p>
  </section>;
}
