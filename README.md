# ai-carbon

[![npm version](https://img.shields.io/npm/v/ai-carbon)](https://www.npmjs.com/package/ai-carbon)

A comprehensive TypeScript package for calculating the environmental impact of AI model usage across multiple providers: Claude, OpenAI GPT, and Google Gemini.

## Overview

`ai-carbon` provides real-time carbon footprint calculations for AI inference operations across all major LLM providers. Track CO2 emissions, energy consumption, and water usage to optimize for both performance and environmental impact.

**Key Features:**
- 🌍 **Multi-provider support**: Claude, OpenAI, and Gemini models
- ⚡ **Zero-dependency** client-side calculations
- 📊 **Real-time environmental tracking** (CO2, energy, water)
- 🏆 **Provider efficiency comparisons** with ranking system
- 🧠 **Reasoning mode support** with accurate cost modeling
- 💾 **Cache-aware calculations** for optimized workloads
- 🌐 **Regional infrastructure differences** (PUE, renewable energy)
- 📈 **Research-backed methodology** with academic references

## Installation

```bash
npm install ai-carbon
```

## Quick Start

### Multi-Provider Comparison

```typescript
import { calculateImpact, compareProviders } from 'ai-carbon';

// Calculate impact for any provider
const claudeImpact = await calculateImpact({
  provider: 'claude',
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500
});

const openaiImpact = await calculateImpact({
  provider: 'openai',
  model: 'gpt-4o',
  inputTokens: 1000,
  outputTokens: 500
});

const geminiImpact = await calculateImpact({
  provider: 'gemini',
  model: 'gemini-2.5-pro',
  inputTokens: 1000,
  outputTokens: 500
});

console.log(`Claude: ${claudeImpact.co2Grams.toFixed(4)}g CO2`);
console.log(`OpenAI: ${openaiImpact.co2Grams.toFixed(4)}g CO2`);
console.log(`Gemini: ${geminiImpact.co2Grams.toFixed(4)}g CO2`);
```

### Automatic Provider Comparison

```typescript
import { compareProviders, getProviderEfficiencyRanking } from 'ai-carbon';

// Compare all providers automatically
const comparison = await compareProviders(1000, 500);
console.log('Claude CO2:', comparison.claude.co2Grams);
console.log('OpenAI CO2:', comparison.openai.co2Grams);
console.log('Gemini CO2:', comparison.gemini.co2Grams);

// Get efficiency ranking (lowest CO2 first)
const ranking = await getProviderEfficiencyRanking(1000, 500);
ranking.forEach((item, index) => {
  console.log(`${index + 1}. ${item.provider}: ${item.co2Grams.toFixed(4)}g CO2`);
});
```

## Supported Models

### Claude (Anthropic)
| Model | Energy/Token | Architecture | Use Case |
|-------|--------------|--------------|----------|
| `claude-4-sonnet` | 0.0012 J/token | Mixture-of-Experts | Efficient everyday tasks |
| `claude-4-opus` | 0.0045 J/token | Transformer-Large | Advanced reasoning |

### OpenAI (Microsoft Azure)
| Model | Energy/Token | Architecture | Use Case |
|-------|--------------|--------------|----------|
| `gpt-4o` | 0.0025 J/token | Transformer-Large | Optimized efficiency |
| `gpt-4` | 0.0035 J/token | Transformer-Large | Advanced capabilities |
| `gpt-4-turbo` | 0.0030 J/token | Transformer-Large | Speed optimized |
| `o1-preview` | 0.0250 J/token | Reasoning-Enhanced | Complex problem solving |

### Google Gemini
| Model | Energy/Token | Architecture | Use Case |
|-------|--------------|--------------|----------|
| `gemini-2.5-pro` | 0.0008 J/token | MoE-TPU | Superior efficiency |
| `gemini-1.5-pro` | 0.0010 J/token | MoE-TPU | Multimodal tasks |

## Provider Efficiency Comparison

Based on our research-backed calculations for 1000 input + 500 output tokens:

| Rank | Provider | Model | CO2 Emissions | Efficiency vs Baseline |
|------|----------|-------|---------------|------------------------|
| 1🥇 | **Gemini** | gemini-2.5-pro | ~0.000024g | **72% less than Claude** |
| 2🥈 | **OpenAI** | gpt-4o | ~0.000000g* | **100% renewable** |
| 3🥉 | **Claude** | claude-4-sonnet | ~0.000086g | Baseline |

*OpenAI shows minimal CO2 due to Microsoft's renewable energy commitments

## Advanced Usage

### Reasoning Mode Impact

```typescript
// Claude reasoning mode (2.5x multiplier)
const claudeReasoning = await calculateImpact({
  provider: 'claude',
  model: 'claude-4-sonnet',
  inputTokens: 2000,
  outputTokens: 1000,
  reasoning: true  // 2.5x energy increase
});

// OpenAI o1-preview (built-in reasoning)
const openaiReasoning = await calculateImpact({
  provider: 'openai',
  model: 'o1-preview',  // 10x base energy due to reasoning tokens
  inputTokens: 2000,
  outputTokens: 1000
});
```

### Cache Operations (Claude)

```typescript
const cachedWorkload = await calculateImpact({
  provider: 'claude',
  model: 'claude-4-sonnet',
  inputTokens: 35240,
  outputTokens: 506176,
  cacheCreationTokens: 25361509,  // 1.1x cost
  cacheReadTokens: 417330728      // 0.12x cost
});
```

### Regional Infrastructure Differences

```typescript
// Different regions have different carbon intensities
const usEast = await calculateImpact({
  provider: 'claude',
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  region: 'us-east-1'  // Higher carbon intensity
});

const usWest = await calculateImpact({
  provider: 'claude',
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  region: 'us-west-2'  // Lower carbon intensity
});
```

### Batch Processing and Aggregation

```typescript
import { calculateBatchImpactMultiProvider, aggregateEmissions } from 'ai-carbon';

const multiProviderRequests = [
  { provider: 'claude', model: 'claude-4-sonnet', inputTokens: 1000, outputTokens: 500 },
  { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 },
  { provider: 'gemini', model: 'gemini-2.5-pro', inputTokens: 1000, outputTokens: 500 }
];

const results = await calculateBatchImpactMultiProvider(multiProviderRequests);
const summary = aggregateEmissions(results);

console.log(`Total CO2: ${summary.co2Grams}g across ${summary.calls} providers`);
console.log(`Average CO2 per token: ${summary.averageCO2PerToken}g`);
```

## API Reference

### Multi-Provider Functions

#### `calculateImpact(options: MultiProviderOptions): Promise<EmissionResult>`

Calculate environmental impact for any supported AI model.

```typescript
interface MultiProviderOptions {
  provider: 'claude' | 'openai' | 'gemini';
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: string;
}
```

#### `compareProviders(inputTokens: number, outputTokens: number, reasoning?: boolean)`

Compare environmental impact across all three providers using their most efficient models.

#### `getProviderEfficiencyRanking(inputTokens: number, outputTokens: number)`

Get providers ranked by efficiency (lowest CO2 emissions first).

#### `getSupportedProviders(): string[]`

Get list of all supported providers.

#### `getSupportedModels(provider: string): string[]`

Get list of supported models for a specific provider.

### Utility Functions

#### `formatEmissionResult(result: EmissionResult): string`

Format emission results for human-readable output.

#### `aggregateEmissions(emissions: EmissionResult[]): AggregatedImpact`

Aggregate multiple emission results for reporting.

### Legacy Functions (Backward Compatible)

All original Claude-specific functions remain available:
- `calculateClaude4Impact()`
- `calculateBatchImpact()`
- `aggregateImpacts()`
- `compareModels()`

## Methodology

### Energy Calculation Formula

```
Energy = (Token Count × Model Energy/Token × Architecture Multiplier × 
         Reasoning Multiplier × Output Token Multiplier) / Hardware Efficiency
```

### Provider-Specific Calculations

**Claude (AWS Infrastructure):**
- PUE: 1.12, Regional renewable energy: 60-75%
- Cache operations: Creation 1.1x, Retrieval 0.12x
- Reasoning mode: 2.5x multiplier

**OpenAI (Microsoft Azure):**
- PUE: 1.12, Renewable energy: 85-95%
- Output tokens: 4.5x energy cost (memory bandwidth bottleneck)
- o1-preview: 10x base energy for reasoning tokens

**Gemini (Google Cloud):**
- PUE: 1.09 (industry-leading), Renewable energy: 64-90%
- TPU efficiency: 0.5x vs GPU equivalent
- Balanced input/output costs

### Carbon Intensity Calculation

```
CO2 = Energy (kWh) × Regional Carbon Intensity × (1 - Renewable %) × PUE
```

Regional carbon intensities vary from Sweden (41g/kWh) to India (713g/kWh).

## Research Foundation

This package implements findings from extensive academic research:

### Core Methodology
- [LLMCarbon: Modeling the end-to-end Carbon Footprint of Large Language Models](https://arxiv.org/abs/2309.14393)
- [LLMCO2: Advancing Accurate Carbon Footprint Prediction for LLM Inferences](https://arxiv.org/html/2410.02950v1)
- [Offline Energy-Optimal LLM Serving](https://arxiv.org/html/2407.04014v1)

### Provider Analysis
- **Google TPU Efficiency**: 30x improvement over 2018 baseline, 0.5x vs GPU
- **Microsoft Azure**: 100% renewable commitment by 2025, PUE improvements
- **Anthropic Claude**: Mixture-of-experts architecture efficiency analysis

### Architecture Research
- [Understanding KV Cache Optimization](https://magazine.sebastianraschka.com/p/coding-the-kv-cache-in-llms)
- [Mixture-of-Experts Energy Analysis](https://arxiv.org/abs/2101.03961)
- [Transformer Energy Benchmarking](https://arxiv.org/pdf/2310.03003)

## Environmental Impact by Use Case

### Typical Usage Patterns

| Task Type | Input:Output Ratio | Recommended Provider | Estimated CO2/1K tokens |
|-----------|-------------------|---------------------|------------------------|
| **Code Generation** | 1:5 | Gemini 2.5 Pro | 0.000048g |
| **Document Analysis** | 10:1 | Claude 4 Sonnet | 0.000086g |
| **Complex Reasoning** | 1:3 | o1-preview | 0.000250g |
| **Content Creation** | 1:10 | Gemini 2.5 Pro | 0.000072g |

### Real-World Impact Examples

```typescript
// Daily coding assistant (10K tokens/day)
// Gemini: ~0.00048g CO2/day = 0.175g CO2/year
// Claude: ~0.00086g CO2/day = 0.314g CO2/year
// Difference: 44% less emissions with Gemini

// Enterprise document processing (1M tokens/day)  
// Gemini: ~0.048g CO2/day = 17.5g CO2/year
// Claude: ~0.086g CO2/day = 31.4g CO2/year
// Difference: 44% less emissions with Gemini
```

## Contributing

We welcome contributions to expand model support and improve accuracy:

1. **Additional Models**: Help add support for new LLM families
2. **Infrastructure Data**: Update datacenter PUE and renewable energy data
3. **Regional Factors**: Add carbon intensity data for more regions
4. **Validation**: Compare estimates against real measurements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Limitations

- **Estimates Only**: Based on architectural analysis and research, not direct measurements
- **Infrastructure Assumptions**: Uses published datacenter specs and renewable energy commitments
- **Dynamic Factors**: Does not account for real-time carbon intensity or demand-based scaling
- **Model Variations**: Energy can vary based on input complexity and model versions

## License

MIT License - see [LICENSE](https://github.com/eharris128/ai-carbon/blob/main/LICENSE) file for details.

## Acknowledgments

Built on research from:
- **Anthropic** (Claude architecture insights)
- **OpenAI & Microsoft** (GPT energy profiling and Azure infrastructure)
- **Google** (Gemini efficiency research and TPU specifications)
- **Academic community** studying AI environmental impact

---

**Note**: This package provides estimates for educational and optimization purposes. For official carbon reporting, consider professional environmental impact assessments.