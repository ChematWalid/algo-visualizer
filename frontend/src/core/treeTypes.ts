export type TreeKind = "custom-binary" | "custom-nary" | "bst" | "avl" | "heap-min" | "heap-max" | "mway" | "btree";

export interface TreeNode {
  id: string;
  keys: string[];
  children: TreeNode[];
  /** Binary-tree side, retained when the opposite child slot is empty. */
  position?: number;
  /** Optional editor coordinates; omitted for algorithm-generated trees. */
  x?: number;
  y?: number;
}

export interface TreeDocument {
  version: 1;
  name: string;
  kind: TreeKind;
  root: TreeNode | null;
  order: number;
  updatedAt: string;
}

export interface TreeCounters {
  comparisons: number;
  visits: number;
  swaps: number;
  rotations: number;
}

export interface TraceStep {
  title: string;
  detail: string;
  tree: TreeNode | null;
  counters: TreeCounters;
}

export type TreeOperation = "insert" | "delete" | "search" | "preorder" | "inorder" | "postorder" | "levelorder" | "min" | "max";

export const emptyCounters = (): TreeCounters => ({ comparisons: 0, visits: 0, swaps: 0, rotations: 0 });
export const makeDocument = (kind: TreeKind = "bst"): TreeDocument => ({ version: 1, name: "Untitled tree", kind, root: null, order: 3, updatedAt: new Date().toISOString() });
export const cloneNode = (node: TreeNode | null): TreeNode | null => node ? ({ ...node, keys: [...node.keys], children: node.children.map((child) => cloneNode(child)!) }) : null;
export const compareKeys = (a: string, b: string) => {
  const an = Number(a), bn = Number(b);
  return Number.isFinite(an) && Number.isFinite(bn) ? an - bn : a.localeCompare(b);
};
export const node = (key: string): TreeNode => ({ id: crypto.randomUUID(), keys: [key], children: [] });
export const binaryChild = (parent: TreeNode, side: number): TreeNode | undefined => parent.children.find((child) => child.position === side) ?? (parent.children.every((child) => child.position === undefined) ? parent.children[side] : undefined);
export const setBinaryChild = (parent: TreeNode, side: number, child: TreeNode | undefined): void => {
  parent.children = parent.children.filter((current) => current.position !== side);
  if (child) { child.position = side; parent.children.push(child); }
};

export function validateDocument(value: unknown): value is TreeDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TreeDocument>;
  const kinds: TreeKind[] = ["custom-binary", "custom-nary", "bst", "avl", "heap-min", "heap-max", "mway", "btree"];
  const validNode = (n: unknown): n is TreeNode => {
    if (!n || typeof n !== "object") return false;
    const v = n as Partial<TreeNode>;
    return typeof v.id === "string" && Array.isArray(v.keys) && v.keys.every((k) => typeof k === "string") && Array.isArray(v.children) && v.children.every(validNode);
  };
  return candidate.version === 1 && typeof candidate.name === "string" && kinds.includes(candidate.kind as TreeKind) && (candidate.root === null || validNode(candidate.root)) && Number.isInteger(candidate.order) && typeof candidate.updatedAt === "string";
}
