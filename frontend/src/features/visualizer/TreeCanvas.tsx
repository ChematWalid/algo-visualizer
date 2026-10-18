import { useMemo } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import type { TreeNode } from "../../core/treeTypes";

function ordered(node: TreeNode): TreeNode {
  const children = node.children.map(ordered);
  if (children.every((child) => child.position !== undefined)) children.sort((a, b) => a.position! - b.position!);
  return { ...node, children };
}

export function TreeCanvas({ root, activeKey }: { root: TreeNode | null; activeKey?: string }) {
  const layout = useMemo(() => {
    if (!root) return null;
    const hierarchyRoot = hierarchy(ordered(root), (datum) => datum.children);
    const placed = tree<TreeNode>().nodeSize([96, 112])(hierarchyRoot);
    const nodes = placed.descendants();
    const links = placed.links();
    const minX = Math.min(...nodes.map((item) => item.x));
    const maxX = Math.max(...nodes.map((item) => item.x));
    return { nodes, links, minX, maxX, width: Math.max(420, maxX - minX + 160), height: Math.max(260, (placed.height + 1) * 112 + 70) };
  }, [root]);

  if (!layout) return <div className="tree-empty"><span className="empty-orbit">∅</span><strong>Your tree is empty</strong><span>Choose a structure and add a key to begin.</span></div>;
  const offset = 80 - layout.minX;
  return (
    <div className="tree-canvas-wrap">
      <svg className="tree-canvas" viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Tree visualization">
        {layout.links.map((link) => <line key={`${link.source.data.id}-${link.target.data.id}`} className="tree-edge" x1={link.source.x + offset} y1={link.source.y + 56} x2={link.target.x + offset} y2={link.target.y + 17} />)}
        {layout.nodes.map((item) => {
          const keys = item.data.keys;
          const isActive = activeKey ? keys.includes(activeKey) : false;
          return <g key={item.data.id} className={`tree-node${isActive ? " is-active" : ""}`} transform={`translate(${item.x + offset},${item.y + 18})`}>
            <rect x={-(keys.length > 1 ? keys.length * 21 : 26)} y="-22" width={keys.length > 1 ? keys.length * 42 : 52} height="44" rx="14" />
            {keys.map((key, index) => <text key={`${key}-${index}`} x={(index - (keys.length - 1) / 2) * 37} y="5">{key}</text>)}
          </g>;
        })}
      </svg>
    </div>
  );
}
