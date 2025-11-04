/**
 * Navigator Service Configuration Constants
 */

/**
 * Valid ID pattern for location nodes
 * Matches formats: spawn-*, subloc-*, loc-*, host-*, region-*
 */
export const VALID_ID_PATTERN = /^(spawn|subloc|loc|host|region)-\d+-[a-z0-9]+$/;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_TARGET_NODE_ID: (id: string) => 
    `Invalid targetNodeId: "${id}" is not a valid ID and no matching node name found`,
  NO_PARENT_AVAILABLE: "You're already at the top level of this host. There's nowhere to exit to.",
  MISSING_REQUIRED_FIELDS: 'Invalid navigation result structure from AI',
  NO_RESPONSE: 'No response from AI',
  PARSE_ERROR: (error: unknown) => `Failed to parse AI response: ${error}`,
  SERVICE_ERROR: (error: unknown) => `Navigator service failed: ${error}`
};
