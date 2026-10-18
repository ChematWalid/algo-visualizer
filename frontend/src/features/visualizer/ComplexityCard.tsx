import type { TreeKind, TreeOperation, TreeCounters } from "../../core/treeTypes";

const table: Record<TreeKind, Partial<Record<TreeOperation, [string, string, string, string]>>> = {
  "custom-binary": { search: ["O(1)", "O(n)", "O(n)", "O(1)"], insert: ["O(1)", "O(1)", "O(1)", "O(1)"], delete: ["O(1)", "O(n)", "O(n)", "O(h)"], preorder: ["O(n)", "O(n)", "O(n)", "O(h)"], inorder: ["O(n)", "O(n)", "O(n)", "O(h)"], postorder: ["O(n)", "O(n)", "O(n)", "O(h)"], levelorder: ["O(n)", "O(n)", "O(n)", "O(w)"] },
  "custom-nary": { search: ["O(1)", "O(n)", "O(n)", "O(1)"], insert: ["O(1)", "O(1)", "O(1)", "O(1)"], delete: ["O(1)", "O(n)", "O(n)", "O(h)"], preorder: ["O(n)", "O(n)", "O(n)", "O(h)"], inorder: ["O(n)", "O(n)", "O(n)", "O(h)"], postorder: ["O(n)", "O(n)", "O(n)", "O(h)"], levelorder: ["O(n)", "O(n)", "O(n)", "O(w)"] },
  bst: { search: ["O(1)", "O(log n)", "O(n)", "O(h)"], insert: ["O(1)", "O(log n)", "O(n)", "O(h)"], delete: ["O(1)", "O(log n)", "O(n)", "O(h)"], inorder: ["O(n)", "O(n)", "O(n)", "O(h)"] },
  avl: { search: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"], delete: ["O(log n)", "O(log n)", "O(log n)", "O(log n)"] },
  "heap-min": { search: ["O(1)", "O(n)", "O(n)", "O(1)"], min: ["O(1)", "O(1)", "O(1)", "O(1)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(1)"], delete: ["O(log n)", "O(log n)", "O(log n)", "O(1)"] },
  "heap-max": { search: ["O(1)", "O(n)", "O(n)", "O(1)"], max: ["O(1)", "O(1)", "O(1)", "O(1)"], insert: ["O(log n)", "O(log n)", "O(log n)", "O(1)"], delete: ["O(log n)", "O(log n)", "O(log n)", "O(1)"] },
  mway: { search: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"], insert: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"], delete: ["O(logₘ n)", "O(logₘ n)", "O(n)", "O(1)"] },
  btree: { search: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], insert: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"], delete: ["O(logₘ n)", "O(logₘ n)", "O(logₘ n)", "O(logₘ n)"] },
};

export function ComplexityCard({ kind, operation, counters, count }: { kind: TreeKind; operation: TreeOperation; counters: TreeCounters; count: number }) {
  const value = table[kind][operation];
  return <section className="panel complexity-panel">
    <div className="panel-heading"><div><span className="eyebrow">ANALYSIS</span><h2>Complexity</h2></div><span className="n-chip">n = {count}</span></div>
    {value ? <div className="complexity-grid"><div><span>Best time</span><strong>{value[0]}</strong></div><div><span>Average time</span><strong>{value[1]}</strong></div><div><span>Worst time</span><strong>{value[2]}</strong></div><div><span>Extra space</span><strong>{value[3]}</strong></div></div> : <p className="muted small-copy">Choose an operation to see its asymptotic bounds.</p>}
    <div className="counter-grid"><div><strong>{counters.comparisons}</strong><span>Comparisons</span></div><div><strong>{counters.visits}</strong><span>Node visits</span></div><div><strong>{counters.swaps}</strong><span>Swaps</span></div><div><strong>{counters.rotations}</strong><span>Rotations</span></div></div>
    <p className="footnote">Run counters describe this input. Asymptotic bounds describe growth as the tree gets larger.</p>
  </section>;
}
