import { binaryChild, cloneNode, compareKeys, emptyCounters, node, setBinaryChild, type TraceStep, type TreeCounters, type TreeDocument, type TreeNode, type TreeOperation } from "./treeTypes";

export interface OperationResult { root: TreeNode | null; steps: TraceStep[]; result?: string; found?: boolean }
function frenchDetail(title: string, detail: string): string {
  const comparison = detail.match(/^Compare (.+) with (.+)\.$/);
  if (comparison) return `Comparer ${comparison[1]} avec ${comparison[2]}.`;
  const branch = detail.match(/^(.+) ([<≥]) (.+); continue (left|right)\.$/);
  if (branch) return `Comparer ${branch[1]} ${branch[2]} ${branch[3]} ; poursuivre à ${branch[4] === "left" ? "gauche" : "droite"}.`;
  const attach = detail.match(/^Attach (.+) as the (left|right) child\.$/);
  if (attach) return `Attacher ${attach[1]} comme fils ${attach[2] === "left" ? "gauche" : "droit"}.`;
  const key = detail.match(/(?:Place|Insert|Create) (.+?)(?: at the insertion point| in sorted order| into this node in sorted order| in the leaf in sorted order| in the next open position| as a new root\.)/);
  if (key) return `${title === "Create node" || title === "Create root" ? "Créer un nœud avec" : "Insérer"} ${key[1]} à sa position correcte.`;
  if (detail.startsWith("Visit order:")) return `Ordre de visite :${detail.slice("Visit order:".length)}`;
  if (detail.includes("already present")) return `${detail.split(" is already present")[0]} est déjà présent ; les clés dupliquées ne sont pas admises ici.`;
  if (detail.includes("Rotate right")) return "Effectuer une rotation droite pour rétablir l’équilibre AVL.";
  if (detail.includes("Rotate left")) return "Effectuer une rotation gauche pour rétablir l’équilibre AVL.";
  if (detail.includes("Promote")) return detail.replace("Promote", "Promouvoir").replace("and split the full child into two nodes.", "et diviser le nœud plein en deux.").replace("to a new root.", "dans une nouvelle racine.").replace("the overflowing node becomes two ordered children.", "le nœud débordant devient deux fils ordonnés.");
  if (detail.includes("Borrow from")) return "Emprunter une clé au frère et faire passer le séparateur par le parent.";
  if (detail.includes("Merge")) return "Fusionner les nœuds concernés et rétablir les contraintes d’occupation.";
  if (detail.includes("Remove")) return detail.replace("Remove", "Supprimer").replace("from its leaf node.", "de sa feuille.").replace("if it exists.", "si elle existe.");
  if (detail.includes("root contains")) return detail.replace("The root contains", "La racine contient");
  if (detail.includes("heap order")) return detail.replace("Swap", "Échanger").replace("with", "avec").replace("to restore heap order.", "pour rétablir la propriété du tas.");
  if (detail.includes("minimum")) return detail.replace("The minimum key is", "La clé minimale est");
  if (detail.includes("maximum")) return detail.replace("The maximum key is", "La clé maximale est");
  return "Étape de l’algorithme : observer la structure mise en évidence.";
}
const snapshot = (title: string, detail: string, root: TreeNode | null, counters: TreeCounters): TraceStep => ({ title, detail, detailFr: frenchDetail(title, detail), tree: cloneNode(root), counters: { ...counters } });
const count = (root: TreeNode | null): number => root ? root.keys.length + root.children.reduce((sum, child) => sum + count(child), 0) : 0;

