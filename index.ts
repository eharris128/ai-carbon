/**
 * ai-carbon - Environmental impact calculations for AI model usage
 * 
 * Based on research into LLM energy consumption and carbon footprint.
 * Supports Claude 4, OpenAI GPT, and Google Gemini models.
 */

// Base provider interface
export interface CarbonProvider {
  calculateEmissions(config: EmissionConfig): Promise<EmissionResult>;
  getSupportedModels(): string[];
  getRegionalFactors(): RegionalCarbonFactors;
  getModelInfo(model: string): ModelInfo;
}

export interface EmissionConfig {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: string;
}

export interface EmissionResult {
  provider: string;
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

export interface RegionalCarbonFactors {
  [region: string]: {
    carbonIntensity: number; // kg CO2/kWh
    renewablePercentage: number;
    adjustmentFactor: number;
  };
}

export interface ModelInfo {
  energyPerToken: number;
  description: string;
  architecture: string;
  estimatedParameters?: string;
  useCase?: string;
}

// Legacy types for backward compatibility
export interface CalculationOptions {
  model: 'claude-4-sonnet' | 'claude-4-opus';
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1';
}

// Multi-provider calculation options
export interface MultiProviderOptions {
  provider: 'claude' | 'openai' | 'gemini';
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: string;
}

// Legacy type alias for backward compatibility
export type Claude4Impact = EmissionResult;

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
  sonnet: EmissionResult;
  opus: EmissionResult;
  opusMultiplier: number;
}

// Claude Provider Implementation
class ClaudeProvider implements CarbonProvider {
  private readonly modelSpecs = {
    'claude-4-sonnet': {
      energyPerToken: 0.0012, // joules per token
      description: 'Efficient model for everyday use (~200B parameters)',
      architecture: 'mixture-of-experts',
      estimatedParameters: '~200B',
      useCase: 'Efficient everyday tasks'
    },
    'claude-4-opus': {
      energyPerToken: 0.0045, // joules per token  
      description: 'Most capable model, higher energy usage (~1T+ parameters)',
      architecture: 'transformer-large',
      estimatedParameters: '~1T+',
      useCase: 'Research and complex reasoning'
    }
  } as const;

  private readonly infrastructure = {
    pue: 1.12,                // Power Usage Effectiveness (AWS average)
    carbonIntensity: 0.385,   // kg CO2/kWh (US grid average)
    wue: 1.8,                 // Water Usage Effectiveness (L/kWh)
  } as const;

  private readonly cacheMultipliers = {
    creation: 1.1,  // Full computation + storage overhead
    retrieval: 0.12 // Memory bandwidth limited, no transformer compute
  } as const;

  private readonly reasoningMultiplier = 2.5;

  private readonly regionalFactors: RegionalCarbonFactors = {
    'us-east-1': { carbonIntensity: 0.385, renewablePercentage: 0.60, adjustmentFactor: 1.0 },
    'us-west-2': { carbonIntensity: 0.285, renewablePercentage: 0.75, adjustmentFactor: 0.95 },
    'eu-west-1': { carbonIntensity: 0.295, renewablePercentage: 0.70, adjustmentFactor: 0.92 },
    'ap-southeast-1': { carbonIntensity: 0.485, renewablePercentage: 0.45, adjustmentFactor: 1.15 }
  };

