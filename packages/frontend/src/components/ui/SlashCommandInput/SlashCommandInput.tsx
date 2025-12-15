import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './SlashCommandInput.module.css';
import { SLASH_COMMANDS, getAvailableCommands, type NodeType } from '@backend/config/navigation';

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

interface SlashCommandInputProps {
  value: string;
  onChange: (value: string) => void;
  commands: readonly string[];
  currentNodeType?: NodeType | null;
  placeholder?: string;
  disabled?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInvalidCommand?: (command: string) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function SlashCommandInput({
  value,
  onChange,
  commands,
  currentNodeType = null,
  placeholder,
  disabled,
  onKeyPress,
  onInvalidCommand,
  onPaste,
  className
}: SlashCommandInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<string[]>([]);
  const [isInvalid, setIsInvalid] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position based on input element
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top, // Position above the input
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Get contextually available commands based on current node type
  const availableCommands = useMemo(() => {
    return getAvailableCommands(currentNodeType);
  }, [currentNodeType]);

  /**
   * Validate if the current input contains a valid command
   */
  const validateCommand = (input: string): { isValid: boolean; command: string | null } => {
    if (!input.startsWith('/')) {
      return { isValid: true, command: null }; // Not a command yet
    }

    const spaceIndex = input.indexOf(' ');
    const command = spaceIndex > 0 
      ? input.substring(1, spaceIndex).toUpperCase()
      : input.substring(1).toUpperCase();

    if (!command) {
      return { isValid: true, command: null }; // Just typed /
    }

    const isValid = commands.some(cmd => cmd.toUpperCase() === command);
    return { isValid, command };
  };

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter commands and manage dropdown state
  useEffect(() => {
    if (value.startsWith('/')) {
      const searchTerm = value.slice(1).toUpperCase();
      // Only show dropdown if it looks like they are typing a command (no spaces yet)
      // or if they just typed /
      const hasSpace = value.includes(' ');
      const hasOpenParen = value.includes('(');
      const hasFlag = value.includes('--');
      
      if (!hasSpace && !hasOpenParen && !hasFlag) {
        // Filter by available commands (contextual) and search term
        const matches = availableCommands.filter(cmd => 
          cmd.toUpperCase().includes(searchTerm)
        );
        
        if (matches.length > 0) {
          setFilteredCommands(matches);
          updateDropdownPosition(); // Calculate position before opening
          setIsOpen(true);
          setSelectedIndex(0);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [value, availableCommands, updateDropdownPosition]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const activeElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const selectCommand = (command: string) => {
    // Format: /COMMAND 
    const newValue = `/${command} `;
    onChange(newValue);
    setIsOpen(false);
    
    // Attempt to focus back on input (though logic updates might cause re-render)
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          selectCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    } else {
      // Validate command before allowing Enter
      if (e.key === 'Enter') {
        const validation = validateCommand(value);
        if (!validation.isValid && validation.command) {
          e.preventDefault();
          setIsInvalid(true);
          if (onInvalidCommand) {
            onInvalidCommand(validation.command);
          }
          // Reset invalid state after 2 seconds
          setTimeout(() => setIsInvalid(false), 2000);
          return;
        }
        setIsInvalid(false);
      }
      
      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  // Calculate dropdown height for positioning above input
  const dropdownHeight = filteredCommands.length > 0 ? Math.min(filteredCommands.length * 40, 200) : 40;
  
  // Calculate safe position - ensure dropdown stays on screen
  const getDropdownStyle = () => {
    if (!dropdownPosition) return {};
    
    // Try to position above input, but if that would go off-screen, position below
    let top = dropdownPosition.top - dropdownHeight - 8;
    if (top < 10) {
      // Position below input instead
      top = dropdownPosition.top + 40; // 40 is approximate input height
    }
    
    return {
      position: 'fixed' as const,
      top,
      left: dropdownPosition.left,
      width: dropdownPosition.width
    };
  };

  // Render dropdown in portal to avoid overflow clipping issues
  const renderDropdown = () => {
    if (!isOpen || !dropdownPosition) return null;
    
    return createPortal(
      <div 
        className={styles.dropdown} 
        ref={dropdownRef}
        style={getDropdownStyle()}
      >
        {filteredCommands.map((cmd, index) => (
          <div
            key={cmd}
            className={`${styles.commandItem} ${index === selectedIndex ? styles.active : ''}`}
            onClick={() => selectCommand(cmd)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className={styles.commandName}>{cmd}</span>
            {SLASH_COMMANDS[cmd] && (
              <span className={styles.commandDescription}>
                {SLASH_COMMANDS[cmd].description}
              </span>
            )}
          </div>
        ))}
        {filteredCommands.length === 0 && (
          <div className={styles.noCommands}>No commands found</div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {renderDropdown()}
      <input
        ref={inputRef}
        type="text"
        className={`${styles.input} ${isInvalid ? styles.invalid : ''} ${className || ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
