import { createContext, useContext, useState } from 'react';
import { DEFAULT_N, DEFAULT_W, DEFAULT_WEIGHTS, DEFAULT_VALUES } from '../consts/knapsack.js';

const KnapsackContext = createContext(null);

export function KnapsackProvider({ children }) {
  const [n, setN]           = useState(DEFAULT_N);
  const [W, setW]           = useState(DEFAULT_W);
  const [weights, setWeights] = useState([...DEFAULT_WEIGHTS]);
  const [values,  setValues]  = useState([...DEFAULT_VALUES]);

  function updateWeight(i, val) {
    setWeights(prev => { const next = [...prev]; next[i] = val; return next; });
  }

  function updateValue(i, val) {
    setValues(prev => { const next = [...prev]; next[i] = val; return next; });
  }

  function updateN(newN) {
    setN(newN);
    setWeights(prev => {
      const next = [...prev];
      while (next.length < newN) next.push(1);
      return next.slice(0, newN);
    });
    setValues(prev => {
      const next = [...prev];
      while (next.length < newN) next.push(1);
      return next.slice(0, newN);
    });
  }

  return (
    <KnapsackContext.Provider value={{ n, W, weights, values, setW, updateN, updateWeight, updateValue }}>
      {children}
    </KnapsackContext.Provider>
  );
}

export const useKnapsack = () => useContext(KnapsackContext);
