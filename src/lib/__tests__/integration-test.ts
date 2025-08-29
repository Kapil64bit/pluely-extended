// Simple integration test to verify user override and learning capabilities

import { ResponseMode } from '../../types/enhanced-response';
import { questionClassifier } from '../question-classifier';
import { modeOverrideManager } from '../mode-override-manager';
import { feedbackCollector } from '../feedback-collector';
import { learningSystem } from '../learning-system';

// Simple test runner
async function runIntegrationTests() {
  console.log('🧪 Running User Override and Learning Integration Tests...\n');

  // Clear all data
  questionClassifier.clearUserData();
  modeOverrideManager.clearAllData();
  feedbackCollector.clearFeedbackData();
  learningSystem.clearLearningData();

  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: Manual Override
  testsTotal++;
  try {
    console.log('Test 1: Manual Override');
    
    // Set manual override
    modeOverrideManager.setManualOverride(ResponseMode.CODING);
    
    // Classify content that would normally be theoretical
    const result = await questionClassifier.classify({
      content: 'What is polymorphism in object-oriented programming?'
    });
    
    if (result.mode === ResponseMode.CODING) {
      console.log('✅ Manual override working correctly');
      testsPassed++;
    } else {
      console.log('❌ Manual override failed');
    }
    
    // Clear override
    modeOverrideManager.clearAllOverrides();
    
  } catch (error) {
    console.log('❌ Manual override test failed:', error);
  }

  // Test 2: User Feedback Learning
  testsTotal++;
  try {
    console.log('\nTest 2: User Feedback Learning');
    
    const content = 'Implement a function to reverse a string';
    
    // Initial classification
    const initialResult = await questionClassifier.classify({ content });
    console.log(`Initial classification: ${initialResult.mode} (${initialResult.confidence.toFixed(2)})`);
    
    // Simulate user correction
    const feedback = questionClassifier.recordUserFeedback(
      initialResult,
      false,
      ResponseMode.VERBAL_INTERVIEW,
      content
    );
    
    if (feedback && !feedback.isCorrect) {
      console.log('✅ User feedback recorded correctly');
      testsPassed++;
    } else {
      console.log('❌ User feedback recording failed');
    }
    
  } catch (error) {
    console.log('❌ User feedback test failed:', error);
  }

  // Test 3: Auto-Override Rules
  testsTotal++;
  try {
    console.log('\nTest 3: Auto-Override Rules');
    
    // Add auto-override rule
    modeOverrideManager.addAutoOverrideRule('implement', ResponseMode.CODING);
    
    // Test content with the trigger word
    const result = await questionClassifier.classify({
      content: 'Please implement a binary search algorithm'
    });
    
    if (result.mode === ResponseMode.CODING || result.reasoning.includes('Auto-override')) {
      console.log('✅ Auto-override rule working correctly');
      testsPassed++;
    } else {
      console.log('❌ Auto-override rule failed');
    }
    
  } catch (error) {
    console.log('❌ Auto-override test failed:', error);
  }

  // Test 4: Feedback Collection
  testsTotal++;
  try {
    console.log('\nTest 4: Feedback Collection');
    
    const classification = {
      mode: ResponseMode.THEORETICAL,
      confidence: 0.4,
      reasoning: 'Low confidence test',
      detectedFeatures: []
    };
    
    // Request feedback
    const request = feedbackCollector.requestFeedback(classification, 'test content');
    
    // Submit feedback
    const response = feedbackCollector.submitFeedback({
      requestId: request.id,
      isCorrect: false,
      correctedMode: ResponseMode.MCQ,
      timestamp: Date.now()
    });
    
    if (response && !response.isCorrect) {
      console.log('✅ Feedback collection working correctly');
      testsPassed++;
    } else {
      console.log('❌ Feedback collection failed');
    }
    
  } catch (error) {
    console.log('❌ Feedback collection test failed:', error);
  }

  // Test 5: Learning System Insights
  testsTotal++;
  try {
    console.log('\nTest 5: Learning System Insights');
    
    const insights = learningSystem.getLearningInsights();
    
    if (insights && typeof insights.totalFeedback === 'number') {
      console.log('✅ Learning system insights working correctly');
      console.log(`   Total feedback: ${insights.totalFeedback}`);
      console.log(`   Accuracy rate: ${(insights.accuracyRate * 100).toFixed(1)}%`);
      testsPassed++;
    } else {
      console.log('❌ Learning system insights failed');
    }
    
  } catch (error) {
    console.log('❌ Learning system test failed:', error);
  }

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All integration tests passed!');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check implementation.');
    return false;
  }
}

// Export for use in other contexts
export { runIntegrationTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runIntegrationTests().catch(console.error);
}