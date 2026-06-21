import { useEffect, useState } from 'react';
import { useBoardStore } from './store/boardStore';
import { Header } from './components/layout/Header';
import { BoardView } from './components/board/BoardView';

function App() {
  const loadBoard = useBoardStore((s) => s.loadBoard);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  return (
    <>
      <Header isDark={isDark} onThemeToggle={() => setIsDark((d) => !d)} />
      <BoardView />
    </>
  );
}

export default App;
