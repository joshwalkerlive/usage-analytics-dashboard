/**
 * Types for qualitative/narrative insights data that comes from
 * a pre-generated insights JSON file (not computed from raw sessions).
 */

export interface InsightsReport {
  generatedAt: string;
  dateRange: { start: string; end: string };
  sessionCount: number;

  atAGlance: {
    working: string[];
    hindering: string[];
    quickWins: string[];
    ambitious: string[];
  };

  projectAreas: {
    name: string;
    sessionCount: number;
    description: string;
  }[];

  usageNarrative: {
    paragraphs: string[];
    keyInsight: string;
  };

  multiClauding: {
    detected: boolean;
    details: string;
  };

  bigWins: {
    title: string;
    description: string;
  }[];

  frictionCategories: {
    title: string;
    description: string;
    examples: string[];
  }[];

  claudeMdSuggestions: {
    id: string;
    text: string;
  }[];

  featureRecommendations: {
    title: string;
    description: string;
    code?: string;
  }[];

  usagePatterns: {
    title: string;
    summary: string;
    detail: string;
    prompt: string;
  }[];

  horizonIdeas: {
    title: string;
    possible: string;
    tip: string;
    prompt: string;
  }[];

  funEnding: {
    headline: string;
    detail: string;
  };
}
