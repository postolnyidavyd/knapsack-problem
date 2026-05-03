export function generateSteps(n, W, weights, values) {
  const steps = [];
  let bestValue = 0;
  let bestMask  = 0;

  for (let m = 0; m < (1 << n); m++) {
    let totalW = 0;
    let totalV = 0;

    for (let j = 0; j < n; j++) {
      const bit = (m >> j) & 1;
      totalW += bit * weights[j];
      totalV += bit * values[j];
    }

    const valid  = totalW <= W;
    const better = valid && totalV > bestValue;

    if (better) {
      bestValue = totalV;
      bestMask  = m;
    }

    steps.push({
      m,
      totalW,
      totalV,
      valid,
      better,
      bestValue,
      bestMask,
    });
  }

  const items = [];
  for (let j = 0; j < n; j++) {
    if ((bestMask >> j) & 1) items.push(j);
  }

  return { steps, result: { bestValue, bestMask, items } };
}

export function getMaskBits(m, n) {
  return Array.from({ length: n }, (_, j) => (m >> j) & 1);
}
