/**
 * ai-carbon - Environmental impact calculations for AI model usage
 * 
 * Based on research into LLM energy consumption and carbon footprint.
 * Supports Claude 4 models with cache-aware calculations.
 */

// Types
export interface CalculationOptions {
  model: 'claude-4-sonnet' | 'claude-4-opus';
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1';
}

export interface Claude4Impact {
  model: string;
  co2Grams: number;
  energyWh: number;
  waterLiters: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning: boolean;
  timestamp: string;
}

export interface AggregatedImpact {
  co2Grams: number;
  energyWh: number;
  waterLiters: number;
  totalTokens: number;
  calls: number;
  averageCO2PerToken: number;
  averageEnergyPerToken: number;
}

export interface ModelComparison {
  sonnet: Claude4Impact;
  opus: Claude4Impact;
  opusMultiplier: number;
}

// Model specifications based on research and architectural analysis
const MODEL_SPECS = {
  'claude-4-sonnet': {
    energyPerToken: 0.0012, // joules per token
    description: 'Efficient model for everyday use (~200B parameters)',
    architecture: 'mixture-of-experts'
  },
  'claude-4-opus': {
    energyPerToken: 0.0045, // joules per token  
    description: 'Most capable model, higher energy usage (~1T+ parameters)',
    architecture: 'transformer-large'
  }
} as const;

// Infrastructure constants based on AWS datacenters
const INFRASTRUCTURE = {
  pue: 1.12,                // Power Usage Effectiveness (AWS average)
  carbonIntensity: 0.385,   // kg CO2/kWh (US grid average)
  wue: 1.8,                 // Water Usage Effectiveness (L/kWh)
} as const;

// Cache operation multipliers based on research
const CACHE_MULTIPLIERS = {
  creation: 1.1,  // Full computation + storage overhead
  retrieval: 0.12 // Memory bandwidth limited, no transformer compute
} as const;

// Reasoning mode uses ~2.5x more compute for chain-of-thought processing
const REASONING_MULTIPLIER = 2.5;

/**
 * Calculate environmental impact for a Claude 4 API call
 */
