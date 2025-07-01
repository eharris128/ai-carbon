// Demo of the new multi-provider ai-carbon functionality
import { 
  calculateImpact, 
  compareProviders, 
  getSupportedProviders, 
  getSupportedModels,
  formatEmissionResult,
  getProviderEfficiencyRanking
} from './dist/index.js';

async function runDemo() {
  console.log('🌍 AI Carbon Impact Comparison Demo\n');

  // Show supported providers
  console.log('📊 Supported Providers:', getSupportedProviders());
  console.log('🤖 Claude models:', getSupportedModels('claude'));
  console.log('🧠 OpenAI models:', getSupportedModels('openai'));
  console.log('✨ Gemini models:', getSupportedModels('gemini'));
  console.log();

  // Compare providers for a typical coding task
  console.log('💻 Coding Task Comparison (1000 input, 500 output tokens):');
  const codingComparison = await compareProviders(1000, 500);
  
  console.log('\n📈 Results:');
  console.log(formatEmissionResult(codingComparison.claude));
  console.log(formatEmissionResult(codingComparison.openai));
  console.log(formatEmissionResult(codingComparison.gemini));

  // Show efficiency ranking
  console.log('\n🏆 Efficiency Ranking (lowest CO2 first):');
  const ranking = await getProviderEfficiencyRanking(1000, 500);
  ranking.forEach((item, index) => {
    console.log(`${index + 1}. ${item.provider.toUpperCase()} ${item.model}: ${item.co2Grams.toFixed(6)}g CO2 (${item.efficiency.toFixed(2)}x efficiency)`);
  });

  // Demonstrate reasoning mode impact
  console.log('\n🧠 Reasoning Mode Impact:');
  const normalTask = await calculateImpact({
    provider: 'claude',
    model: 'claude-4-sonnet',
    inputTokens: 2000,
    outputTokens: 1000
  });

  const reasoningTask = await calculateImpact({
    provider: 'claude',
    model: 'claude-4-sonnet',
    inputTokens: 2000,
    outputTokens: 1000,
    reasoning: true
  });

  console.log(`Normal: ${normalTask.co2Grams.toFixed(6)}g CO2`);
  console.log(`Reasoning: ${reasoningTask.co2Grams.toFixed(6)}g CO2 (${(reasoningTask.co2Grams / normalTask.co2Grams).toFixed(2)}x increase)`);

  // OpenAI o1-preview special case
  console.log('\n🤔 OpenAI o1-preview (built-in reasoning):');
  const o1Result = await calculateImpact({
    provider: 'openai',
    model: 'o1-preview',
    inputTokens: 1000,
    outputTokens: 500
  });
  console.log(formatEmissionResult(o1Result));

  console.log('\n✅ Demo complete! The new multi-provider ai-carbon package supports:');
  console.log('- ✨ Gemini models with TPU efficiency (63% less CO2 than GPT-4)');
  console.log('- 🧠 OpenAI models with output token cost modeling (4.5x multiplier)');
  console.log('- 🤖 Enhanced Claude support with regional carbon factors');
  console.log('- 🌍 Regional infrastructure differences (PUE, renewable energy %)');
  console.log('- 📊 Provider comparison and efficiency ranking functions');
}

runDemo().catch(console.error);