function rotateLeft(root: TreeNode): TreeNode {
  const pivot = binaryChild(root, 1);
  if (!pivot) return root;
  setBinaryChild(root, 1, binaryChild(pivot, 0));
  setBinaryChild(pivot, 0, root);
  return pivot;
}
function rotateRight(root: TreeNode): TreeNode {
  const pivot = binaryChild(root, 0);
  if (!pivot) return root;
  setBinaryChild(root, 0, binaryChild(pivot, 1));
  setBinaryChild(pivot, 1, root);
  return pivot;
}
function height(n: TreeNode | undefined): number { return n ? 1 + Math.max(height(binaryChild(n, 0)), height(binaryChild(n, 1))) : 0; }
function rebalance(n: TreeNode, steps: TraceStep[], counters: TreeCounters): TreeNode {
  const left = binaryChild(n, 0), right = binaryChild(n, 1);
  const balance = height(left) - height(right);
  if (balance > 1) {
    if (height(binaryChild(left!, 0)) < height(binaryChild(left!, 1))) {
      setBinaryChild(n, 0, rotateLeft(left!)); counters.rotations++; steps.push(snapshot("Left rotation", "Rotate the left child before balancing this node (LR case).", n, counters));
    }
    const result = rotateRight(n); counters.rotations++; steps.push(snapshot("Right rotation", "Rotate right to restore the AVL height condition.", result, counters)); return result;
  }
  if (balance < -1) {
    if (height(binaryChild(right!, 1)) < height(binaryChild(right!, 0))) {
      setBinaryChild(n, 1, rotateRight(right!)); counters.rotations++; steps.push(snapshot("Right rotation", "Rotate the right child before balancing this node (RL case).", n, counters));
    }
    const result = rotateLeft(n); counters.rotations++; steps.push(snapshot("Left rotation", "Rotate left to restore the AVL height condition.", result, counters)); return result;
  }
  return n;
}
function insertBinary(root: TreeNode | null, key: string, kind: TreeDocument["kind"], steps: TraceStep[], counters: TreeCounters): TreeNode {
  if (!root) { const created = node(key); steps.push(snapshot("Create node", `Place ${key} at the insertion point.`, created, counters)); return created; }
  counters.visits++;
  if (kind.startsWith("heap-")) return root;
  counters.comparisons++;
  const comparison = compareKeys(key, root.keys[0]!);
  if (kind === "avl" && comparison === 0) { steps.push(snapshot("Duplicate key", `${key} is already present; AVL trees use unique keys here.`, root, counters)); return root; }
  const goesLeft = comparison < 0;
  const side = goesLeft ? 0 : 1;
  steps.push(snapshot("Compare", `${key} ${goesLeft ? "<" : "≥"} ${root.keys[0]}; continue ${goesLeft ? "left" : "right"}.`, root, counters));
  const existing = binaryChild(root, side);
  if (existing) setBinaryChild(root, side, insertBinary(existing, key, kind, steps, counters));
  else { const created = node(key); setBinaryChild(root, side, created); steps.push(snapshot("Insert", `Attach ${key} as the ${goesLeft ? "left" : "right"} child.`, root, counters)); }
  return kind === "avl" ? rebalance(root, steps, counters) : root;
}
function siftDownArray(values: string[], start: number, min: boolean, counters: TreeCounters, onSwap?: (values: string[]) => void): void {
  let index = start;
  while (index * 2 + 1 < values.length) {
    let child = index * 2 + 1; const right = child + 1;
    if (right < values.length) { counters.comparisons++; if ((compareKeys(values[right]!, values[child]!) < 0) === min) child = right; }
    counters.comparisons++;
    if ((compareKeys(values[child]!, values[index]!) < 0) !== min) break;
    [values[index], values[child]] = [values[child]!, values[index]!]; counters.swaps++; onSwap?.(values); index = child;
  }
}
function buildHeap(values: string[], min: boolean, steps: TraceStep[], counters: TreeCounters): TreeNode | null {
  for (let index = Math.floor(values.length / 2) - 1; index >= 0; index--) siftDownArray(values, index, min, counters, (current) => steps.push(snapshot("Sift down", `Swap a parent with its higher-priority child.`, heapFromArray(current), counters)));
  const root = heapFromArray(values); steps.push(snapshot("Build heap", "Arrange all values into a complete tree and restore heap order bottom-up.", root, counters)); return root;
}
function insertHeapValues(root: TreeNode | null, newValues: string[], min: boolean, steps: TraceStep[], counters: TreeCounters): TreeNode | null {
  const values = root ? flattenBreadthFirst(root).map((item) => item.keys[0]!) : [];
  for (const key of newValues) {
    values.push(key); let index = values.length - 1;
    steps.push(snapshot("Add to heap", `Place ${key} in the next open position.`, heapFromArray(values), counters));
    while (index > 0) { const parent = Math.floor((index - 1) / 2); counters.comparisons++; if ((compareKeys(values[index]!, values[parent]!) < 0) !== min) break; [values[index], values[parent]] = [values[parent]!, values[index]!]; counters.swaps++; steps.push(snapshot("Sift up", `Swap ${values[parent]} with its parent to restore heap order.`, heapFromArray(values), counters)); index = parent; }
  }
  return heapFromArray(values);
}
function heapFromArray(values: string[]): TreeNode | null {
  if (!values.length) return null;
  const nodes = values.map((value) => node(value));
  for (let index = 1; index < nodes.length; index++) setBinaryChild(nodes[Math.floor((index - 1) / 2)]!, (index % 2) as 0 | 1, nodes[index]!);
  return nodes[0]!;
}
function flattenBreadthFirst(root: TreeNode): TreeNode[] { const result: TreeNode[] = [], queue = [root]; while (queue.length) { const current = queue.shift()!; result.push(current); queue.push(...current.children); } return result; }

