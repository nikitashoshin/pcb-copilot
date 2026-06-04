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

export type MissingEngineeringParameter = {
  code: string;
  title: string;
  whyItMatters: string;
  status: string;
  recommendation: string;
};

export type BlockRationaleItem = {
  blockCode: string;
  blockName: string;
  reason: string;
  relatedRequirement: string;
};

export type EngineeringRiskItem = {
  code: string;
  title: string;
  priority: "Critical" | "RequiresDecision" | "Recommendation" | string;
  message: string;
  recommendation: string;
  relatedBlockCode?: string | null;
};

export type PowerBudgetItem = {
  rail: string;
  loads: string[];
  status: string;
  recommendation: string;
};

export type GpioBudgetItem = {
  function: string;
  requiredResources: string[];
  estimatedPins: string;
  notes: string;
};

export type EngineeringDecisionItem = {
  code: string;
  title: string;
  whyItMatters: string;
  recommendation: string;
};

export type EngineeringNextStep = {
  order: number;
  title: string;
  description: string;
};

export type EngineeringReview = {
  missingParameters: MissingEngineeringParameter[];
  blockRationale: BlockRationaleItem[];
  riskSummary: EngineeringRiskItem[];
  powerBudget: PowerBudgetItem[];
  gpioBudget: GpioBudgetItem[];
  engineeringDecisions: EngineeringDecisionItem[];
  nextSteps: EngineeringNextStep[];
};

export type ValidationIssue = {
  code: string;
  severity: "Info" | "Warning" | "Error" | string;
  message: string;
  recommendation: string;
};

export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
};

export type ArchitectureResult = {
  projectName: string;
  projectSpec?: ProjectSpec | null;
  functionalBlocks: FunctionalBlockResult[];
  bom: BomItem[];
  warnings: EngineeringWarning[];
  checkResults: CheckResult[];
  engineeringReview: EngineeringReview;
};
