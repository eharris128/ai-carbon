/**
 * Test data fixtures and utilities for ai-carbon tests
 */

import type { CalculationOptions, Claude4Impact } from '../../index.js';

// Basic calculation options for testing
export const basicSonnetOptions: CalculationOptions = {
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
};

export const basicOpusOptions: CalculationOptions = {
  model: 'claude-4-opus',
  inputTokens: 1000,
  outputTokens: 500,
};

// Options with cache operations
export const cacheOptions: CalculationOptions = {
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  cacheCreationTokens: 2000,
  cacheReadTokens: 5000,
};

// Options with reasoning enabled
export const reasoningOptions: CalculationOptions = {
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  reasoning: true,
};

// Complex scenario with all features
export const complexOptions: CalculationOptions = {
  model: 'claude-4-opus',
  inputTokens: 2500,
  outputTokens: 1200,
  cacheCreationTokens: 1500,
  cacheReadTokens: 8000,
  reasoning: true,
  region: 'us-east-1',
};

// Edge case scenarios
export const zeroTokenOptions: CalculationOptions = {
  model: 'claude-4-sonnet',
  inputTokens: 0,
  outputTokens: 0,
};

export const largeTokenOptions: CalculationOptions = {
  model: 'claude-4-opus',
  inputTokens: 1000000,
  outputTokens: 500000,
  cacheCreationTokens: 2000000,
  cacheReadTokens: 10000000,
};

// Batch calculation scenarios
export const batchOptions: CalculationOptions[] = [
  basicSonnetOptions,
  basicOpusOptions,
  cacheOptions,
  reasoningOptions,
];

export const emptyBatch: CalculationOptions[] = [];

// Expected result helpers
export const createExpectedImpact = (overrides: Partial<Claude4Impact> = {}): Partial<Claude4Impact> => ({
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  reasoning: false,
  ...overrides,
});

// Test utility functions
export const isValidTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
};

export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

export const expectValidImpact = (impact: Claude4Impact): void => {
  expect(impact).toHaveProperty('model');
  expect(impact).toHaveProperty('co2Grams');
  expect(impact).toHaveProperty('energyWh');
  expect(impact).toHaveProperty('waterLiters');
  expect(impact).toHaveProperty('inputTokens');
  expect(impact).toHaveProperty('outputTokens');
  expect(impact).toHaveProperty('reasoning');
  expect(impact).toHaveProperty('timestamp');
  
  expect(isPositiveNumber(impact.co2Grams)).toBe(true);
  expect(isPositiveNumber(impact.energyWh)).toBe(true);
  expect(isPositiveNumber(impact.waterLiters)).toBe(true);
  expect(isPositiveNumber(impact.inputTokens)).toBe(true);
  expect(isPositiveNumber(impact.outputTokens)).toBe(true);
  expect(typeof impact.reasoning).toBe('boolean');
  expect(isValidTimestamp(impact.timestamp)).toBe(true);
};

// Mathematical tolerance for floating point comparisons
export const MATH_TOLERANCE = 0.0001;

// Known calculation constants for validation
export const KNOWN_CONSTANTS = {
  SONNET_ENERGY_PER_TOKEN: 0.0012,
  OPUS_ENERGY_PER_TOKEN: 0.0045,
  PUE: 1.12,
  CARBON_INTENSITY: 0.385,
  WUE: 1.8,
  CACHE_CREATION_MULTIPLIER: 1.1,
  CACHE_RETRIEVAL_MULTIPLIER: 0.12,
  REASONING_MULTIPLIER: 2.5,
  JOULES_TO_KWH: 1 / 3_600_000,
  KG_TO_GRAMS: 1000,
  KWH_TO_WH: 1000,
} as const;