export function calculateClaude4Impact(options: CalculationOptions): Claude4Impact {
  const { 
    model, 
    inputTokens, 
    outputTokens, 
    cacheCreationTokens = 0,
    cacheReadTokens = 0,
    reasoning = false 
  } = options;
  
  const modelSpec = MODEL_SPECS[model];
  if (!modelSpec) {
    throw new Error(`Unsupported model: ${model}`);
  }

  // Calculate energy for different token types
  const regularTokens = inputTokens + outputTokens;
  const baseEnergyJoules = regularTokens * modelSpec.energyPerToken;
  
  // Cache operations have different computational costs
  const cacheWriteEnergy = cacheCreationTokens * modelSpec.energyPerToken * CACHE_MULTIPLIERS.creation;
  const cacheReadEnergy = cacheReadTokens * modelSpec.energyPerToken * CACHE_MULTIPLIERS.retrieval;
  
  // Total computational energy before reasoning multiplier
  let computeEnergyJoules = baseEnergyJoules + cacheWriteEnergy;
  
  // Apply reasoning multiplier to computational work (not cache reads)
  if (reasoning) {
    computeEnergyJoules *= REASONING_MULTIPLIER;
  }
  
  // Total energy including cache reads (which don't benefit from reasoning optimization)
  const totalEnergyJoules = computeEnergyJoules + cacheReadEnergy;
  
  // Convert to kWh and apply datacenter PUE (Power Usage Effectiveness)
  const energyKwh = (totalEnergyJoules / 3_600_000) * INFRASTRUCTURE.pue;
  
  // Calculate environmental impacts
  const co2Kg = energyKwh * INFRASTRUCTURE.carbonIntensity;
  const waterLiters = energyKwh * INFRASTRUCTURE.wue;
  
  return {
    model,
    co2Grams: co2Kg * 1000,
    energyWh: energyKwh * 1000,
    waterLiters,
    inputTokens,
    outputTokens,
    cacheCreationTokens: cacheCreationTokens > 0 ? cacheCreationTokens : undefined,
    cacheReadTokens: cacheReadTokens > 0 ? cacheReadTokens : undefined,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate impact for multiple API calls efficiently
 */
export function calculateBatchImpact(calculations: CalculationOptions[]): Claude4Impact[] {
  return calculations.map(calculateClaude4Impact);
}

/**
 * Aggregate multiple impact calculations for reporting
 */
export function aggregateImpacts(impacts: Claude4Impact[]): AggregatedImpact {
  const totals = impacts.reduce(
    (acc, impact) => ({
      co2Grams: acc.co2Grams + impact.co2Grams,
      energyWh: acc.energyWh + impact.energyWh,
      waterLiters: acc.waterLiters + impact.waterLiters,
      totalTokens: acc.totalTokens + impact.inputTokens + impact.outputTokens + 
                   (impact.cacheCreationTokens || 0) + (impact.cacheReadTokens || 0),
      calls: acc.calls + 1,
    }),
    { co2Grams: 0, energyWh: 0, waterLiters: 0, totalTokens: 0, calls: 0 }
  );

  return {
    ...totals,
    averageCO2PerToken: totals.totalTokens > 0 ? totals.co2Grams / totals.totalTokens : 0,
    averageEnergyPerToken: totals.totalTokens > 0 ? totals.energyWh / totals.totalTokens : 0,
  };
}

/**
 * Compare environmental impact between Claude 4 Sonnet and Opus
 */
export function compareModels(inputTokens: number, outputTokens: number, reasoning = false): ModelComparison {
  const sonnet = calculateClaude4Impact({
    model: 'claude-4-sonnet',
    inputTokens,
    outputTokens,
    reasoning,
  });
  
  const opus = calculateClaude4Impact({
    model: 'claude-4-opus', 
    inputTokens,
    outputTokens,
    reasoning,
  });

  return {
    sonnet,
    opus,
    opusMultiplier: parseFloat((opus.co2Grams / sonnet.co2Grams).toFixed(2)),
  };
}

/**
 * Estimate carbon impact of your example large workload
 */
export function calculateLargeWorkloadExample(): Claude4Impact {
  return calculateClaude4Impact({
    model: 'claude-4-sonnet',
    inputTokens: 35240,
    outputTokens: 506176,
    cacheCreationTokens: 25361509,
    cacheReadTokens: 417330728,
    reasoning: false,
  });
}

/**
 * Format impact for human-readable output
 */
export function formatImpact(impact: Claude4Impact): string {
  const { co2Grams, energyWh, waterLiters, model } = impact;
  
  return `${model} Impact:
• CO2: ${co2Grams.toFixed(2)}g
• Energy: ${energyWh.toFixed(2)}Wh  
• Water: ${waterLiters.toFixed(3)}L
• Tokens: ${impact.inputTokens + impact.outputTokens}${impact.cacheCreationTokens ? ` (+${impact.cacheCreationTokens} cache writes)` : ''}${impact.cacheReadTokens ? ` (+${impact.cacheReadTokens} cache reads)` : ''}`;
}

/**
 * Get model information
 */
export function getModelInfo(model: 'claude-4-sonnet' | 'claude-4-opus') {
  return {
    ...MODEL_SPECS[model],
    estimatedParameters: model === 'claude-4-sonnet' ? '~200B' : '~1T+',
    useCase: model === 'claude-4-sonnet' ? 'Efficient everyday tasks' : 'Research and complex reasoning',
  };
}

/**
 * Calculate environmental impact per dollar spent (rough estimate)
 */
export function calculateImpactPerDollar(impact: Claude4Impact, estimatedCostUSD: number) {
  if (estimatedCostUSD <= 0) return null;
  
  return {
    co2GramsPerDollar: impact.co2Grams / estimatedCostUSD,
    energyWhPerDollar: impact.energyWh / estimatedCostUSD,
    waterLitersPerDollar: impact.waterLiters / estimatedCostUSD,
  };
}

// Types are already exported above, no need to re-export

// Export constants for advanced usage
export const CONSTANTS = {
  MODEL_SPECS,
  INFRASTRUCTURE,
  CACHE_MULTIPLIERS,
  REASONING_MULTIPLIER,
} as const;
