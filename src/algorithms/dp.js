
export function generateDPSteps(n, W, weights, values) {
  // Ініціалізація dp[0..n][0..W] = 0
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  const fillSteps = [];

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      const canTake = weights[i - 1] <= w;
      let val;

      if (!canTake) {
        val = dp[i - 1][w];
      } else {
        const skip = dp[i - 1][w];
        const take = dp[i - 1][w - weights[i - 1]] + values[i - 1];
        val = Math.max(skip, take);
      }

      dp[i][w] = val;

      fillSteps.push({
        i, w,
        val,
        canTake,
        // Знімок таблиці щоб анімувати поступове заповнення
        snapshot: dp.map(row => [...row]),
      });
    }
  }

  // Відновлення предметів
  const recoverySteps = [];
  const items = [];
  let ri = n, rw = W;

  while (ri > 0) {
    const took = dp[ri][rw] !== dp[ri - 1][rw];
    recoverySteps.push({ i: ri, w: rw, took });
    if (took) {
      items.push(ri);
      rw -= weights[ri - 1];
    }
    ri -= 1;
  }

  return {
    dp,
    fillSteps,
    recoverySteps,
    result: {
      value: dp[n][W],
      items: items.reverse(),
    },
  };
}
