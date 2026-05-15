import { hierarchy, tree as d3tree } from 'd3-hierarchy';

let _id = 0;

function buildNode(i, n, w, weights, values) {
  const id   = _id++;
  const name = `f(${i},${w})`;


  //листковий
  if (i > n || w === 0) {
    return { id, name, i, w, value: 0, reason: 'base', children: [] };
  }
  //тяжкий, скіп
  if (weights[i - 1] > w) {
    const child = buildNode(i + 1, n, w, weights, values);
    return { id, name, i, w, value: child.value, reason: 'skip-heavy', children: [child] };
  }

  //будуєм 2 ноди з обома випадками - взяли,не взяли
  const skipNode = buildNode(i + 1, n, w,                weights, values);
  const takeNode = buildNode(i + 1, n, w - weights[i-1], weights, values);
  const skip = skipNode.value;
  const take = values[i - 1] + takeNode.value;

  return {
    id, name, i, w,
    value: Math.max(skip, take),
    reason: take >= skip ? 'took' : 'skipped',
    children: [skipNode, takeNode],
  };
}

export function buildTree(n, W, weights, values) {
  _id = 0;
  return buildNode(1, n, W, weights, values);
}

// d3-hierarchy будує нам дерево
export function computeLayout(root, nodeSpacingX = 60, nodeSpacingY = 80) {
  const d3root = hierarchy(root, d => d.children.length ? d.children : null);

  const layout = d3tree()
    .nodeSize([nodeSpacingX, nodeSpacingY])
    .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.4));

  layout(d3root);

  const minX = Math.min(...d3root.descendants().map(d => d.x));
  d3root.descendants().forEach(d => { d.x -= minX; });

  // Плоский список в DFS pre-order (порядок виконання)
  const flat = d3root.descendants();

  const totalW = Math.max(...flat.map(d => d.x)) + nodeSpacingX;
  const totalH = Math.max(...flat.map(d => d.y)) + nodeSpacingY;

  return { d3root, flat, totalW, totalH };
}

// Генеруємо кроки анімації
export function generateSteps(root) {
  const steps = [];

  function dfs(node) {
    steps.push({ type: 'open',  id: node.id });
    node.children.forEach(dfs);
    steps.push({ type: 'close', id: node.id });
  }

  dfs(root);
  return steps;
}

// оптимальний шлях в самому кінці алгоритму
export function getOptimalPath(root) {
  const path = new Set();

  function walk(node) {
    path.add(node.id);
    if (!node.children.length) return;

    if (node.children.length === 1) {
      walk(node.children[0]);
    } else {
      const chosen = node.reason === 'took' ? node.children[1] : node.children[0];
      walk(chosen);
    }
  }

  walk(root);
  return path;
}
