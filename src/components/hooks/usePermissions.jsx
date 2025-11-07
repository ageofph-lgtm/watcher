import { useMemo } from 'react';

const PERMISSIONS = {
  tecnico: {
    canCreateMachine: false,
    canDeleteMachine: false,
    canMoveMachineToOwnColumn: true,
    canAddObservations: true,
    canViewAll: true,
    canSetPriority: false
  },
  
  admin: {
    canCreateMachine: true,
    canDeleteMachine: true,
    canMoveAnyMachine: true,
    canAddObservations: true,
    canViewAll: true,
    canSetPriority: true
  }
};

export const usePermissions = (userProfile, userTechnicianName = null) => {
  const permissions = useMemo(() => {
    if (!userProfile || !PERMISSIONS[userProfile]) {
      return PERMISSIONS.tecnico;
    }
    return {
      ...PERMISSIONS[userProfile],
      technicianName: userTechnicianName
    };
  }, [userProfile, userTechnicianName]);

  const canMoveMachineTo = (targetTechnician, targetState) => {
    if (permissions.canMoveAnyMachine) {
      return true;
    }
    
    if (permissions.canMoveMachineToOwnColumn) {
      return targetTechnician === permissions.technicianName;
    }
    
    return false;
  };

  return {
    ...permissions,
    canMoveMachineTo
  };
};