import { createRoot } from 'react-dom/client';

import { App } from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

// не используем StrictMode для упрощения кода в useEffect
root.render(<App />);
