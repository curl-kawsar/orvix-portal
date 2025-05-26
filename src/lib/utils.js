import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names and merges Tailwind classes
 * @param  {...any} inputs - Class names to combine
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid MongoDB ObjectID (24 hexadecimal characters)
 * @param {string} id - The ID string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