function insertMway(root: TreeNode | null, key: string, order: number, steps: TraceStep[], counters: TreeCounters): TreeNode {
  if (!root) { const created = node(key); steps.push(snapshot("Create root", `Create the first node with key ${key}.`, created, counters)); return created; }
  let current = root;
  while (true) {
    counters.visits++;
    const existingIndex = current.keys.findIndex((item) => compareKeys(item, key) === 0);
    counters.comparisons += current.keys.length;
    if (existingIndex >= 0) { steps.push(snapshot("Duplicate key", `${key} is already present; multiway search trees use unique keys here.`, root, counters)); return root; }
    let childIndex = current.keys.findIndex((item) => compareKeys(key, item) < 0);
    if (childIndex < 0) childIndex = current.keys.length;
    if (current.keys.length < order - 1 && current.children.length === 0) {
      current.keys.push(key); current.keys.sort(compareKeys);
      steps.push(snapshot("Insert in node", `Insert ${key} into this node in sorted order.`, root, counters)); return root;
    }
    let child = current.children.find((item) => item.position === childIndex);
    if (!child && current.keys.length < order - 1 && current.children.length === 0) {
      current.keys.splice(childIndex, 0, key); steps.push(snapshot("Insert in node", `Insert ${key} into this node in sorted order.`, root, counters)); return root;
    }
    if (!child) { child = node(key); child.position = childIndex; current.children.push(child); current.children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); steps.push(snapshot("Create child", `Create child ${childIndex + 1} for ${key}.`, root, counters)); return root; }
    current = child;
  }
}

function insertBtree(root: TreeNode | null, key: string, order: number, steps: TraceStep[], counters: TreeCounters): TreeNode {
  const maxKeys = order - 1;
  if (!root) { const created = node(key); steps.push(snapshot("Create root", `Create a B-tree root containing ${key}.`, created, counters)); return created; }
  const contains = (n: TreeNode): boolean => {
    let i = 0; while (i < n.keys.length && compareKeys(key, n.keys[i]!) > 0) { counters.comparisons++; i++; }
    if (n.keys[i] !== undefined && compareKeys(n.keys[i]!, key) === 0) return true;
    return n.children[i] ? contains(n.children[i]!) : false;
  };
  if (contains(root)) { steps.push(snapshot("Duplicate key", `${key} is already present; B-tree keys are unique here.`, root, counters)); return root; }
  type Split = { promoted?: string; right?: TreeNode };
  const insertInto = (current: TreeNode, value: string): Split => {
    let index = 0;
    while (index < current.keys.length && compareKeys(value, current.keys[index]!) > 0) { counters.comparisons++; index++; }
    if (!current.children.length) {
      current.keys.splice(index, 0, value);
      steps.push(snapshot("Insert in leaf", `Insert ${value} in sorted order; split if this node exceeds ${maxKeys} keys.`, root, counters));
    } else {
      const split = insertInto(current.children[index]!, value);
      if (split.promoted) { current.keys.splice(index, 0, split.promoted); current.children.splice(index + 1, 0, split.right!); }
    }
    if (current.keys.length <= maxKeys) return {};
    const medianIndex = Math.floor(current.keys.length / 2), promoted = current.keys[medianIndex]!;
    const right = node(""); right.keys = current.keys.slice(medianIndex + 1); right.children = current.children.slice(medianIndex + 1);
    current.keys = current.keys.slice(0, medianIndex); current.children = current.children.slice(0, medianIndex + 1);
    counters.swaps++; steps.push(snapshot("Split node", `Promote ${promoted}; the overflowing node becomes two ordered children.`, root, counters));
    return { promoted, right };
  };
  const split = insertInto(root, key);
  if (split.promoted) { const nextRoot = node(""); nextRoot.keys = [split.promoted]; nextRoot.children = [root, split.right!]; steps.push(snapshot("Grow root", `Create a new root with promoted key ${split.promoted}.`, nextRoot, counters)); return nextRoot; }
  return root;
}

