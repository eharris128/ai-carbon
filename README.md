# ai-carbon

A TypeScript package for calculating the environmental impact of AI model usage, starting with Claude 4 models from Anthropic.

## Overview

`ai-carbon` provides real-time carbon footprint calculations for AI inference operations. Track CO2 emissions, energy consumption, and water usage across different AI models to optimize for both performance and environmental impact.

**Key Features:**
- Zero-dependency client-side calculations
- Real-time environmental impact tracking
- Comprehensive metrics (CO2, energy, water usage)
- Claude 4 Sonnet and Opus support
- Cache-aware calculations for optimized workloads
- Research-backed methodology

## Installation

```bash
npm install ai-carbon
```

## Quick Start

```typescript
import { calculateClaude4Impact } from 'ai-carbon';

// Calculate impact for a Claude API call
const impact = calculateClaude4Impact({
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  reasoning: false
});

console.log(`CO2 Impact: ${impact.co2Grams.toFixed(2)}g`);
console.log(`Energy: ${impact.energyWh.toFixed(2)}Wh`);
console.log(`Water: ${impact.waterLiters.toFixed(3)}L`);
```

## Supported Models

| Model | Energy per Token | Use Case |
|-------|------------------|----------|
| `claude-4-sonnet` | 0.0012 J/token | Efficient, everyday tasks |
| `claude-4-opus` | 0.0045 J/token | Most capable, research tasks |

## Advanced Usage

### Cache Operations

For workloads using Claude's caching features:

```typescript
const impact = calculateClaude4Impact({
  model: 'claude-4-sonnet',
  inputTokens: 35240,
  outputTokens: 506176,
  cacheCreationTokens: 25361509,  // Cache writes
  cacheReadTokens: 417330728,     // Cache hits
  reasoning: false
});

// Result: ~3.08kg CO2 for this large cached workload
```

### Reasoning Mode

Claude 4 reasoning mode uses significantly more compute:

```typescript
const reasoningImpact = calculateClaude4Impact({
  model: 'claude-4-opus',
  inputTokens: 2000,
  outputTokens: 1000,
  reasoning: true  // 2.5x energy multiplier
});
```

### Batch Calculations

```typescript
import { calculateBatchImpact, aggregateImpacts } from 'ai-carbon';

const requests = [
  { model: 'claude-4-sonnet', inputTokens: 100, outputTokens: 50 },
  { model: 'claude-4-opus', inputTokens: 200, outputTokens: 100 }
];

const impacts = calculateBatchImpact(requests);
const summary = aggregateImpacts(impacts);

console.log(`Total CO2: ${summary.co2Grams}g across ${summary.calls} calls`);
```

### Model Comparison

```typescript
import { compareModels } from 'ai-carbon';

const comparison = compareModels(1000, 500);
console.log(`Opus uses ${comparison.opusMultiplier.toFixed(1)}x more CO2 than Sonnet`);
```

## API Reference

### Types

```typescript
interface CalculationOptions {
  model: 'claude-4-sonnet' | 'claude-4-opus';
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: boolean;
  region?: string;
}

interface Claude4Impact {
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
```

### Functions

#### `calculateClaude4Impact(options: CalculationOptions): Claude4Impact`

Calculate environmental impact for a single Claude 4 API call.

#### `calculateBatchImpact(calculations: CalculationOptions[]): Claude4Impact[]`

Process multiple calculations efficiently.

#### `aggregateImpacts(impacts: Claude4Impact[])`

Aggregate multiple impact calculations for reporting.

```typescript
// Returns:
{
  co2Grams: number;
  energyWh: number;
  waterLiters: number;
  totalTokens: number;
  calls: number;
  averageCO2PerToken: number;
  averageEnergyPerToken: number;
}
```

#### `compareModels(inputTokens: number, outputTokens: number)`

Compare environmental impact between Claude 4 Sonnet and Opus.

## Methodology

### Energy Calculations

Our calculations are based on extensive research into LLM energy consumption:

**Base Formula:**
```
Total Energy = (Token Count × Energy per Token × Reasoning Multiplier × PUE)
CO2 Emissions = Total Energy × Carbon Intensity
Water Usage = Total Energy × Water Usage Effectiveness
```

