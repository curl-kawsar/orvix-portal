import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

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
