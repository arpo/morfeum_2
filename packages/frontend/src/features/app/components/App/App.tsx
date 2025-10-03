import { useAppLogic } from './useAppLogic';
import { Button, Card, LoadingSpinner, Message } from '@/components/ui';
import styles from './App.module.css';

export function App() {
  const { state, handlers, computed } = useAppLogic();
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Morfeum</h1>
      
      {/* MZOO Test Data Section */}
      {state.testLoading && (
        <LoadingSpinner message="Loading test data..." />
      )}
      {state.testError && (
        <Message variant="error" message={state.testError} />
      )}
      {state.testData && !state.testLoading && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>{state.testData.title}</h2>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text)' }}>{state.testData.body}</p>
        </div>
      )}

      <Card>
        <div className={styles.buttonContainer}>
          <Button 
            onClick={handlers.callBackend}
            loading={state.loading}
            disabled={state.loading}
          >
            Call Backend
          </Button>
          
          {computed.hasMessage && (
            <Button 
              variant="outline" 
              onClick={handlers.clearMessage}
            >
              Clear
            </Button>
          )}
        </div>
        
        {state.loading && (
          <LoadingSpinner message="Calling backend..." />
        )}
        
        {computed.hasMessage && !state.loading && (
          <Message 
            variant={state.error ? 'error' : 'default'}
            message={computed.displayMessage}
          />
        )}
        
        {!computed.hasMessage && !state.loading && (
          <div className={styles.empty}>
            Click "Call Backend" to test the connection
          </div>
        )}
      </Card>
    </div>
  );
}