function removeMway(root: TreeNode | null, key: string, steps: TraceStep[], counters: TreeCounters): TreeNode | null {
  if (!root) return null;
  let index = root.keys.findIndex((value) => compareKeys(key, value) <= 0);
  if (index < 0) index = root.keys.length;
  counters.visits++;
  const foundIndex = root.keys.findIndex((value) => { counters.comparisons++; return compareKeys(value, key) === 0; });
  if (foundIndex >= 0) {
    if (root.children.length) {
      const successorIndex = root.children.findIndex((child) => child.position === foundIndex + 1);
      const predecessorIndex = root.children.findIndex((child) => child.position === foundIndex);
      let replacementIndex = successorIndex, useSuccessor = successorIndex >= 0;
      if (replacementIndex < 0) replacementIndex = predecessorIndex;
      let replacementNode = replacementIndex >= 0 ? root.children[replacementIndex] : undefined;
      while (replacementNode?.children.length) {
        const nextPosition = useSuccessor ? 0 : replacementNode.keys.length;
        const boundaryChild = replacementNode.children.find((child) => child.position === nextPosition);
        if (!boundaryChild) break;
        replacementNode = boundaryChild;
      }
      const replacement = useSuccessor ? replacementNode?.keys[0] : replacementNode?.keys.at(-1);
      if (replacement && replacementIndex >= 0) {
        root.keys[foundIndex] = replacement;
        const next = removeMway(root.children[replacementIndex]!, replacement, steps, counters);
        if (next) root.children[replacementIndex] = next; else root.children.splice(replacementIndex, 1);
        steps.push(snapshot(useSuccessor ? "Replace with successor" : "Replace with predecessor", `Replace ${key} with its inorder ${useSuccessor ? "successor" : "predecessor"} ${replacement}.`, root, counters)); return root;
      }
    }
    root.keys.splice(foundIndex, 1); steps.push(snapshot("Remove key", `Remove ${key} from its M-way search node.`, root, counters));
    root.children.forEach((child) => { if (child.position !== undefined && child.position > foundIndex + 1) child.position = child.position - 1; });
    if (!root.keys.length) return root.children[0] ?? null;
    return root;
  }
  const childIndex = root.children.findIndex((child) => child.position === index);
  if (childIndex < 0) return root;
  const child = root.children[childIndex]!; const next = removeMway(child, key, steps, counters);
  if (next) root.children[childIndex] = next; else root.children.splice(childIndex, 1);
  return root;
}

