import { useState, useEffect } from 'react';
import { App } from './features/app/components/App';
import { ExternalView } from './features/app/components/ExternalView';
import './styles/tokens.module.css';

function AppComponent() {
  // Simple hash-based routing for external view
  const [isExternalView, setIsExternalView] = useState(() => {
    return window.location.hash === '#view';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setIsExternalView(window.location.hash === '#view');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Render ExternalView (WorldView only) when #view is in URL
  if (isExternalView) {
    return <ExternalView />;
  }

  return <App />;
}

export default AppComponent;
