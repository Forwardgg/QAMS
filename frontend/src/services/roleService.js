// src/services/roleService.js
/**
 * roleService - centralizes role-based logic
 *
 * Exports:
 *  - getDefaultRoute(role) -> string
 *  - normalizeRole(roleString) -> lowercase normalized role
 *  - isRoleAllowed(userRole, allowedRoles) -> boolean
 *  - ROLE constants
 */

const ROLE_ADMIN = "admin";
const ROLE_INSTRUCTOR = "instructor";
const ROLE_MODERATOR = "moderator";

const DEFAULT_ROUTES = {
  [ROLE_ADMIN]: "/admin/dashboard",
  [ROLE_INSTRUCTOR]: "/instructor/dashboard",
  [ROLE_MODERATOR]: "/moderator/dashboard"
};

/**
 * Get default dashboard route for a role
 * @param {string} role - User role
 * @returns {string} Dashboard route
 */
export const getDefaultRoute = (role) => {
  const normalized = String(role || "").toLowerCase();
  return DEFAULT_ROUTES[normalized] || "/";
};

/**
 * Normalize role string to lowercase
 * @param {string} role - Role string
 * @returns {string} Normalized role
 */
export const normalizeRole = (role) => String(role || "").toLowerCase();

/**
 * Check if user role is allowed
 * @param {string} userRole - User's role
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {boolean} True if allowed
 */
export const isRoleAllowed = (userRole, allowedRoles) => {
  if (!userRole) return false;
  
  const normalizedUser = normalizeRole(userRole);
  
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.some(role => normalizeRole(role) === normalizedUser);
  }
  
  return normalizeRole(allowedRoles) === normalizedUser;
};

/**
 * Get all available roles (for UI dropdowns, etc.)
 */
export const getAllRoles = () => [ROLE_ADMIN, ROLE_INSTRUCTOR, ROLE_MODERATOR];

/**
 * Get roles available for registration (excludes admin)
 */
export const getRegistrableRoles = () => [ROLE_INSTRUCTOR, ROLE_MODERATOR];

// Export constants for direct import
export {
  ROLE_ADMIN,
  ROLE_INSTRUCTOR,
  ROLE_MODERATOR
};