  async calculateEmissions(config: EmissionConfig): Promise<EmissionResult> {
    const modelSpec = this.modelSpecs[config.model as keyof typeof this.modelSpecs];
    if (!modelSpec) {
      throw new Error(`Unsupported Claude model: ${config.model}`);
    }

    const regionalFactor = this.regionalFactors[config.region || 'us-east-1'];
    
    // Calculate energy for different token types
    const regularTokens = config.inputTokens + config.outputTokens;
    const baseEnergyJoules = regularTokens * modelSpec.energyPerToken;
    
    // Cache operations have different computational costs
    const cacheWriteEnergy = (config.cacheCreationTokens || 0) * modelSpec.energyPerToken * this.cacheMultipliers.creation;
    const cacheReadEnergy = (config.cacheReadTokens || 0) * modelSpec.energyPerToken * this.cacheMultipliers.retrieval;
    
    // Total computational energy before reasoning multiplier
    let computeEnergyJoules = baseEnergyJoules + cacheWriteEnergy;
    
    // Apply reasoning multiplier to computational work (not cache reads)
    if (config.reasoning) {
      computeEnergyJoules *= this.reasoningMultiplier;
    }
    
    // Total energy including cache reads
    const totalEnergyJoules = computeEnergyJoules + cacheReadEnergy;
    
    // Convert to kWh and apply datacenter PUE + regional factors
    const energyKwh = (totalEnergyJoules / 3_600_000) * this.infrastructure.pue * regionalFactor.adjustmentFactor;
    
    // Calculate environmental impacts with regional carbon intensity
    const co2Kg = energyKwh * regionalFactor.carbonIntensity * (1 - regionalFactor.renewablePercentage);
    const waterLiters = energyKwh * this.infrastructure.wue;
    
    return {
      provider: 'claude',
      model: config.model,
      co2Grams: co2Kg * 1000,
      energyWh: energyKwh * 1000,
      waterLiters,
      inputTokens: config.inputTokens,
      outputTokens: config.outputTokens,
      cacheCreationTokens: config.cacheCreationTokens,
      cacheReadTokens: config.cacheReadTokens,
      reasoning: config.reasoning || false,
      timestamp: new Date().toISOString(),
    };
  }

  getSupportedModels(): string[] {
    return Object.keys(this.modelSpecs);
  }

  getRegionalFactors(): RegionalCarbonFactors {
    return this.regionalFactors;
  }

  getModelInfo(model: string): ModelInfo {
    const spec = this.modelSpecs[model as keyof typeof this.modelSpecs];
    if (!spec) {
      throw new Error(`Unsupported Claude model: ${model}`);
    }
    return spec;
  }
}

// OpenAI Provider Implementation
class OpenAIProvider implements CarbonProvider {
  private readonly modelSpecs = {
    'gpt-4o': {
      energyPerToken: 0.0025, // joules per token, based on 0.3Wh per 500 tokens
      description: 'Latest GPT-4 optimized model',
      architecture: 'transformer-large',
      estimatedParameters: '~200B',
      useCase: 'General purpose with improved efficiency'
    },
    'gpt-4': {
      energyPerToken: 0.0035, // joules per token
      description: 'GPT-4 standard model',
      architecture: 'transformer-large', 
      estimatedParameters: '~1.8T',
      useCase: 'Advanced reasoning and complex tasks'
    },
    'gpt-4-turbo': {
      energyPerToken: 0.0030, // joules per token
      description: 'GPT-4 Turbo optimized for speed',
      architecture: 'transformer-large',
      estimatedParameters: '~1.8T',
      useCase: 'Fast responses for complex tasks'
    },
    'o1-preview': {
      energyPerToken: 0.0250, // 10x multiplier for reasoning tokens
      description: 'Advanced reasoning model with chain-of-thought',
      architecture: 'reasoning-enhanced',
      estimatedParameters: '~1.8T',
      useCase: 'Complex reasoning and problem solving'
    }
  } as const;

  private readonly infrastructure = {
    pue: 1.12,                // Microsoft Azure PUE design target
    wue: 1.5,                 // Azure water usage
  } as const;

  private readonly regionalFactors: RegionalCarbonFactors = {
    'us-east-1': { carbonIntensity: 0.385, renewablePercentage: 0.85, adjustmentFactor: 1.0 },
    'us-west-2': { carbonIntensity: 0.285, renewablePercentage: 0.90, adjustmentFactor: 1.0 },
    'europe': { carbonIntensity: 0.295, renewablePercentage: 0.95, adjustmentFactor: 0.98 },
    'asia-pacific': { carbonIntensity: 0.485, renewablePercentage: 0.80, adjustmentFactor: 1.08 }
  };

