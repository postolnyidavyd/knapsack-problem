export const DEFAULT_N = 6;
export const DEFAULT_W = 23;
export const DEFAULT_WEIGHTS = [9, 9, 9, 7, 8, 9];
export const DEFAULT_VALUES  = [9, 3, 15, 14, 8, 5];

export const TABS = [
  { id: 'brute',     path: '/brute',     label: 'Груба сила',               complexity: 'O(2ⁿ)',       color: 'var(--col-brute)'   },
  { id: 'recursion', path: '/recursion', label: 'Рекурсія',                 complexity: 'O(2ⁿ)',       color: 'var(--col-recurse)' },
  { id: 'dp',        path: '/dp',        label: 'Динамічне програмування',   complexity: 'O(n·W)',      color: 'var(--col-dp)'      },
  { id: 'greedy',    path: '/greedy',    label: 'Жадібний',                 complexity: 'O(n log n)',  color: 'var(--col-greedy)'  },
  { id: 'bnb',       path: '/bnb',       label: 'Гілки і межі',             complexity: 'O(2ⁿ)*',     color: 'var(--col-bnb)'     },
];
