import { useAppLogic } from './useAppLogic';
import { Button } from '@/components/ui';
import { IconLoader2 } from '@/icons';
import styles from './App.module.css';

export function App() {
  const { state, handlers, computed } = useAppLogic();
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Morfeum</h1>
      
      <div className={styles.card}>
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
          <div className={styles.loading}>
            <IconLoader2 className={styles.spinner} />
            Calling backend...
          </div>
        )}
        
        {computed.hasMessage && !state.loading && (
          <div className={`${styles.message} ${state.error ? styles.error : ''}`}>
            {computed.displayMessage}
          </div>
        )}
        
        {!computed.hasMessage && !state.loading && (
          <div className={styles.empty}>
            Click "Call Backend" to test the connection
          </div>
        )}
      </div>
    </div>
  );
}
