import { useCallback, useMemo, useState } from "react";
import { Background, Controls, ReactFlow, type Connection, type Edge, type Node, type NodeChange, type EdgeChange, type NodeMouseHandler } from "@xyflow/react";
import { TextInput } from "@mantine/core";
import { hierarchy, tree } from "d3-hierarchy";
import type { TreeNode } from "../../core/treeTypes";
import { node as createNode } from "../../core/treeTypes";
import "@xyflow/react/dist/style.css";

interface Props { root: TreeNode | null; kind: "custom-binary" | "custom-nary"; onChange: (root: TreeNode | null) => void; }
function flatten(root: TreeNode | null): { nodes: Node[]; edges: Edge[] } {
  if (!root) return { nodes: [], edges: [] };
  const laid = tree<TreeNode>().nodeSize([145, 120])(hierarchy(root, (item) => item.children));
  return { nodes: laid.descendants().map((item) => ({ id: item.data.id, position: { x: item.data.x ?? item.x + 600, y: item.data.y ?? item.y + 90 }, data: { label: item.data.keys.join(" · ") }, type: "default" })), edges: laid.links().map((link) => ({ id: `${link.source.data.id}-${link.target.data.id}`, source: link.source.data.id, target: link.target.data.id, type: "smoothstep" })) };
}
function removeNode(root: TreeNode | null, id: string): TreeNode | null {
  if (!root || root.id === id) return null;
  return { ...root, children: root.children.map((item) => removeNode(item, id)).filter((item): item is TreeNode => Boolean(item)) };
}
function attach(root: TreeNode | null, parentId: string, child: TreeNode): TreeNode | null {
  if (!root) return root;
  if (root.id === parentId) return { ...root, children: [...root.children, child] };
  return { ...root, children: root.children.map((item) => attach(item, parentId, child)!) };
}
function find(root: TreeNode | null, id: string): TreeNode | undefined { if (!root) return; if (root.id === id) return root; for (const child of root.children) { const found = find(child, id); if (found) return found; } }
function renameNode(root: TreeNode | null, id: string, value: string): TreeNode | null { if (!root) return null; if (root.id === id) return { ...root, keys: [value] }; return { ...root, children: root.children.map((child) => renameNode(child, id, value)!).filter(Boolean) }; }

export function FreeformEditor({ root, kind, onChange }: Props) {
  const [selectedId, setSelectedId] = useState(root?.id ?? "");
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => flatten(root), [root]);
  const selected = find(root, selectedId);
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const removed = changes.filter((change) => change.type === "remove").map((change) => change.id);
    if (removed.length) { let next = root; for (const id of removed) next = removeNode(next, id); onChange(next); if (removed.includes(selectedId)) setSelectedId(""); return; }
    const positions = new Map(changes.filter((change): change is Extract<NodeChange, { type: "position" }> => change.type === "position" && Boolean(change.position)).map((change) => [change.id, change.position!]));
    if (positions.size) onChange(mapNodes(root, (item) => ({ x: positions.get(item.id)?.x ?? item.x ?? 0, y: positions.get(item.id)?.y ?? item.y ?? 0 })));
  }, [onChange, root, selectedId]);
  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {}, []);
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const moving = find(root, connection.source);
    if (!moving || find(moving, connection.target)) return;
    const detached = removeNode(root, connection.source);
    onChange(attach(detached, connection.target, moving)); setSelectedId(connection.source);
  }, [onChange, root]);
  const addRoot = () => { if (!root) onChange(createNode("Root")); };
  const addChild = () => { if (!selected) return; const created = createNode("Node"); onChange(attach(root, selected.id, created)); setSelectedId(created.id); };
  const onNodeClick: NodeMouseHandler = useCallback((_event, item) => setSelectedId(item.id), []);
  return <div className="freeform-editor">
    <div className="editor-actions"><button onClick={addRoot} disabled={Boolean(root)}>Add root</button><button onClick={addChild} disabled={!selected || (kind === "custom-binary" && selected.children.length >= 2)}>Add child</button>{selected && <TextInput aria-label="Selected node label" size="xs" value={selected.keys[0] ?? ""} onChange={(event) => onChange(renameNode(root, selected.id, event.currentTarget.value))} />}{selected && <button onClick={() => { onChange(removeNode(root, selected.id)); setSelectedId(""); }}>Delete node</button>}<span>Drag nodes · connect handles to reparent</span></div>
    <ReactFlow nodes={initialNodes} edges={initialEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} fitView nodesDraggable nodesConnectable>
      <Background color="#30372e" gap={22} /><Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
function mapNodes(root: TreeNode | null, lookup: (item: TreeNode) => { x: number; y: number }): TreeNode | null {
  if (!root) return null;
  return { ...root, ...lookup(root), children: root.children.map((child) => mapNodes(child, lookup)!).filter(Boolean) };
}
