export function generateGreedySteps(n, W, weights, values) {
  // Питома цінність
  const ratios = Array.from({ length: n }, (_, i) => ({
    originalIdx: i,                           // 0-based індекс у вхідному масиві
    w: weights[i],
    v: values[i],
    r: values[i] / weights[i],
  }));


  const sorted = [...ratios].sort((a, b) => b.r - a.r);
  //pi - це масив який зберігає оригінальні індекси предметів в масиві, щоб збрегети звязок з оригінальним масивом
  const pi = sorted.map(item => item.originalIdx);

  const steps = [];
  let remainingW = W;
  let totalV     = 0;
  const selected = [];

  for (let j = 0; j < n; j++) {
    const idx = pi[j];      // оригінальний індекс предмету
    const canTake = weights[idx] <= remainingW;

    if (canTake) {
      selected.push(idx);
      remainingW -= weights[idx];
      totalV     += values[idx];
    }

    steps.push({
      j,
      idx,
      canTake,
      remainingW: canTake ? remainingW : remainingW,
      totalV,
      selected: [...selected],
    });
  }

  return {
    sorted,
    pi,
    steps,
    result: { totalV, selected },
  };
}
