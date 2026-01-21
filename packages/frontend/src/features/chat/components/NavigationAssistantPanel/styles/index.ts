/**
 * Navigation Assistant Panel Styles
 * Combines all style modules into a single export
 */

import baseStyles from './base.module.css';
import messageStyles from './messages.module.css';
import inputStyles from './input.module.css';
import reportStyles from './report.module.css';

// Merge all styles into a single object
const styles = {
  ...baseStyles,
  ...messageStyles,
  ...inputStyles,
  ...reportStyles
};

export default styles;