  async calculateEmissions(config: EmissionConfig): Promise<EmissionResult> {
    const modelSpec = this.modelSpecs[config.model as keyof typeof this.modelSpecs];
    if (!modelSpec) {
      throw new Error(`Unsupported OpenAI model: ${config.model}`);
    }

    const regionalFactor = this.regionalFactors[config.region || 'us-east-1'];
    
    // OpenAI models: output tokens are more expensive (4-5x) due to memory bandwidth
    const inputEnergyJoules = config.inputTokens * modelSpec.energyPerToken;
    const outputEnergyJoules = config.outputTokens * modelSpec.energyPerToken * 4.5; // Output token multiplier
    
    let totalEnergyJoules = inputEnergyJoules + outputEnergyJoules;
    
    // o1-preview has hidden reasoning tokens (already factored into base energy)
    // Other models can use reasoning mode
    if (config.reasoning && config.model !== 'o1-preview') {
      totalEnergyJoules *= 2.0; // Lower multiplier than Claude
    }
    
    // Convert to kWh and apply datacenter PUE + regional factors
    const energyKwh = (totalEnergyJoules / 3_600_000) * this.infrastructure.pue * regionalFactor.adjustmentFactor;
    
    // Microsoft committed to 100% renewable by 2025, so minimal carbon intensity
    const co2Kg = energyKwh * regionalFactor.carbonIntensity * (1 - regionalFactor.renewablePercentage);
    const waterLiters = energyKwh * this.infrastructure.wue;
    
    return {
      provider: 'openai',
      model: config.model,
      co2Grams: co2Kg * 1000,
      energyWh: energyKwh * 1000,
      waterLiters,
      inputTokens: config.inputTokens,
      outputTokens: config.outputTokens,
      cacheCreationTokens: config.cacheCreationTokens,
      cacheReadTokens: config.cacheReadTokens,
      reasoning: config.reasoning || false,
      timestamp: new Date().toISOString(),
    };
  }

  getSupportedModels(): string[] {
    return Object.keys(this.modelSpecs);
  }

  getRegionalFactors(): RegionalCarbonFactors {
    return this.regionalFactors;
  }

  getModelInfo(model: string): ModelInfo {
    const spec = this.modelSpecs[model as keyof typeof this.modelSpecs];
    if (!spec) {
      throw new Error(`Unsupported OpenAI model: ${model}`);
    }
    return spec;
  }
}

// Gemini Provider Implementation  
class GeminiProvider implements CarbonProvider {
  private readonly modelSpecs = {
    'gemini-2.5-pro': {
      energyPerToken: 0.0008, // 63% reduction from GPT-4 baseline
      description: 'Google\'s most capable model with superior efficiency',
      architecture: 'mixture-of-experts-tpu',
      estimatedParameters: '~1.5T',
      useCase: 'Advanced reasoning with superior efficiency'
    },
    'gemini-1.5-pro': {
      energyPerToken: 0.0010, // Slightly higher than 2.5 but still efficient
      description: 'Previous generation Gemini Pro model',  
      architecture: 'mixture-of-experts-tpu',
      estimatedParameters: '~1T',
      useCase: 'Multimodal tasks with long context'
    }
  } as const;

  private readonly infrastructure = {
    pue: 1.09,                // Google's industry-leading PUE
    wue: 1.2,                 // Google's advanced cooling
    tpuEfficiencyBonus: 0.5,  // TPU vs GPU efficiency bonus
  } as const;

  private readonly regionalFactors: RegionalCarbonFactors = {
    'us-central1': { carbonIntensity: 0.385, renewablePercentage: 0.64, adjustmentFactor: 0.95 },
    'us-west1': { carbonIntensity: 0.285, renewablePercentage: 0.90, adjustmentFactor: 0.90 },
    'europe-west1': { carbonIntensity: 0.295, renewablePercentage: 0.90, adjustmentFactor: 0.88 },
    'asia-southeast1': { carbonIntensity: 0.485, renewablePercentage: 0.60, adjustmentFactor: 1.05 }
  };

