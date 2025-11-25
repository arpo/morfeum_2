import React, { useState, useEffect, useRef } from 'react';
import styles from './SlashCommandInput.module.css';

interface SlashCommandInputProps {
  value: string;
  onChange: (value: string) => void;
  commands: string[];
  placeholder?: string;
  disabled?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function SlashCommandInput({
  value,
  onChange,
  commands,
  placeholder,
  disabled,
  onKeyPress,
  className
}: SlashCommandInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      
      if (!hasSpace && !hasOpenParen) {
        const matches = commands.filter(cmd => 
          cmd.toUpperCase().includes(searchTerm)
        );
        
        if (matches.length > 0) {
          setFilteredCommands(matches);
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
  }, [value, commands]);

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
      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {isOpen && (
        <div className={styles.dropdown} ref={dropdownRef}>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd}
              className={`${styles.commandItem} ${index === selectedIndex ? styles.active : ''}`}
              onClick={() => selectCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.commandName}>{cmd}</span>
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div className={styles.noCommands}>No commands found</div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        className={`${styles.input} ${className || ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
