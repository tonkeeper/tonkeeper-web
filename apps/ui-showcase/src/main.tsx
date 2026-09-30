import { createRoot } from 'react-dom/client';
import '@tonkeeper/ui-kit/styles.css';
// The licensed brand face, read from the repo: the published package ships Inter only.
import '../../../packages/ui-kit/src/styles/tt-firs-neue/tt-firs-neue.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