  async calculateEmissions(config: EmissionConfig): Promise<EmissionResult> {
    const modelSpec = this.modelSpecs[config.model as keyof typeof this.modelSpecs];
    if (!modelSpec) {
      throw new Error(`Unsupported Gemini model: ${config.model}`);
    }

    const regionalFactor = this.regionalFactors[config.region || 'us-central1'];
    
    // Gemini has more balanced input/output energy costs
    const totalTokens = config.inputTokens + config.outputTokens;
    let totalEnergyJoules = totalTokens * modelSpec.energyPerToken;
    
    // Apply TPU efficiency bonus
    totalEnergyJoules *= this.infrastructure.tpuEfficiencyBonus;
    
    // Reasoning mode (less intensive than other providers due to MoE)
    if (config.reasoning) {
      totalEnergyJoules *= 1.8;
    }
    
    // Convert to kWh with Google's superior PUE
    const energyKwh = (totalEnergyJoules / 3_600_000) * this.infrastructure.pue * regionalFactor.adjustmentFactor;
    
    // Apply Google's carbon-free energy percentage
    const co2Kg = energyKwh * regionalFactor.carbonIntensity * (1 - regionalFactor.renewablePercentage);
    const waterLiters = energyKwh * this.infrastructure.wue;
    
    return {
      provider: 'gemini',
      model: config.model,
      co2Grams: co2Kg * 1000,
      energyWh: energyKwh * 1000,
      waterLiters,
      inputTokens: config.inputTokens,
      outputTokens: config.outputTokens,
      cacheCreationTokens: config.cacheCreationTokens,
      cacheReadTokens: config.cacheReadTokens,
      reasoning: config.reasoning || false,
      timestamp: new Date().toISOString(),
    };
  }

  getSupportedModels(): string[] {
    return Object.keys(this.modelSpecs);
  }

  getRegionalFactors(): RegionalCarbonFactors {
    return this.regionalFactors;
  }

  getModelInfo(model: string): ModelInfo {
    const spec = this.modelSpecs[model as keyof typeof this.modelSpecs];
    if (!spec) {
      throw new Error(`Unsupported Gemini model: ${model}`);
    }
    return spec;
  }
}

// Provider registry
const providers = {
  claude: new ClaudeProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider()
} as const;

// Multi-provider functions
/**
 * Calculate environmental impact for any supported AI model
 */
