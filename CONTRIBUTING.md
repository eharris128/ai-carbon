# Contributing to ai-carbon

Thank you for your interest in contributing to ai-carbon! This guide will help you get started with contributing to our environmental impact calculation package for AI models.

## Quick Start

ai-carbon is a TypeScript npm package that provides:
- **Zero-dependency calculations** - Environmental impact calculations for AI model usage
- **Research-backed methodology** - Based on peer-reviewed research on LLM energy consumption
- **TypeScript support** - Full type definitions for excellent developer experience

## Ways to Contribute

### Bug Reports
- Use GitHub Issues to report calculation errors or bugs
- Include sample inputs that produce incorrect results
- Mention your environment (Node version, TypeScript version)

### Feature Requests
- Open an issue with the "enhancement" label
- Describe new models you'd like supported
- Propose methodology improvements with research citations

### Code Contributions
- Add support for new AI models
- Improve calculation accuracy
- Optimize performance
- Fix bugs or edge cases

### Documentation
- Improve README examples
- Add research citations
- Create usage tutorials
- Fix typos or clarify methodology

### Research Contributions
- Submit new research papers on AI energy consumption
- Validate calculations against real-world measurements
- Propose improved methodologies
- Add regional carbon intensity data

## Development Setup

### Prerequisites
- Node.js 16+
- Git
- TypeScript knowledge
- Understanding of environmental impact calculations

### 1. Fork and Clone
```bash
git clone https://github.com/your-username/ai-carbon.git
cd ai-carbon
npm install
```

### 2. Development Workflow
```bash
# Build the package
npm run build

# Watch for changes during development
npm run dev

# Clean build artifacts
npm run clean
```

### 3. Testing Your Changes
```bash
# Build and test locally
npm run build

# Test the package
node -e "
const { calculateClaude4Impact } = require('./dist/index.js');
console.log(calculateClaude4Impact({
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500
}));
"
```

## Project Structure

```
ai-carbon/
├── index.ts                 # Main package source
├── dist/                    # Compiled JavaScript output
│   ├── index.js            # Compiled main file
│   ├── index.d.ts          # TypeScript declarations
│   └── *.map               # Source maps
├── package.json             # Package configuration
├── tsconfig.json           # TypeScript configuration
├── README.md               # Package documentation
└── LICENSE                 # MIT license
```

## Development Guidelines

### Code Style
- **TypeScript**: Use strict typing for all functions
- **Formatting**: Use consistent indentation (2 spaces)
- **Comments**: Add JSDoc for all public APIs
- **Constants**: Use descriptive names for all model parameters

### Naming Conventions
- **Files**: Use kebab-case (`model-specs.ts`)
- **Functions**: Use camelCase (`calculateClaude4Impact`)
- **Types**: Use PascalCase (`CalculationOptions`)
- **Constants**: Use SCREAMING_SNAKE_CASE (`MODEL_SPECS`)

### Calculation Standards
- **Accuracy**: Base all calculations on peer-reviewed research
- **Transparency**: Document methodology clearly
- **Validation**: Test against known benchmarks
- **Units**: Use consistent units (joules, grams CO2, liters water)

### Research Integration
- **Citations**: Include research paper links in code comments
- **Methodology**: Document calculation formulas
- **Assumptions**: Clearly state all assumptions
- **Updates**: Keep parameters current with latest research

## Pull Request Process

### 1. Create a Feature Branch
```bash
git checkout -b feature/add-gpt4-support
# or
git checkout -b fix/cache-calculation-bug
```

### 2. Make Your Changes
- Follow coding standards
- Add tests for calculation accuracy
- Update documentation as needed
- Ensure TypeScript compilation succeeds

### 3. Commit Your Changes
```bash
# Use descriptive commit messages
git commit -m "Add GPT-4 model support with energy estimates

- Implement energy per token calculations for GPT-4
- Add model specifications based on OpenAI research
- Include cache-aware calculations
- Update README with GPT-4 examples"
```

### 4. Submit Pull Request
- Push your branch and create a PR
- Fill out the PR template completely
- Link any related research papers or issues
- Request review from maintainers

### PR Requirements
- **Build**: TypeScript compilation succeeds
- **Documentation**: README updated if adding features
- **Research**: Calculations backed by credible sources
- **Backwards Compatibility**: No breaking changes without major version bump

## Testing

### Calculation Verification
```bash
# Test basic calculations
node -e "
const { calculateClaude4Impact, compareModels } = require('./dist/index.js');

// Test basic calculation
const impact = calculateClaude4Impact({
  model: 'claude-4-sonnet',
  inputTokens: 1000,
  outputTokens: 500
});
console.log('CO2:', impact.co2Grams, 'grams');

// Test model comparison
const comparison = compareModels(1000, 500);
console.log('Opus multiplier:', comparison.opusMultiplier);
"
```

### Edge Case Testing
- Zero token inputs
- Very large token counts
- Cache-only operations
- Reasoning mode calculations

## Model Addition Guidelines

### When Adding New Models
1. **Research**: Find peer-reviewed energy consumption data
2. **Parameters**: Determine energy per token estimates
3. **Validation**: Compare against known benchmarks
4. **Documentation**: Update README with new model info

### Required Information
- Energy per token (joules)
- Model architecture details
- Parameter count estimates
- Research citations

## Release Process

### Version Guidelines
- **Patch**: Bug fixes, improved accuracy
- **Minor**: New model support, new features
- **Major**: Breaking API changes, methodology changes

### Publishing
1. Update version in package.json
2. Update CHANGELOG.md with changes
3. Test package locally: `npm pack && npm install -g ./ai-carbon-x.x.x.tgz`
4. Publish to npm: `npm publish`
5. Create GitHub release with changelog

## Recognition

Contributors will be:
- Added to the contributors list in README.md
- Mentioned in release notes for significant contributions
- Credited for research contributions and model additions

## Getting Help

### Development Questions
- Open a GitHub Discussion for methodology questions
- Create issues for technical problems
- Tag maintainers for urgent questions

### Research Questions
- Provide citations for new research papers
- Discuss calculation methodologies in issues
- Propose validation approaches

## Code of Conduct

- **Be Respectful**: Treat all contributors with respect
- **Be Scientific**: Base discussions on research and data
- **Be Constructive**: Provide helpful feedback on calculations
- **Be Transparent**: Share methodology and assumptions clearly

## Design Philosophy

### Accuracy First
- All calculations based on peer-reviewed research
- Conservative estimates when data is uncertain
- Clear documentation of assumptions and limitations

### Developer Experience
- Zero runtime dependencies
- Comprehensive TypeScript support
- Clear, intuitive API design

### Transparency
- Open methodology and calculations
- Research citations for all parameters
- Clear documentation of limitations

---

**Ready to contribute?** Start by checking our [good first issue](https://github.com/eharris128/ai-carbon/labels/good%20first%20issue) label!

Thank you for helping make AI more environmentally conscious!