**Key Parameters:**
- **Power Usage Effectiveness (PUE)**: 1.12 (AWS datacenters)
- **Carbon Intensity**: 0.385 kg CO2/kWh (US grid average)
- **Water Usage Effectiveness**: 1.8 L/kWh (datacenter cooling)

### Cache Operation Costs

Based on research analysis of transformer inference patterns:

- **Cache Creation**: 1.1x normal token cost (full computation + storage)
- **Cache Retrieval**: 0.12x normal token cost (memory bandwidth limited)

### Model-Specific Estimates

**Claude 4 Sonnet:**
- 0.0012 J/token (estimated from architectural analysis)
- ~200B parameters, mixture-of-experts architecture

**Claude 4 Opus:**
- 0.0045 J/token (flagship model, higher capability)
- ~1T+ parameters, advanced reasoning capabilities

### Reasoning Mode

Reasoning operations use approximately 2.5x more compute based on the additional inference steps required for chain-of-thought processing.

## Research References

This package is built on extensive research into LLM environmental impact:

### Core Methodology
- [LLMCarbon: Modeling the end-to-end Carbon Footprint of Large Language Models](https://arxiv.org/abs/2309.14393)
- [LLMCO2: Advancing Accurate Carbon Footprint Prediction for LLM Inferences](https://arxiv.org/html/2410.02950v1)
- [Offline Energy-Optimal LLM Serving](https://arxiv.org/html/2407.04014v1)

### KV Cache Research
- [Understanding and Coding the KV Cache in LLMs](https://magazine.sebastianraschka.com/p/coding-the-kv-cache-in-llms)
- [NVIDIA TensorRT-LLM KV Cache Optimizations](https://developer.nvidia.com/blog/introducing-new-kv-cache-reuse-optimizations-in-nvidia-tensorrt-llm/)
- [Microsoft Research: FastGen KV Cache Optimization](https://www.microsoft.com/en-us/research/blog/llm-profiling-guides-kv-cache-optimization/)

### Energy Benchmarking
- [Benchmarking the Energy Costs of Large Language Models](https://arxiv.org/pdf/2310.03003)
- [The Energy Footprint of Humans and Large Language Models](https://cacm.acm.org/blogcacm/the-energy-footprint-of-humans-and-large-language-models/)
- [Carbon Emissions and Large Neural Network Training](https://arxiv.org/abs/2104.10350)

### Industry Analysis
- [Ecologits Methodology](https://ecologits.ai/latest/methodology/)
- [HCLTech: LLM Cache for Sustainable GenAI](https://www.hcltech.com/blogs/llm-cache-sustainable-fast-cost-effective-genai-app-design)

## Limitations & Future Work

### Current Limitations
- **Estimates Only**: Based on architectural analysis, not direct measurements
- **AWS-Centric**: Infrastructure assumptions based on AWS datacenters
- **Static Parameters**: Does not account for real-time carbon intensity
- **Limited Models**: Currently supports only Claude 4 family

### Roadmap
- Support for GPT-4, Gemini, and other major models
- Real-time carbon intensity integration
- Hardware-specific calculations (H100, A100, etc.)
- Regional datacenter variations
- Training impact amortization
- Fine-tuning and embedding calculations

## Contributing

We welcome contributions! Areas of particular interest:

1. **Additional Models**: Help us add support for more LLM families
2. **Research Integration**: Incorporate new papers on AI energy consumption
3. **Validation**: Compare estimates against real-world measurements
4. **Regional Data**: Add carbon intensity data for different regions

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](https://github.com/eharris128/ai-carbon/blob/main/LICENSE) file for details.

## Acknowledgments

This package builds on research from:
- Anthropic (Claude architecture insights)
- NVIDIA (GPU energy profiling)
- Microsoft Research (KV cache optimization)
- Academic researchers studying AI environmental impact

Special thanks to the open research community making LLM environmental impact measurement possible.

---

**Note**: This package provides estimates for educational and optimization purposes. For official carbon reporting, consider professional environmental impact assessments.
