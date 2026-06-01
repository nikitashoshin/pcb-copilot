export type ProjectSpec = {
  projectName: string;
  deviceType: string;
  power: {
    input: string;
    outputs: string[];
    protection: boolean;
  };
  mcu: {
    family: string;
    programming: string;
  };
  interfaces: string[];
  digitalInputs: {
    count: number;
    voltage: string;
  };
  relayOutputs: {
    count: number;
  };
  indication: string[];
  board: {
    widthMm: number;
    heightMm: number;
    layers: number;
  };
  environment: string;
};

export type FunctionalBlockResult = {
  code: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
};

export type BomItem = {
  reference: string;
  name: string;
  type: string;
  value?: string | null;
  package?: string | null;
  footprint: string;
  quantity: number;
  comment?: string | null;
  blockCode: string;
};

export type EngineeringWarning = {
  code: string;
  severity: "Info" | "Warning" | "Error" | string;
  message: string;
  relatedBlockCode?: string | null;
};

export type CheckResult = {
  code: string;
  title: string;
  severity: "Info" | "Warning" | "Error" | string;
  status: string;
  message: string;
  recommendation?: string | null;
  relatedBlockCode?: string | null;
};

export type ArchitectureResult = {
  projectName: string;
  functionalBlocks: FunctionalBlockResult[];
  bom: BomItem[];
  warnings: EngineeringWarning[];
  checkResults: CheckResult[];
};