function removeBtree(root: TreeNode | null, key: string, order: number, steps: TraceStep[], counters: TreeCounters): TreeNode | null {
  if (!root) return null;
  const minimum = Math.floor(order / 2);
  const remove = (current: TreeNode, value: string): void => {
    let index = 0;
    while (index < current.keys.length && compareKeys(current.keys[index]!, value) < 0) { counters.comparisons++; index++; }
    const found = current.keys[index] === value;
    if (found && !current.children.length) {
      current.keys.splice(index, 1); steps.push(snapshot("Remove from leaf", `Remove ${value} from its leaf node.`, root, counters)); return;
    }
    if (found) {
      const left = current.children[index]!, right = current.children[index + 1]!;
      if (left.keys.length > minimum) {
        let predecessor = left; while (predecessor.children.length) predecessor = predecessor.children.at(-1)!;
        const replacement = predecessor.keys.at(-1)!; current.keys[index] = replacement; remove(left, replacement);
        steps.push(snapshot("Replace with predecessor", `Replace ${value} with predecessor ${replacement}.`, root, counters)); return;
      }
      if (right.keys.length > minimum) {
        let successor = right; while (successor.children.length) successor = successor.children[0]!;
        const replacement = successor.keys[0]!; current.keys[index] = replacement; remove(right, replacement);
        steps.push(snapshot("Replace with successor", `Replace ${value} with successor ${replacement}.`, root, counters)); return;
      }
      const merged = node(""); merged.keys = [...left.keys, value, ...right.keys]; merged.children = [...left.children, ...right.children];
      current.keys.splice(index, 1); current.children.splice(index, 2, merged);
      steps.push(snapshot("Merge children", `Merge both children around ${value}, then remove the key from the merged node.`, root, counters));
      const targetIndex = merged.keys.indexOf(value); if (targetIndex >= 0) merged.keys.splice(targetIndex, 1);
      return;
    }
    if (!current.children.length) return;
    let child = current.children[index]!;
    remove(child, value);
    if (child.keys.length >= minimum) return;
    const left = index > 0 ? current.children[index - 1] : undefined;
    const right = current.children[index + 1];
    if (left && left.keys.length > minimum) {
      child.keys.unshift(current.keys[index - 1]!); current.keys[index - 1] = left.keys.pop()!;
      if (left.children.length) child.children.unshift(left.children.pop()!);
      counters.swaps++; steps.push(snapshot("Borrow from left", "Rotate a separator key from the left sibling through the parent.", root, counters)); return;
    }
    if (right && right.keys.length > minimum) {
      child.keys.push(current.keys[index]!); current.keys[index] = right.keys.shift()!;
      if (right.children.length) child.children.push(right.children.shift()!);
      counters.swaps++; steps.push(snapshot("Borrow from right", "Rotate a separator key from the right sibling through the parent.", root, counters)); return;
    }
    if (right) {
      child.keys.push(current.keys[index]!, ...right.keys); child.children.push(...right.children);
      current.keys.splice(index, 1); current.children.splice(index, 2, child);
    } else if (left) {
      left.keys.push(current.keys[index - 1]!, ...child.keys); left.children.push(...child.children);
      current.keys.splice(index - 1, 1); current.children.splice(index - 1, 2, left); child = left;
    }
    steps.push(snapshot("Merge siblings", "Merge the underfull child with a sibling and pull down their separator.", root, counters));
  };
  remove(root, key);
  if (!root.keys.length) return root.children[0] ?? null;
  return root;
}

function rebalanceAvlAfterDelete(root: TreeNode | null, steps: TraceStep[], counters: TreeCounters): TreeNode | null {
  if (!root) return null;
  const left = binaryChild(root, 0), right = binaryChild(root, 1);
  if (left) setBinaryChild(root, 0, rebalanceAvlAfterDelete(left, steps, counters) ?? undefined);
  if (right) setBinaryChild(root, 1, rebalanceAvlAfterDelete(right, steps, counters) ?? undefined);
  return rebalance(root, steps, counters);
}

function searchMulti(root: TreeNode | null, key: string, steps: TraceStep[], counters: TreeCounters): boolean {
  if (!root) return false;
  counters.visits++;
  let childIndex = 0;
  while (childIndex < root.keys.length) {
    counters.comparisons++; const cmp = compareKeys(key, root.keys[childIndex]!);
    steps.push(snapshot("Compare key", `Compare ${key} with ${root.keys[childIndex]}.`, root, counters));
    if (cmp === 0) return true;
    if (cmp < 0) break;
    childIndex++;
  }
  const child = root.children.find((item) => item.position === childIndex) ?? root.children[childIndex];
  return child ? searchMulti(child, key, steps, counters) : false;
}

