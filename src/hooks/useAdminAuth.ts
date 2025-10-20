// Backward compatibility: Re-export useAdminAuth from the new multi-role system
export {
  useAdminAuth,
  useFullAdminAuth,
  useHostAuth,
  hasRole,
  isAdmin,
  isFullAdmin,
  canManageHosts,
} from './useMultiRoleAuth'
