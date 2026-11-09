export interface LabRoom {
  id: string;
  name: string;
  pcCount: number;
}

export interface CampusInfo {
  id: string;
  name: string;
  totalPcs: number;
  labs: LabRoom[];
}

export const campusRegistry: Record<string, CampusInfo> = {
  'JRMSU Dapitan Main Campus': {
    id: 'JRMSU-DAP',
    name: 'JRMSU Dapitan Main Campus',
    totalPcs: 105,
    labs: [
      { id: 'DAP-LAB-1', name: 'ComLab 1 (College of Computing)', pcCount: 40 },
      { id: 'DAP-LAB-2', name: 'ComLab 2 (Multimedia Lab)', pcCount: 35 },
      { id: 'DAP-LAB-3', name: 'ComLab 3 (General Lab)', pcCount: 30 }
    ]
  },
  'JRMSU Dipolog Campus': {
    id: 'JRMSU-DIP',
    name: 'JRMSU Dipolog Campus',
    totalPcs: 55,
    labs: [
      { id: 'DIP-LAB-1', name: 'IT Lab Alpha', pcCount: 30 },
      { id: 'DIP-LAB-2', name: 'Network Lab Beta', pcCount: 25 }
    ]
  },
  'JRMSU Katipunan Campus': {
    id: 'JRMSU-KAT',
    name: 'JRMSU Katipunan Campus',
    totalPcs: 45,
    labs: [
      { id: 'KAT-LAB-1', name: 'Agri-Tech ComLab', pcCount: 25 },
      { id: 'KAT-LAB-2', name: 'Basic Computing Lab', pcCount: 20 }
    ]
  },
  'JRMSU Tampilisan Campus': {
    id: 'JRMSU-TAM',
    name: 'JRMSU Tampilisan Campus',
    totalPcs: 40,
    labs: [
      { id: 'TAM-LAB-1', name: 'Forestry GIS Lab', pcCount: 20 },
      { id: 'TAM-LAB-2', name: 'General PC Lab', pcCount: 20 }
    ]
  },
  'JRMSU Siocon Campus': {
    id: 'JRMSU-SIO',
    name: 'JRMSU Siocon Campus',
    totalPcs: 30,
    labs: [
      { id: 'SIO-LAB-1', name: 'Coastal Tech Lab', pcCount: 15 },
      { id: 'SIO-LAB-2', name: 'Community ComLab', pcCount: 15 }
    ]
  }
};

export const getCampusTopology = (campusName: string): CampusInfo => {
  return campusRegistry[campusName] || campusRegistry['JRMSU Dapitan Main Campus'];
};