function search(root: TreeNode | null, key: string, ordered: boolean, steps: TraceStep[], counters: TreeCounters): boolean {
  if (!root) return false;
  counters.visits++;
  for (const current of root.keys) { counters.comparisons++; const cmp = compareKeys(key, current); steps.push(snapshot("Compare", `Compare ${key} with ${current}.`, root, counters)); if (cmp === 0) return true; if (ordered && cmp < 0) return root.children.length ? search(binaryChild(root, 0) ?? root.children[0]!, key, true, steps, counters) : false; }
  if (ordered && root.children.length) return search(binaryChild(root, 1) ?? root.children[1]!, key, true, steps, counters);
  for (const child of root.children) if (search(child, key, false, steps, counters)) return true;
  return false;
}
function traverse(root: TreeNode | null, type: TreeOperation, steps: TraceStep[], counters: TreeCounters): string[] {
  const result: string[] = [];
  const visit = (n: TreeNode) => {
    counters.visits++;
    if (type === "preorder") result.push(...n.keys);
    if (type === "inorder" && n.children.length > 2 && n.keys.length === 1) { visit(n.children[0]!); result.push(n.keys[0]!); n.children.slice(1).forEach(visit); }
    else if (type === "inorder" && n.children.length) { n.keys.forEach((key, index) => { const child = n.children.find((item) => item.position === index) ?? (n.children.every((item) => item.position === undefined) ? n.children[index] : undefined); if (child) visit(child); result.push(key); }); const last = n.children.find((item) => item.position === n.keys.length) ?? (n.children.every((item) => item.position === undefined) ? n.children[n.keys.length] : undefined); if (last) visit(last); }
    else if (type === "inorder") result.push(...n.keys);
    else if (type === "postorder") { n.children.forEach(visit); result.push(...n.keys); }
    else if (type === "preorder") n.children.forEach(visit);
  };
  if (type === "levelorder") { const queue = root ? [root] : []; while (queue.length) { const current = queue.shift()!; counters.visits++; result.push(...current.keys); queue.push(...current.children); } }
  else if (root) visit(root);
  steps.push(snapshot(`Run ${type}`, `Visit order: ${result.join(", ") || "empty tree"}.`, root, counters));
  return result;
}

