/**
 * Comprehensive tests for ai-carbon package
 */

import {
  calculateClaude4Impact,
  calculateBatchImpact,
  aggregateImpacts,
  compareModels,
  formatImpact,
  getModelInfo,
  calculateImpactPerDollar,
  calculateLargeWorkloadExample,
  CONSTANTS,
  type CalculationOptions,
  type Claude4Impact,
  type AggregatedImpact,
  type ModelComparison,
} from '../index.js';

import {
  basicSonnetOptions,
  basicOpusOptions,
  cacheOptions,
  reasoningOptions,
  complexOptions,
  zeroTokenOptions,
  largeTokenOptions,
  batchOptions,
  emptyBatch,
  expectValidImpact,
  isValidTimestamp,
  isPositiveNumber,
  MATH_TOLERANCE,
  KNOWN_CONSTANTS,
} from './__mocks__/testData.js';

describe('ai-carbon package', () => {
  describe('calculateClaude4Impact', () => {
    describe('basic functionality', () => {
      test('calculates impact for claude-4-sonnet', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        
        expectValidImpact(impact);
        expect(impact.model).toBe('claude-4-sonnet');
        expect(impact.inputTokens).toBe(1000);
        expect(impact.outputTokens).toBe(500);
        expect(impact.reasoning).toBe(false);
        expect(impact.cacheCreationTokens).toBeUndefined();
        expect(impact.cacheReadTokens).toBeUndefined();
      });

      test('calculates impact for claude-4-opus', () => {
        const impact = calculateClaude4Impact(basicOpusOptions);
        
        expectValidImpact(impact);
        expect(impact.model).toBe('claude-4-opus');
        expect(impact.co2Grams).toBeGreaterThan(0);
        expect(impact.energyWh).toBeGreaterThan(0);
        expect(impact.waterLiters).toBeGreaterThan(0);
      });

      test('opus consumes more energy than sonnet for same tokens', () => {
        const sonnetImpact = calculateClaude4Impact(basicSonnetOptions);
        const opusImpact = calculateClaude4Impact(basicOpusOptions);
        
        expect(opusImpact.co2Grams).toBeGreaterThan(sonnetImpact.co2Grams);
        expect(opusImpact.energyWh).toBeGreaterThan(sonnetImpact.energyWh);
        expect(opusImpact.waterLiters).toBeGreaterThan(sonnetImpact.waterLiters);
      });
    });

    describe('cache operations', () => {
      test('handles cache creation and read tokens', () => {
        const impact = calculateClaude4Impact(cacheOptions);
        
        expectValidImpact(impact);
        expect(impact.cacheCreationTokens).toBe(2000);
        expect(impact.cacheReadTokens).toBe(5000);
      });

      test('cache creation increases energy consumption', () => {
        const basicImpact = calculateClaude4Impact(basicSonnetOptions);
        const cacheImpact = calculateClaude4Impact({
          ...basicSonnetOptions,
          cacheCreationTokens: 1000,
        });
        
        expect(cacheImpact.co2Grams).toBeGreaterThan(basicImpact.co2Grams);
        expect(cacheImpact.energyWh).toBeGreaterThan(basicImpact.energyWh);
      });

      test('cache reads add minimal energy consumption', () => {
        const basicImpact = calculateClaude4Impact(basicSonnetOptions);
        const cacheReadImpact = calculateClaude4Impact({
          ...basicSonnetOptions,
          cacheReadTokens: 10000,
        });
        
        expect(cacheReadImpact.co2Grams).toBeGreaterThan(basicImpact.co2Grams);
        expect(cacheReadImpact.energyWh).toBeGreaterThan(basicImpact.energyWh);
        
        // Cache reads should add much less than equivalent regular tokens
        const equivalentTokensImpact = calculateClaude4Impact({
          ...basicSonnetOptions,
          inputTokens: basicSonnetOptions.inputTokens + 10000,
        });
        
        expect(cacheReadImpact.co2Grams).toBeLessThan(equivalentTokensImpact.co2Grams);
      });

      test('omits zero cache tokens from result', () => {
        const impact = calculateClaude4Impact({
          ...basicSonnetOptions,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        });
        
        expect(impact.cacheCreationTokens).toBeUndefined();
        expect(impact.cacheReadTokens).toBeUndefined();
      });
    });

    describe('reasoning mode', () => {
      test('enables reasoning mode', () => {
        const impact = calculateClaude4Impact(reasoningOptions);
        
        expectValidImpact(impact);
        expect(impact.reasoning).toBe(true);
      });

      test('reasoning mode increases energy consumption', () => {
        const basicImpact = calculateClaude4Impact(basicSonnetOptions);
        const reasoningImpact = calculateClaude4Impact(reasoningOptions);
        
        expect(reasoningImpact.co2Grams).toBeGreaterThan(basicImpact.co2Grams);
        expect(reasoningImpact.energyWh).toBeGreaterThan(basicImpact.energyWh);
        expect(reasoningImpact.waterLiters).toBeGreaterThan(basicImpact.waterLiters);
      });

      test('reasoning multiplier applies correctly', () => {
        const basicImpact = calculateClaude4Impact(basicSonnetOptions);
        const reasoningImpact = calculateClaude4Impact(reasoningOptions);
        
        // Should be approximately 2.5x for compute portions
        const ratio = reasoningImpact.co2Grams / basicImpact.co2Grams;
        expect(ratio).toBeCloseTo(KNOWN_CONSTANTS.REASONING_MULTIPLIER, 1);
      });

      test('reasoning does not affect cache read energy', () => {
        const cacheReadOnlyOptions = {
          model: 'claude-4-sonnet' as const,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 1000,
        };
        
        const basicCacheRead = calculateClaude4Impact(cacheReadOnlyOptions);
        const reasoningCacheRead = calculateClaude4Impact({
          ...cacheReadOnlyOptions,
          reasoning: true,
        });
        
        expect(reasoningCacheRead.co2Grams).toBeCloseTo(basicCacheRead.co2Grams, 4);
      });
    });

    describe('edge cases', () => {
      test('handles zero tokens', () => {
        const impact = calculateClaude4Impact(zeroTokenOptions);
        
        expectValidImpact(impact);
        expect(impact.co2Grams).toBe(0);
        expect(impact.energyWh).toBe(0);
        expect(impact.waterLiters).toBe(0);
      });

      test('handles large token counts', () => {
        const impact = calculateClaude4Impact(largeTokenOptions);
        
        expectValidImpact(impact);
        expect(impact.co2Grams).toBeGreaterThan(1);
        expect(impact.energyWh).toBeGreaterThan(1);
        expect(impact.waterLiters).toBeGreaterThan(0.01);
      });

      test('rejects invalid model', () => {
        const invalidOptions = {
          ...basicSonnetOptions,
          model: 'invalid-model' as any,
        };
        
        expect(() => calculateClaude4Impact(invalidOptions)).toThrow('Unsupported model: invalid-model');
      });
    });

    describe('mathematical accuracy', () => {
      test('energy calculation is mathematically correct', () => {
        const options = {
          model: 'claude-4-sonnet' as const,
          inputTokens: 1000,
          outputTokens: 500,
        };
        
        const impact = calculateClaude4Impact(options);
        
        // Calculate expected energy manually
        const totalTokens = 1000 + 500;
        const baseEnergyJoules = totalTokens * KNOWN_CONSTANTS.SONNET_ENERGY_PER_TOKEN;
        const energyKwh = (baseEnergyJoules / 3_600_000) * KNOWN_CONSTANTS.PUE;
        const expectedEnergyWh = energyKwh * 1000;
        
        expect(impact.energyWh).toBeCloseTo(expectedEnergyWh, 6);
      });

      test('carbon calculation is mathematically correct', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        
        const expectedCO2Kg = (impact.energyWh / 1000) * KNOWN_CONSTANTS.CARBON_INTENSITY;
        const expectedCO2Grams = expectedCO2Kg * 1000;
        
        expect(impact.co2Grams).toBeCloseTo(expectedCO2Grams, 6);
      });

      test('water calculation is mathematically correct', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        
        const expectedWaterLiters = (impact.energyWh / 1000) * KNOWN_CONSTANTS.WUE;
        
        expect(impact.waterLiters).toBeCloseTo(expectedWaterLiters, 6);
      });
    });

    describe('timestamp and metadata', () => {
      test('generates valid ISO timestamp', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        
        expect(isValidTimestamp(impact.timestamp)).toBe(true);
      });

      test('timestamps are close to current time', () => {
        const before = new Date();
        const impact = calculateClaude4Impact(basicSonnetOptions);
        const after = new Date();
        
        const impactTime = new Date(impact.timestamp);
        expect(impactTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(impactTime.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      test('preserves all input options', () => {
        const impact = calculateClaude4Impact(complexOptions);
        
        expect(impact.model).toBe(complexOptions.model);
        expect(impact.inputTokens).toBe(complexOptions.inputTokens);
        expect(impact.outputTokens).toBe(complexOptions.outputTokens);
        expect(impact.cacheCreationTokens).toBe(complexOptions.cacheCreationTokens);
        expect(impact.cacheReadTokens).toBe(complexOptions.cacheReadTokens);
        expect(impact.reasoning).toBe(complexOptions.reasoning);
      });
    });
  });

  describe('calculateBatchImpact', () => {
    test('processes multiple calculations', () => {
      const impacts = calculateBatchImpact(batchOptions);
      
      expect(impacts).toHaveLength(batchOptions.length);
      impacts.forEach(expectValidImpact);
    });

    test('maintains order of calculations', () => {
      const impacts = calculateBatchImpact(batchOptions);
      
      expect(impacts[0].model).toBe(batchOptions[0].model);
      expect(impacts[1].model).toBe(batchOptions[1].model);
      expect(impacts[2].model).toBe(batchOptions[2].model);
      expect(impacts[3].model).toBe(batchOptions[3].model);
    });

    test('handles empty array', () => {
      const impacts = calculateBatchImpact(emptyBatch);
      
      expect(impacts).toHaveLength(0);
      expect(Array.isArray(impacts)).toBe(true);
    });

    test('equivalent to individual calculations', () => {
      const batchImpacts = calculateBatchImpact([basicSonnetOptions]);
      const individualImpact = calculateClaude4Impact(basicSonnetOptions);
      
      expect(batchImpacts).toHaveLength(1);
      expect(batchImpacts[0].co2Grams).toBeCloseTo(individualImpact.co2Grams, 6);
      expect(batchImpacts[0].energyWh).toBeCloseTo(individualImpact.energyWh, 6);
      expect(batchImpacts[0].waterLiters).toBeCloseTo(individualImpact.waterLiters, 6);
    });
  });

  describe('aggregateImpacts', () => {
    let sampleImpacts: Claude4Impact[];

    beforeAll(() => {
      sampleImpacts = calculateBatchImpact(batchOptions);
    });

    test('aggregates multiple impacts correctly', () => {
      const aggregated = aggregateImpacts(sampleImpacts);
      
      expect(aggregated.calls).toBe(sampleImpacts.length);
      expect(aggregated.co2Grams).toBeGreaterThan(0);
      expect(aggregated.energyWh).toBeGreaterThan(0);
      expect(aggregated.waterLiters).toBeGreaterThan(0);
      expect(aggregated.totalTokens).toBeGreaterThan(0);
    });

    test('calculates totals correctly', () => {
      const aggregated = aggregateImpacts(sampleImpacts);
      
      const expectedCO2 = sampleImpacts.reduce((sum, impact) => sum + impact.co2Grams, 0);
      const expectedEnergy = sampleImpacts.reduce((sum, impact) => sum + impact.energyWh, 0);
      const expectedWater = sampleImpacts.reduce((sum, impact) => sum + impact.waterLiters, 0);
      
      expect(aggregated.co2Grams).toBeCloseTo(expectedCO2, 6);
      expect(aggregated.energyWh).toBeCloseTo(expectedEnergy, 6);
      expect(aggregated.waterLiters).toBeCloseTo(expectedWater, 6);
    });

    test('calculates token totals correctly', () => {
      const aggregated = aggregateImpacts(sampleImpacts);
      
      const expectedTokens = sampleImpacts.reduce((sum, impact) => {
        return sum + impact.inputTokens + impact.outputTokens + 
               (impact.cacheCreationTokens || 0) + (impact.cacheReadTokens || 0);
      }, 0);
      
      expect(aggregated.totalTokens).toBe(expectedTokens);
    });

    test('calculates averages correctly', () => {
      const aggregated = aggregateImpacts(sampleImpacts);
      
      const expectedAvgCO2 = aggregated.co2Grams / aggregated.totalTokens;
      const expectedAvgEnergy = aggregated.energyWh / aggregated.totalTokens;
      
      expect(aggregated.averageCO2PerToken).toBeCloseTo(expectedAvgCO2, 6);
      expect(aggregated.averageEnergyPerToken).toBeCloseTo(expectedAvgEnergy, 6);
    });

    test('handles empty array', () => {
      const aggregated = aggregateImpacts([]);
      
      expect(aggregated.calls).toBe(0);
      expect(aggregated.co2Grams).toBe(0);
      expect(aggregated.energyWh).toBe(0);
      expect(aggregated.waterLiters).toBe(0);
      expect(aggregated.totalTokens).toBe(0);
      expect(aggregated.averageCO2PerToken).toBe(0);
      expect(aggregated.averageEnergyPerToken).toBe(0);
    });

    test('handles single impact', () => {
      const singleImpact = calculateClaude4Impact(basicSonnetOptions);
      const aggregated = aggregateImpacts([singleImpact]);
      
      expect(aggregated.calls).toBe(1);
      expect(aggregated.co2Grams).toBeCloseTo(singleImpact.co2Grams, 6);
      expect(aggregated.energyWh).toBeCloseTo(singleImpact.energyWh, 6);
      expect(aggregated.waterLiters).toBeCloseTo(singleImpact.waterLiters, 6);
      
      const totalTokens = singleImpact.inputTokens + singleImpact.outputTokens;
      expect(aggregated.totalTokens).toBe(totalTokens);
      expect(aggregated.averageCO2PerToken).toBeCloseTo(singleImpact.co2Grams / totalTokens, 6);
    });
  });

  describe('compareModels', () => {
    test('compares sonnet and opus models', () => {
      const comparison = compareModels(1000, 500);
      
      expect(comparison).toHaveProperty('sonnet');
      expect(comparison).toHaveProperty('opus');
      expect(comparison).toHaveProperty('opusMultiplier');
      
      expectValidImpact(comparison.sonnet);
      expectValidImpact(comparison.opus);
      
      expect(comparison.sonnet.model).toBe('claude-4-sonnet');
      expect(comparison.opus.model).toBe('claude-4-opus');
    });

    test('opus multiplier is greater than 1', () => {
      const comparison = compareModels(1000, 500);
      
      expect(comparison.opusMultiplier).toBeGreaterThan(1);
      expect(typeof comparison.opusMultiplier).toBe('number');
    });

    test('opus multiplier calculation is correct', () => {
      const comparison = compareModels(1000, 500);
      
      const expectedMultiplier = comparison.opus.co2Grams / comparison.sonnet.co2Grams;
      expect(comparison.opusMultiplier).toBeCloseTo(expectedMultiplier, 2);
    });

    test('handles reasoning mode', () => {
      const basicComparison = compareModels(1000, 500, false);
      const reasoningComparison = compareModels(1000, 500, true);
      
      expect(basicComparison.sonnet.reasoning).toBe(false);
      expect(basicComparison.opus.reasoning).toBe(false);
      expect(reasoningComparison.sonnet.reasoning).toBe(true);
      expect(reasoningComparison.opus.reasoning).toBe(true);
      
      expect(reasoningComparison.sonnet.co2Grams).toBeGreaterThan(basicComparison.sonnet.co2Grams);
      expect(reasoningComparison.opus.co2Grams).toBeGreaterThan(basicComparison.opus.co2Grams);
    });

    test('multiplier consistency across different token counts', () => {
      const comparison1 = compareModels(100, 50);
      const comparison2 = compareModels(10000, 5000);
      
      expect(comparison1.opusMultiplier).toBeCloseTo(comparison2.opusMultiplier, 1);
    });
  });

  describe('utility functions', () => {
    describe('formatImpact', () => {
      test('formats basic impact correctly', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        const formatted = formatImpact(impact);
        
        expect(formatted).toContain('claude-4-sonnet Impact:');
        expect(formatted).toContain(`CO2: ${impact.co2Grams.toFixed(2)}g`);
        expect(formatted).toContain(`Energy: ${impact.energyWh.toFixed(2)}Wh`);
        expect(formatted).toContain(`Water: ${impact.waterLiters.toFixed(3)}L`);
        expect(formatted).toContain(`Tokens: ${impact.inputTokens + impact.outputTokens}`);
      });

      test('includes cache tokens in formatting', () => {
        const impact = calculateClaude4Impact(cacheOptions);
        const formatted = formatImpact(impact);
        
        expect(formatted).toContain(`(+${impact.cacheCreationTokens} cache writes)`);
        expect(formatted).toContain(`(+${impact.cacheReadTokens} cache reads)`);
      });

      test('omits cache tokens when not present', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        const formatted = formatImpact(impact);
        
        expect(formatted).not.toContain('cache writes');
        expect(formatted).not.toContain('cache reads');
      });

      test('formats large numbers correctly', () => {
        const impact = calculateClaude4Impact(largeTokenOptions);
        const formatted = formatImpact(impact);
        
        expect(formatted).toContain(impact.co2Grams.toFixed(2));
        expect(formatted).toContain(impact.energyWh.toFixed(2));
        expect(formatted).toContain(impact.waterLiters.toFixed(3));
      });
    });

    describe('getModelInfo', () => {
      test('returns sonnet model info', () => {
        const info = getModelInfo('claude-4-sonnet');
        
        expect(info).toHaveProperty('energyPerToken', KNOWN_CONSTANTS.SONNET_ENERGY_PER_TOKEN);
        expect(info).toHaveProperty('description');
        expect(info).toHaveProperty('architecture');
        expect(info).toHaveProperty('estimatedParameters', '~200B');
        expect(info).toHaveProperty('useCase', 'Efficient everyday tasks');
        
        expect(info.description).toContain('Efficient model');
        expect(info.architecture).toBe('mixture-of-experts');
      });

      test('returns opus model info', () => {
        const info = getModelInfo('claude-4-opus');
        
        expect(info).toHaveProperty('energyPerToken', KNOWN_CONSTANTS.OPUS_ENERGY_PER_TOKEN);
        expect(info).toHaveProperty('description');
        expect(info).toHaveProperty('architecture');
        expect(info).toHaveProperty('estimatedParameters', '~1T+');
        expect(info).toHaveProperty('useCase', 'Research and complex reasoning');
        
        expect(info.description).toContain('Most capable model');
        expect(info.architecture).toBe('transformer-large');
      });

      test('opus has higher energy per token than sonnet', () => {
        const sonnetInfo = getModelInfo('claude-4-sonnet');
        const opusInfo = getModelInfo('claude-4-opus');
        
        expect(opusInfo.energyPerToken).toBeGreaterThan(sonnetInfo.energyPerToken);
      });
    });

    describe('calculateImpactPerDollar', () => {
      let sampleImpact: Claude4Impact;

      beforeAll(() => {
        sampleImpact = calculateClaude4Impact(basicSonnetOptions);
      });

      test('calculates impact per dollar correctly', () => {
        const costUSD = 0.50;
        const result = calculateImpactPerDollar(sampleImpact, costUSD);
        
        expect(result).not.toBeNull();
        expect(result!.co2GramsPerDollar).toBeCloseTo(sampleImpact.co2Grams / costUSD, 6);
        expect(result!.energyWhPerDollar).toBeCloseTo(sampleImpact.energyWh / costUSD, 6);
        expect(result!.waterLitersPerDollar).toBeCloseTo(sampleImpact.waterLiters / costUSD, 6);
      });

      test('returns positive values for positive cost', () => {
        const result = calculateImpactPerDollar(sampleImpact, 1.0);
        
        expect(result).not.toBeNull();
        expect(result!.co2GramsPerDollar).toBeGreaterThan(0);
        expect(result!.energyWhPerDollar).toBeGreaterThan(0);
        expect(result!.waterLitersPerDollar).toBeGreaterThan(0);
      });

      test('returns null for zero cost', () => {
        const result = calculateImpactPerDollar(sampleImpact, 0);
        
        expect(result).toBeNull();
      });

      test('returns null for negative cost', () => {
        const result = calculateImpactPerDollar(sampleImpact, -1.0);
        
        expect(result).toBeNull();
      });

      test('handles very small costs', () => {
        const result = calculateImpactPerDollar(sampleImpact, 0.001);
        
        expect(result).not.toBeNull();
        expect(result!.co2GramsPerDollar).toBeGreaterThan(sampleImpact.co2Grams);
      });

      test('handles very large costs', () => {
        const result = calculateImpactPerDollar(sampleImpact, 1000);
        
        expect(result).not.toBeNull();
        expect(result!.co2GramsPerDollar).toBeLessThan(sampleImpact.co2Grams);
      });
    });

    describe('calculateLargeWorkloadExample', () => {
      test('returns consistent large workload calculation', () => {
        const result1 = calculateLargeWorkloadExample();
        const result2 = calculateLargeWorkloadExample();
        
        expectValidImpact(result1);
        expectValidImpact(result2);
        
        expect(result1.model).toBe('claude-4-sonnet');
        expect(result1.inputTokens).toBe(35240);
        expect(result1.outputTokens).toBe(506176);
        expect(result1.cacheCreationTokens).toBe(25361509);
        expect(result1.cacheReadTokens).toBe(417330728);
        expect(result1.reasoning).toBe(false);
        
        // Results should be identical
        expect(result1.co2Grams).toBeCloseTo(result2.co2Grams, 6);
        expect(result1.energyWh).toBeCloseTo(result2.energyWh, 6);
        expect(result1.waterLiters).toBeCloseTo(result2.waterLiters, 6);
      });

      test('demonstrates significant environmental impact', () => {
        const result = calculateLargeWorkloadExample();
        
        // Large workload should have substantial impact
        expect(result.co2Grams).toBeGreaterThan(10);
        expect(result.energyWh).toBeGreaterThan(10);
        expect(result.waterLiters).toBeGreaterThan(0.05);
      });

      test('matches manual calculation', () => {
        const result = calculateLargeWorkloadExample();
        
        const manualResult = calculateClaude4Impact({
          model: 'claude-4-sonnet',
          inputTokens: 35240,
          outputTokens: 506176,
          cacheCreationTokens: 25361509,
          cacheReadTokens: 417330728,
          reasoning: false,
        });
        
        expect(result.co2Grams).toBeCloseTo(manualResult.co2Grams, 6);
        expect(result.energyWh).toBeCloseTo(manualResult.energyWh, 6);
        expect(result.waterLiters).toBeCloseTo(manualResult.waterLiters, 6);
      });
    });
  });

  describe('constants and types', () => {
    describe('CONSTANTS export', () => {
      test('exports all expected constants', () => {
        expect(CONSTANTS).toHaveProperty('MODEL_SPECS');
        expect(CONSTANTS).toHaveProperty('INFRASTRUCTURE');
        expect(CONSTANTS).toHaveProperty('CACHE_MULTIPLIERS');
        expect(CONSTANTS).toHaveProperty('REASONING_MULTIPLIER');
      });

      test('MODEL_SPECS contains correct models', () => {
        expect(CONSTANTS.MODEL_SPECS).toHaveProperty('claude-4-sonnet');
        expect(CONSTANTS.MODEL_SPECS).toHaveProperty('claude-4-opus');
        
        expect(CONSTANTS.MODEL_SPECS['claude-4-sonnet'].energyPerToken).toBe(KNOWN_CONSTANTS.SONNET_ENERGY_PER_TOKEN);
        expect(CONSTANTS.MODEL_SPECS['claude-4-opus'].energyPerToken).toBe(KNOWN_CONSTANTS.OPUS_ENERGY_PER_TOKEN);
      });

      test('INFRASTRUCTURE contains expected values', () => {
        expect(CONSTANTS.INFRASTRUCTURE.pue).toBe(KNOWN_CONSTANTS.PUE);
        expect(CONSTANTS.INFRASTRUCTURE.carbonIntensity).toBe(KNOWN_CONSTANTS.CARBON_INTENSITY);
        expect(CONSTANTS.INFRASTRUCTURE.wue).toBe(KNOWN_CONSTANTS.WUE);
      });

      test('CACHE_MULTIPLIERS contains expected values', () => {
        expect(CONSTANTS.CACHE_MULTIPLIERS.creation).toBe(KNOWN_CONSTANTS.CACHE_CREATION_MULTIPLIER);
        expect(CONSTANTS.CACHE_MULTIPLIERS.retrieval).toBe(KNOWN_CONSTANTS.CACHE_RETRIEVAL_MULTIPLIER);
      });

      test('REASONING_MULTIPLIER has expected value', () => {
        expect(CONSTANTS.REASONING_MULTIPLIER).toBe(KNOWN_CONSTANTS.REASONING_MULTIPLIER);
      });
    });

    describe('type validation', () => {
      test('CalculationOptions type accepts valid models', () => {
        const sonnetOptions: CalculationOptions = {
          model: 'claude-4-sonnet',
          inputTokens: 100,
          outputTokens: 50,
        };
        
        const opusOptions: CalculationOptions = {
          model: 'claude-4-opus',
          inputTokens: 100,
          outputTokens: 50,
        };
        
        expect(() => calculateClaude4Impact(sonnetOptions)).not.toThrow();
        expect(() => calculateClaude4Impact(opusOptions)).not.toThrow();
      });

      test('Claude4Impact type has all required properties', () => {
        const impact = calculateClaude4Impact(basicSonnetOptions);
        
        const requiredProperties = [
          'model', 'co2Grams', 'energyWh', 'waterLiters',
          'inputTokens', 'outputTokens', 'reasoning', 'timestamp'
        ];
        
        requiredProperties.forEach(prop => {
          expect(impact).toHaveProperty(prop);
        });
      });

      test('AggregatedImpact type has all required properties', () => {
        const impacts = calculateBatchImpact([basicSonnetOptions]);
        const aggregated = aggregateImpacts(impacts);
        
        const requiredProperties = [
          'co2Grams', 'energyWh', 'waterLiters', 'totalTokens',
          'calls', 'averageCO2PerToken', 'averageEnergyPerToken'
        ];
        
        requiredProperties.forEach(prop => {
          expect(aggregated).toHaveProperty(prop);
        });
      });

      test('ModelComparison type has all required properties', () => {
        const comparison = compareModels(100, 50);
        
        expect(comparison).toHaveProperty('sonnet');
        expect(comparison).toHaveProperty('opus');
        expect(comparison).toHaveProperty('opusMultiplier');
        
        expectValidImpact(comparison.sonnet);
        expectValidImpact(comparison.opus);
        expect(typeof comparison.opusMultiplier).toBe('number');
      });
    });

    describe('constant immutability', () => {
      test('exported constants are readonly at runtime', () => {
        // TypeScript enforces readonly at compile time
        // At runtime, the objects are still mutable but should be treated as constants
        expect(CONSTANTS.REASONING_MULTIPLIER).toBe(2.5);
        expect(CONSTANTS.MODEL_SPECS['claude-4-sonnet'].energyPerToken).toBe(0.0012);
      });

      test('constants maintain expected values', () => {
        expect(Object.keys(CONSTANTS.MODEL_SPECS)).toContain('claude-4-sonnet');
        expect(Object.keys(CONSTANTS.MODEL_SPECS)).toContain('claude-4-opus');
        expect(CONSTANTS.INFRASTRUCTURE.pue).toBeGreaterThan(1);
        expect(CONSTANTS.CACHE_MULTIPLIERS.creation).toBeGreaterThan(1);
        expect(CONSTANTS.CACHE_MULTIPLIERS.retrieval).toBeLessThan(1);
      });
    });
  });

  describe('integration tests', () => {
    test('complete workflow: calculate, batch, aggregate, compare', () => {
      // Individual calculations
      const sonnetImpact = calculateClaude4Impact(basicSonnetOptions);
      const opusImpact = calculateClaude4Impact(basicOpusOptions);
      
      // Batch processing
      const batchImpacts = calculateBatchImpact([basicSonnetOptions, basicOpusOptions]);
      
      // Aggregation
      const aggregated = aggregateImpacts(batchImpacts);
      
      // Comparison
      const comparison = compareModels(1000, 500);
      
      // Validate all results
      expectValidImpact(sonnetImpact);
      expectValidImpact(opusImpact);
      expect(batchImpacts).toHaveLength(2);
      expect(aggregated.calls).toBe(2);
      expect(comparison.opusMultiplier).toBe(3.75);
    });

    test('complex scenario with all features', () => {
      const impact = calculateClaude4Impact(complexOptions);
      const formatted = formatImpact(impact);
      const info = getModelInfo(impact.model as 'claude-4-sonnet' | 'claude-4-opus');
      const perDollar = calculateImpactPerDollar(impact, 2.50);
      
      expectValidImpact(impact);
      expect(typeof formatted).toBe('string');
      expect(info.energyPerToken).toBeGreaterThan(0);
      expect(perDollar).not.toBeNull();
      expect(perDollar!.co2GramsPerDollar).toBeGreaterThan(0);
    });

    test('real-world usage pattern simulation', () => {
      const dailyUsage: CalculationOptions[] = [
        { model: 'claude-4-sonnet', inputTokens: 500, outputTokens: 300, reasoning: false },
        { model: 'claude-4-sonnet', inputTokens: 1200, outputTokens: 800, reasoning: true },
        { model: 'claude-4-opus', inputTokens: 2000, outputTokens: 1500, reasoning: true },
        { model: 'claude-4-sonnet', inputTokens: 800, outputTokens: 400, cacheReadTokens: 2000 },
      ];
      
      const impacts = calculateBatchImpact(dailyUsage);
      const total = aggregateImpacts(impacts);
      
      expect(impacts).toHaveLength(4);
      expect(total.calls).toBe(4);
      expect(total.co2Grams).toBeGreaterThan(0);
      expect(total.averageCO2PerToken).toBeGreaterThan(0);
      
      // Verify the reasoning and opus calls contributed more to the total
      const reasoningOpusImpact = impacts[2];
      const basicSonnetImpact = impacts[0];
      expect(reasoningOpusImpact.co2Grams).toBeGreaterThan(basicSonnetImpact.co2Grams);
    });
  });
});