export async function calculateImpact(options: MultiProviderOptions): Promise<EmissionResult> {
  const provider = providers[options.provider];
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`);
  }
  
  return provider.calculateEmissions({
    model: options.model,
    inputTokens: options.inputTokens,
    outputTokens: options.outputTokens,
    cacheCreationTokens: options.cacheCreationTokens,
    cacheReadTokens: options.cacheReadTokens,
    reasoning: options.reasoning,
    region: options.region
  });
}

/**
 * Get all supported models for a provider
 */
export function getSupportedModels(provider: 'claude' | 'openai' | 'gemini'): string[] {
  const providerInstance = providers[provider];
  if (!providerInstance) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return providerInstance.getSupportedModels();
}

/**
 * Get model information for any provider
 */
export function getModelInfo(provider: 'claude' | 'openai' | 'gemini', model: string): ModelInfo {
  const providerInstance = providers[provider];
  if (!providerInstance) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return providerInstance.getModelInfo(model);
}

/**
 * Compare models across different providers
 */
export async function compareProviders(
  inputTokens: number, 
  outputTokens: number, 
  reasoning = false
): Promise<{claude: EmissionResult, openai: EmissionResult, gemini: EmissionResult}> {
  const [claude, openai, gemini] = await Promise.all([
    calculateImpact({
      provider: 'claude',
      model: 'claude-4-sonnet',
      inputTokens,
      outputTokens,
      reasoning
    }),
    calculateImpact({
      provider: 'openai', 
      model: 'gpt-4o',
      inputTokens,
      outputTokens,
      reasoning
    }),
    calculateImpact({
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      inputTokens,
      outputTokens,
      reasoning
    })
  ]);

  return { claude, openai, gemini };
}

/**
 * Calculate impact for multiple API calls across providers efficiently
 */
export async function calculateBatchImpactMultiProvider(calculations: MultiProviderOptions[]): Promise<EmissionResult[]> {
  return Promise.all(calculations.map(calculateImpact));
}

// Legacy constants for backward compatibility
const MODEL_SPECS = {
  'claude-4-sonnet': {
    energyPerToken: 0.0012,
    description: 'Efficient model for everyday use (~200B parameters)',
    architecture: 'mixture-of-experts'
  },
  'claude-4-opus': {
    energyPerToken: 0.0045,
    description: 'Most capable model, higher energy usage (~1T+ parameters)',
    architecture: 'transformer-large'
  }
} as const;

const INFRASTRUCTURE = {
  pue: 1.12,
  carbonIntensity: 0.385,
  wue: 1.8,
} as const;

const CACHE_MULTIPLIERS = {
  creation: 1.1,
  retrieval: 0.12
} as const;

const REASONING_MULTIPLIER = 2.5;

// Legacy functions for backward compatibility
/**
 * Calculate environmental impact for a Claude 4 API call
 * @deprecated Use calculateImpact with provider: 'claude' instead
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
    provider: 'claude',
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
 * Get Claude model information (legacy)
 * @deprecated Use getModelInfo with provider: 'claude' instead
 */
export function getClaudeModelInfo(model: 'claude-4-sonnet' | 'claude-4-opus') {
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

/**
 * Format emission result for human-readable output
 */
export function formatEmissionResult(result: EmissionResult): string {
  const { co2Grams, energyWh, waterLiters, model, provider } = result;
  
  return `${provider.toUpperCase()} ${model} Impact:
• CO2: ${co2Grams.toFixed(2)}g
• Energy: ${energyWh.toFixed(2)}Wh  
• Water: ${waterLiters.toFixed(3)}L
• Tokens: ${result.inputTokens + result.outputTokens}${result.cacheCreationTokens ? ` (+${result.cacheCreationTokens} cache writes)` : ''}${result.cacheReadTokens ? ` (+${result.cacheReadTokens} cache reads)` : ''}`;
}

/**
 * Aggregate multiple emission results for reporting
 */
export function aggregateEmissions(emissions: EmissionResult[]): AggregatedImpact {
  const totals = emissions.reduce(
    (acc, emission) => ({
      co2Grams: acc.co2Grams + emission.co2Grams,
      energyWh: acc.energyWh + emission.energyWh,
      waterLiters: acc.waterLiters + emission.waterLiters,
      totalTokens: acc.totalTokens + emission.inputTokens + emission.outputTokens + 
                   (emission.cacheCreationTokens || 0) + (emission.cacheReadTokens || 0),
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
 * Get all supported providers
 */
export function getSupportedProviders(): string[] {
  return Object.keys(providers);
}

/**
 * Get efficiency ranking of providers for a given token count
 */
export async function getProviderEfficiencyRanking(
  inputTokens: number, 
  outputTokens: number
): Promise<Array<{provider: string, model: string, co2Grams: number, efficiency: number}>> {
  const comparison = await compareProviders(inputTokens, outputTokens);
  
  const rankings = [
    { provider: 'claude', model: 'claude-4-sonnet', co2Grams: comparison.claude.co2Grams },
    { provider: 'openai', model: 'gpt-4o', co2Grams: comparison.openai.co2Grams },
    { provider: 'gemini', model: 'gemini-2.5-pro', co2Grams: comparison.gemini.co2Grams }
  ];
  
  // Sort by CO2 emissions (lower is better)
  rankings.sort((a, b) => a.co2Grams - b.co2Grams);
  
  // Calculate efficiency as inverse of CO2 emissions
  const maxCO2 = rankings[rankings.length - 1].co2Grams;
  
  return rankings.map(ranking => ({
    ...ranking,
    efficiency: maxCO2 / ranking.co2Grams
  }));
}

// Export constants for advanced usage
export const CONSTANTS = {
  MODEL_SPECS,
  INFRASTRUCTURE,
  CACHE_MULTIPLIERS,
  REASONING_MULTIPLIER,
} as const;

// Export provider instances for advanced usage
export const PROVIDERS = providers;