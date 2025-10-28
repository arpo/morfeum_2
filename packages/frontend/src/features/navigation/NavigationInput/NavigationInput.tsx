/**
 * Navigation Input Component
 * Allows users to enter travel commands and navigate the world
 */

import { useNavigationLogic } from './useNavigationLogic';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import styles from './NavigationInput.module.css';

interface NavigationInputProps {
  currentNodeId: string;
}

export function NavigationInput({ currentNodeId }: NavigationInputProps) {
  const {
    command,
    isLoading,
    error,
    handleCommandChange,
    handleSubmit,
    handleSuggestionClick,
  } = useNavigationLogic(currentNodeId);

  const { getNode } = useLocationsStore();
  const currentNode = getNode(currentNodeId);

  // Extract navigable elements as suggestions
  const navigableElements = (currentNode?.dna as any)?.navigableElements || [];

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Travel</h3>
        <p>Where would you like to go from here?</p>
      </div>

      <div className={styles.inputGroup}>
        <input
          type="text"
          value={command}
          onChange={(e) => handleCommandChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Go to the toilet, Look out the window..."
          disabled={isLoading}
          className={styles.input}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !command.trim()}
          className={styles.submitButton}
        >
          {isLoading ? 'Analyzing...' : 'Go'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {navigableElements.length > 0 && (
        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>Suggestions:</p>
          <div className={styles.suggestionsList}>
            {navigableElements.map((element: any, index: number) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(`Go to ${element.description}`)}
                disabled={isLoading}
                className={styles.suggestionButton}
              >
                {element.description}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
