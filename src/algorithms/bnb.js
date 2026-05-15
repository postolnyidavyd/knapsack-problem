import { hierarchy, tree as d3tree } from 'd3-hierarchy';

// Жадібна верхня оцінка (UB) для вузла
function upperBound(nodeI, nodeW, nodeV, n, sortedWeights, sortedValues) {
  let w = nodeW;
  let v = nodeV;
  for (let i = nodeI; i < n; i++) {
    if (sortedWeights[i] <= w) {
      w -= sortedWeights[i];
      v += sortedValues[i];
    } else {
      // ьеремо дробову частину
      v += sortedValues[i] * (w / sortedWeights[i]);
      break;
    }
  }
  return v;
}

export function generateBnBSteps(n, W, weights, values) {

  const sorted = Array.from({ length: n }, (_, i) => ({
    origIdx: i, w: weights[i], v: values[i], r: values[i] / weights[i],
  })).sort((a, b) => b.r - a.r);

  const sw = sorted.map(x => x.w);
  const sv = sorted.map(x => x.v);

  let bestValue = 0;
  let bestItems = [];
  let nodeIdCounter = 0;

  // дерево вузлів для візуалізації
  const treeNodes = {};
  const steps = [];

  // корінь
  const root = {
    id: nodeIdCounter++,
    parentId: null,
    decision: 'root',
    i: 0, w: W, v: 0, items: [],
    status: 'pending',
    ub: 0,
    children: [],
  };
  treeNodes[root.id] = root;

  const queue = [root];

  while (queue.length > 0) {
    const node = queue.pop();
    node.status = 'active';

    // рахуємо UB
    const ub = upperBound(node.i, node.w, node.v, n, sw, sv);
    node.ub = parseFloat(ub.toFixed(2));

    if (ub <= bestValue) {
      // відсікаємо гілку
      node.status = 'pruned';
      steps.push({
        type: 'prune',
        nodeId: node.id,
        ub: node.ub,
        bestValue,
        snapshot: buildSnapshot(treeNodes),
      });
      continue;
    }

    if (node.i >= n) {
      // листовий вузол
      node.status = 'leaf';
      if (node.v > bestValue) {
        bestValue = node.v;
        bestItems = [...node.items];
        node.status = 'best';
        steps.push({
          type: 'new-best',
          nodeId: node.id,
          bestValue,
          bestItems: [...bestItems],
          snapshot: buildSnapshot(treeNodes),
        });
      } else {
        steps.push({
          type: 'leaf',
          nodeId: node.id,
          bestValue,
          snapshot: buildSnapshot(treeNodes),
        });
      }
      continue;
    }

    // розширюємо вузол
    node.status = 'expanded';
    const childNodes = [];

    // гілка взяти якщо влізе
    if (node.w >= sw[node.i]) {
      const takeNode = {
        id: nodeIdCounter++,
        parentId: node.id,
        decision: 'take',
        i: node.i + 1,
        w: node.w - sw[node.i],
        v: node.v + sv[node.i],
        items: [...node.items, sorted[node.i].origIdx],
        status: 'pending',
        ub: 0,
        children: [],
      };
      treeNodes[takeNode.id] = takeNode;
      node.children.push(takeNode.id);
      childNodes.push(takeNode);
    }

    // гілка не брати
    const skipNode = {
      id: nodeIdCounter++,
      parentId: node.id,
      decision: 'skip',
      i: node.i + 1,
      w: node.w,
      v: node.v,
      items: [...node.items],
      status: 'pending',
      ub: 0,
      children: [],
    };
    treeNodes[skipNode.id] = skipNode;
    node.children.push(skipNode.id);
    childNodes.push(skipNode);

    steps.push({
      type: 'expand',
      nodeId: node.id,
      ub: node.ub,
      bestValue,
      newChildIds: childNodes.map(c => c.id),
      snapshot: buildSnapshot(treeNodes),
    });


    queue.push(skipNode);
    if (node.w >= sw[node.i]) queue.push(treeNodes[node.children[0]]); // takeNode
  }

  // фінальний крок
  steps.push({
    type: 'done',
    bestValue,
    bestItems,
    snapshot: buildSnapshot(treeNodes),
  });

  return { steps, treeNodes, sorted, result: { bestValue, bestItems } };
}

// Snapshot копія всіх вузлів конкретног виклику
function buildSnapshot(treeNodes) {
  const snap = {};
  Object.values(treeNodes).forEach(n => {
    snap[n.id] = {
      id: n.id, parentId: n.parentId, decision: n.decision,
      i: n.i, w: n.w, v: n.v, ub: n.ub,
      items: n.items, status: n.status, children: [...n.children],
    };
  });
  return snap;
}

// побудова через D3 для снепшотів
export function computeBnBLayout(snapshot, spacingX = 54, spacingY = 80) {
  const rootNode = Object.values(snapshot).find(n => n.parentId === null);
  if (!rootNode) return { nodes: [], links: [] };

  function buildHierarchy(node) {
    return {
      ...node,
      children: node.children
        .map(cid => snapshot[cid])
        .filter(Boolean)
        .map(buildHierarchy),
    };
  }

  const tree = buildHierarchy(rootNode);
  const d3root = hierarchy(tree, d => d.children?.length ? d.children : null);

  d3tree()
    .nodeSize([spacingX, spacingY])
    .separation((a, b) => a.parent === b.parent ? 1.1 : 1.5)(d3root);

  const minX = Math.min(...d3root.descendants().map(d => d.x));
  d3root.descendants().forEach(d => { d.x -= minX; });

  const nodes = d3root.descendants().map(d => ({ ...d.data, x: d.x, y: d.y }));
  const links = d3root.links().map(l => ({
    source: { x: l.source.x, y: l.source.y, id: l.source.data.id },
    target: { x: l.target.x, y: l.target.y, id: l.target.data.id },
  }));

  return { nodes, links };
}