export function runOperation(doc: TreeDocument, operation: TreeOperation, input = ""): OperationResult {
  const root = cloneNode(doc.root); const steps: TraceStep[] = []; const counters = emptyCounters();
  if (operation.startsWith("pre") || operation === "inorder" || operation === "postorder" || operation === "levelorder") return { root, steps: [snapshot("Start traversal", `Traverse all ${count(root)} keys.`, root, counters)], result: traverse(root, operation, steps, counters).join(", ") };
  if (operation === "search") { const found = doc.kind === "mway" || doc.kind === "btree" ? searchMulti(root, input.trim(), steps, counters) : search(root, input.trim(), doc.kind === "bst" || doc.kind === "avl", steps, counters); return { root, found, result: found ? `${input} was found.` : `${input} was not found.`, steps: steps.length ? steps : [snapshot("Empty tree", "There are no nodes to inspect.", root, counters)] }; }
  if (operation === "insert") {
    const values = input.split(/[\s,;]+/).filter(Boolean);
      if (doc.kind.startsWith("heap-")) return { root: insertHeapValues(root, values, doc.kind === "heap-min", steps, counters), steps };
    let current = root;
    for (const key of values) {
      if (doc.kind === "custom-binary" || doc.kind === "custom-nary") { if (!current) current = node(key); else current.children.push(node(key)); steps.push(snapshot("Add node", `Add ${key} to the selected tree.`, current, counters)); }
      else if (doc.kind === "mway") current = insertMway(current, key, doc.order, steps, counters);
      else if (doc.kind === "btree") current = insertBtree(current, key, doc.order, steps, counters);
      else current = insertBinary(current, key, doc.kind, steps, counters);
    }
    return { root: current, steps };
  }
  if (operation === "delete") {
    const target = input.trim();
    if (doc.kind.startsWith("heap-")) {
      const values = root ? flattenBreadthFirst(root).map((item) => item.keys[0]!) : [];
      const index = values.indexOf(target);
      if (index >= 0) values.splice(index, 1);
      steps.push(snapshot("Remove heap key", index < 0 ? `${target} was not found in the heap.` : `Remove ${target}; rebuild the complete shape and restore heap order.`, root, counters));
      const next = buildHeap(values, doc.kind === "heap-min", steps, counters);
      return { root: next, result: index < 0 ? `${target} was not found.` : undefined, steps };
    }
    if (doc.kind === "mway") { const next = removeMway(root, target, steps, counters); return { root: next, steps: steps.length ? steps : [snapshot("Key not found", `${target} is not in this tree.`, root, counters)] }; }
    if (doc.kind === "btree") { const next = removeBtree(root, target, doc.order, steps, counters); return { root: next, steps: steps.length ? steps : [snapshot("Key not found", `${target} is not in this tree.`, root, counters)] }; }
    const remove = (n: TreeNode | null): TreeNode | null => {
      if (!n) return null; counters.visits++; counters.comparisons++;
      const cmp = compareKeys(target, n.keys[0]!);
      if (cmp < 0 && !doc.kind.startsWith("heap-") && doc.kind !== "custom-binary" && doc.kind !== "custom-nary") { const child = binaryChild(n, 0); if (child) setBinaryChild(n, 0, remove(child) ?? undefined); return n; }
      if (cmp > 0 && !doc.kind.startsWith("heap-") && doc.kind !== "custom-binary" && doc.kind !== "custom-nary") { const child = binaryChild(n, 1); if (child) setBinaryChild(n, 1, remove(child) ?? undefined); return n; }
      if (n.keys.includes(target)) {
        const left = binaryChild(n, 0), right = binaryChild(n, 1);
        if (left && right) { let successor = right; while (binaryChild(successor, 0)) successor = binaryChild(successor, 0)!; n.keys[0] = successor.keys[0]!; setBinaryChild(n, 1, remove(right) ?? undefined); return n; }
        if (left || right) return left ?? right ?? null;
        return null;
      }
      n.children = n.children.map((child) => remove(child)).filter((child): child is TreeNode => Boolean(child)); return n;
    };
    let next = remove(root);
    if (doc.kind === "avl") next = rebalanceAvlAfterDelete(next, steps, counters);
    steps.push(snapshot("Remove key", `Remove ${target} if it exists.`, next, counters)); return { root: next, steps };
  }
  if (operation === "extract-root" && doc.kind.startsWith("heap-")) {
    const values = root ? flattenBreadthFirst(root).map((item) => item.keys[0]!) : [];
    const removed = values.shift();
    if (!values.length) return { root: null, result: removed ?? "Tree is empty.", steps: [snapshot("Extract root", removed ? `Remove root key ${removed}; the heap is now empty.` : "Tree is empty.", null, counters)] };
    let index = 0; const min = doc.kind === "heap-min";
    while (index * 2 + 1 < values.length) {
      let child = index * 2 + 1; const right = child + 1;
      if (right < values.length && ((compareKeys(values[right]!, values[child]!) < 0) === min)) { counters.comparisons++; child = right; }
      counters.comparisons++;
      if (((compareKeys(values[child]!, values[index]!) < 0) !== min)) break;
      [values[index], values[child]] = [values[child]!, values[index]!]; counters.swaps++;
      const frame = heapFromArray(values); steps.push(snapshot("Sift down", `Swap ${values[index]} with its higher-priority child.`, frame, counters)); index = child;
    }
    const next = heapFromArray(values); steps.unshift(snapshot("Extract root", `Remove root key ${removed}; move the final key to the root, then restore heap order.`, root, counters));
    steps.push(snapshot("Heap restored", "The remaining keys still satisfy heap order.", next, counters));
    return { root: next, result: `Extracted ${removed}.`, steps };
  }
  if (operation === "min" || operation === "max") {
    if (!root) return { root, result: "Tree is empty.", steps: [snapshot(operation === "min" ? "Minimum" : "Maximum", "Tree is empty.", root, counters)] };
    if (doc.kind.startsWith("heap-")) { const value = root.keys[0]; return { root, result: value, steps: [snapshot(operation === "min" ? "Minimum" : "Maximum", `The root contains ${value}.`, root, counters)] }; }
    if (doc.kind === "bst" || doc.kind === "avl") {
      let current = root; const side = operation === "min" ? 0 : 1;
      while (binaryChild(current, side)) { counters.visits++; counters.comparisons++; current = binaryChild(current, side)!; steps.push(snapshot(operation === "min" ? "Move left" : "Move right", `Follow the ${operation === "min" ? "left" : "right"} child to keep looking for the ${operation}imum.`, current, counters)); }
      return { root, result: current.keys[0], steps: [...steps, snapshot(operation === "min" ? "Minimum" : "Maximum", `The ${operation === "min" ? "minimum" : "maximum"} key is ${current.keys[0]}.`, current, counters)] };
    }
    if (doc.kind === "btree" || doc.kind === "mway") {
      let current = root;
      while (true) {
        const side = operation === "min" ? 0 : current.keys.length;
        const child = doc.kind === "btree" ? current.children[side === 0 ? 0 : current.children.length - 1] : current.children.find((item) => item.position === side);
        if (!child) { const value = current.keys[operation === "min" ? 0 : current.keys.length - 1]; return { root, result: value, steps: [...steps, snapshot(operation === "min" ? "Minimum" : "Maximum", `The ${operation === "min" ? "minimum" : "maximum"} key is ${value}.`, current, counters)] }; }
        counters.visits++; current = child; steps.push(snapshot(operation === "min" ? "Move to first child" : "Move to last child", `Follow the ${operation === "min" ? "first" : "last"} search interval.`, current, counters));
      }
    }
    let value: string | undefined;
    const scan = (current: TreeNode) => { counters.visits++; for (const item of current.keys) { counters.comparisons++; if (value === undefined || (operation === "min" ? compareKeys(item, value) < 0 : compareKeys(item, value) > 0)) value = item; } current.children.forEach(scan); };
    scan(root);
    return { root, result: value ?? "Tree is empty.", steps: [snapshot(operation === "min" ? "Minimum" : "Maximum", `The ${operation === "min" ? "minimum" : "maximum"} key is ${value}.`, root, counters)] };
  }
  return { root, steps };
}

