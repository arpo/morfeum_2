import { useState } from 'react';
import './App.css';

function App() {
  const [backendMessage, setBackendMessage] = useState('');

  const callBackend = async () => {
    try {
      const response = await fetch('/api');
      const text = await response.text();
      setBackendMessage(text);
    } catch (error) {
      console.error('Error calling backend:', error);
      setBackendMessage('Error: Could not connect to backend.');
    }
  };

  return (
    <>
      <h1>Morfeum</h1>
      <div className="card">
        <button onClick={callBackend}>Call Backend</button>
        {backendMessage && <p>Backend says: {backendMessage}</p>}
      </div>
    </>
  );
}

export default App;