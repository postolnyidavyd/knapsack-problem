import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { KnapsackProvider } from './context/KnapsackContext';
import Header     from './components/Layout/Header';
import TabNav     from './components/Layout/TabNav';
import InputPanel from './components/shared/InputPanel';
import BruteForce from './pages/BruteForce';
import Placeholder from './pages/Placeholder';

import './styles/global.css';
import styles from './App.module.css';

export default function App() {
  return (
    <KnapsackProvider>
      <BrowserRouter>
        <Header />
        <TabNav />
        <div className={styles.body}>
          <InputPanel />
          <main className={styles.main}>
            <Routes>
              <Route path="/"          element={<Navigate to="/brute" replace />} />
              <Route path="/brute"     element={<BruteForce />} />
              <Route path="/recursion" element={<Placeholder label="Рекурсія"                color="var(--col-recurse)" />} />
              <Route path="/dp"        element={<Placeholder label="Динамічне програмування" color="var(--col-dp)"      />} />
              <Route path="/greedy"    element={<Placeholder label="Жадібний"                color="var(--col-greedy)"  />} />
              <Route path="/bnb"       element={<Placeholder label="Гілки і межі"            color="var(--col-bnb)"     />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </KnapsackProvider>
  );
}