export function buildFromArray(doc: TreeDocument, values: string[]): TreeDocument {
  if (doc.kind.startsWith("heap-")) return { ...doc, root: buildHeap(values, doc.kind === "heap-min", [], emptyCounters()) };
  let next = { ...doc, root: null as TreeNode | null };
  for (const value of values) next.root = runOperation({ ...next, kind: doc.kind }, "insert", value).root;
  return next;
}

export function reconstructBinary(first: string[], second: string[], mode: "preorder" | "postorder"): TreeNode | null {
  if (first.length !== second.length || new Set(first).size !== first.length || new Set(second).size !== second.length || first.some((v) => !second.includes(v))) throw new Error("Traversals must contain the same unique labels.");
  if (!first.length) return null;
  const inorder = new Set(second); let cursor = mode === "preorder" ? 0 : first.length - 1;
  const build = (low: number, high: number): TreeNode | null => {
    if (low > high) return null;
    const key = first[cursor]!; cursor += mode === "preorder" ? 1 : -1;
    const nodeAt = [...inorder].indexOf(key);
    // The index is scoped by this recursion range, not by a mutable global map.
    const split = second.indexOf(key);
    if (split < low || split > high || nodeAt < 0) throw new Error("These traversals are inconsistent.");
    const result = node(key);
    if (mode === "preorder") { const left = build(low, split - 1), right = build(split + 1, high); if (left) setBinaryChild(result, 0, left); if (right) setBinaryChild(result, 1, right); }
    else { const right = build(split + 1, high), left = build(low, split - 1); if (left) setBinaryChild(result, 0, left); if (right) setBinaryChild(result, 1, right); }
    return result;
  };
  return build(0, second.length - 1);
}
