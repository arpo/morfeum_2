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

      {/* MZOO Gemini Text Generation Test */}
      <Card>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Gemini Text Generation Test</h2>
        
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <textarea
            value={state.geminiPrompt}
            onChange={(e) => handlers.setGeminiPrompt(e.target.value)}
            placeholder="Enter your prompt here (e.g., 'Write a concise product tagline for a solar-powered backpack.')"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-md)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div className={styles.buttonContainer}>
          <Button 
            onClick={handlers.generateText}
            loading={state.geminiLoading}
            disabled={state.geminiLoading || !state.geminiPrompt.trim()}
          >
            Generate Text
          </Button>
          
          {state.geminiResponse && (
            <Button 
              variant="outline" 
              onClick={handlers.clearGeminiResponse}
            >
              Clear Response
            </Button>
          )}
        </div>
        
        {state.geminiLoading && (
          <LoadingSpinner message="Generating text..." />
        )}
        
        {state.geminiError && (
          <Message 
            variant="error"
            message={state.geminiError}
          />
        )}
        
        {state.geminiResponse && !state.geminiLoading && (
          <div style={{ 
            marginTop: 'var(--spacing-md)', 
            padding: 'var(--spacing-md)', 
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>Response:</strong>
            <p style={{ marginTop: 'var(--spacing-sm)' }}>{state.geminiResponse}</p>
          </div>
        )}
      </Card>

      {/* MZOO FAL Flux Image Generation Test */}
      <Card>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>FAL Flux Image Generation Test</h2>
        
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <textarea
            value={state.imagePrompt}
            onChange={(e) => handlers.setImagePrompt(e.target.value)}
            placeholder="Enter your image prompt here (e.g., 'Portrait of a beautiful person, photorealistic, 8k, high detail, cinematic')"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-md)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div className={styles.buttonContainer}>
          <Button 
            onClick={handlers.generateImage}
            loading={state.imageLoading}
            disabled={state.imageLoading || !state.imagePrompt.trim()}
          >
            Generate Image
          </Button>
          
          {state.imageUrl && (
            <Button 
              variant="outline" 
              onClick={handlers.clearImageResponse}
            >
              Clear Image
            </Button>
          )}
        </div>
        
        {state.imageLoading && (
          <LoadingSpinner message="Generating image..." />
        )}
        
        {state.imageError && (
          <Message 
            variant="error"
            message={state.imageError}
          />
        )}
        
        {state.imageUrl && !state.imageLoading && (
          <div style={{ 
            marginTop: 'var(--spacing-md)', 
            padding: 'var(--spacing-md)', 
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <strong>Generated Image:</strong>
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <img 
                src={state.imageUrl} 
                alt="Generated" 
                style={{ 
                  width: '100%', 
                  borderRadius: 'var(--radius-md)',
                  display: 'block'
                }} 
              />
            </div>
          </div>
        )}
      </Card>

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
