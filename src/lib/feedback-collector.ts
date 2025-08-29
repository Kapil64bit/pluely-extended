// User feedback collection system for classification accuracy

import { ResponseMode, ClassificationResult } from '../types/enhanced-response';
import { questionClassifier } from './question-classifier';
import { UserFeedback } from './learning-system';

export interface FeedbackRequest {
  id: string;
  classification: ClassificationResult;
  content: string;
  timestamp: number;
  responseGenerated?: boolean;
  userSatisfaction?: number; // 1-5 scale
}

export interface FeedbackResponse {
  requestId: string;
  isCorrect: boolean;
  correctedMode?: ResponseMode;
  userSatisfaction?: number;
  comments?: string;
  timestamp: number;
}

export interface FeedbackPrompt {
  type: 'quick' | 'detailed' | 'satisfaction';
  message: string;
  options: Array<{
    label: string;
    value: any;
    description?: string;
  }>;
  timeout?: number; // Auto-dismiss after timeout
}

export class FeedbackCollector {
  private pendingRequests: Map<string, FeedbackRequest> = new Map();
  private feedbackHistory: FeedbackResponse[] = [];
  private readonly MAX_PENDING = 10;
  private readonly FEEDBACK_TIMEOUT = 30000; // 30 seconds

  /**
   * Request feedback on a classification
   */
  requestFeedback(
    classification: ClassificationResult,
    content: string,
    responseGenerated: boolean = false
  ): FeedbackRequest {
    const request: FeedbackRequest = {
      id: this.generateRequestId(),
      classification,
      content,
      timestamp: Date.now(),
      responseGenerated
    };

    // Clean up old pending requests
    this.cleanupPendingRequests();

    // Add to pending requests
    this.pendingRequests.set(request.id, request);

    // Auto-cleanup after timeout
    setTimeout(() => {
      this.pendingRequests.delete(request.id);
    }, this.FEEDBACK_TIMEOUT);

    return request;
  }

  /**
   * Submit user feedback
   */
  submitFeedback(response: FeedbackResponse): UserFeedback | null {
    const request = this.pendingRequests.get(response.requestId);
    if (!request) {
      console.warn('Feedback request not found:', response.requestId);
      return null;
    }

    // Record feedback in question classifier
    const userFeedback = questionClassifier.recordUserFeedback(
      request.classification,
      response.isCorrect,
      response.correctedMode,
      request.content
    );

    // Store feedback response
    this.feedbackHistory.push(response);
    
    // Clean up pending request
    this.pendingRequests.delete(response.requestId);

    // Keep feedback history manageable
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-50);
    }

    return userFeedback;
  }

  /**
   * Generate feedback prompt based on classification confidence
   */
  generateFeedbackPrompt(classification: ClassificationResult): FeedbackPrompt | null {
    // Don't prompt for high-confidence classifications unless user explicitly requests
    if (classification.confidence > 0.8) {
      return null;
    }

    // Generate appropriate prompt based on confidence level
    if (classification.confidence < 0.5) {
      return this.generateDetailedPrompt(classification);
    } else {
      return this.generateQuickPrompt(classification);
    }
  }

  /**
   * Generate quick feedback prompt for medium confidence
   */
  private generateQuickPrompt(classification: ClassificationResult): FeedbackPrompt {
    return {
      type: 'quick',
      message: `I classified this as ${classification.mode} mode with ${(classification.confidence * 100).toFixed(0)}% confidence. Was this correct?`,
      options: [
        {
          label: '✓ Correct',
          value: { isCorrect: true },
          description: 'The classification was accurate'
        },
        {
          label: '✗ Wrong',
          value: { isCorrect: false },
          description: 'The classification was incorrect'
        },
        {
          label: 'Skip',
          value: null,
          description: 'Don\'t provide feedback right now'
        }
      ],
      timeout: 15000
    };
  }

  /**
   * Generate detailed feedback prompt for low confidence
   */
  private generateDetailedPrompt(classification: ClassificationResult): FeedbackPrompt {
    const otherModes = Object.values(ResponseMode).filter(mode => mode !== classification.mode);
    
    return {
      type: 'detailed',
      message: `I'm not very confident about this classification (${(classification.confidence * 100).toFixed(0)}% confidence). What mode should this be?`,
      options: [
        {
          label: `Keep ${classification.mode}`,
          value: { isCorrect: true },
          description: 'The current classification is correct'
        },
        ...otherModes.map(mode => ({
          label: `Change to ${mode}`,
          value: { isCorrect: false, correctedMode: mode },
          description: `This should be ${mode} mode instead`
        })),
        {
          label: 'Skip',
          value: null,
          description: 'Don\'t provide feedback right now'
        }
      ],
      timeout: 30000
    };
  }

  /**
   * Generate satisfaction prompt after response generation
   */
  generateSatisfactionPrompt(): FeedbackPrompt {
    return {
      type: 'satisfaction',
      message: 'How satisfied are you with the response quality?',
      options: [
        { label: '⭐⭐⭐⭐⭐ Excellent', value: 5 },
        { label: '⭐⭐⭐⭐ Good', value: 4 },
        { label: '⭐⭐⭐ Average', value: 3 },
        { label: '⭐⭐ Poor', value: 2 },
        { label: '⭐ Very Poor', value: 1 },
        { label: 'Skip', value: null }
      ],
      timeout: 20000
    };
  }

  /**
   * Get pending feedback requests
   */
  getPendingRequests(): FeedbackRequest[] {
    return Array.from(this.pendingRequests.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats(): {
    totalFeedback: number;
    accuracyRate: number;
    averageSatisfaction: number;
    responseRate: number;
    recentFeedback: FeedbackResponse[];
  } {
    const totalFeedback = this.feedbackHistory.length;
    
    if (totalFeedback === 0) {
      return {
        totalFeedback: 0,
        accuracyRate: 0,
        averageSatisfaction: 0,
        responseRate: 0,
        recentFeedback: []
      };
    }

    // Calculate accuracy rate
    const correctFeedback = this.feedbackHistory.filter(f => f.isCorrect).length;
    const accuracyRate = correctFeedback / totalFeedback;

    // Calculate average satisfaction
    const satisfactionRatings = this.feedbackHistory
      .filter(f => f.userSatisfaction !== undefined)
      .map(f => f.userSatisfaction!);
    
    const averageSatisfaction = satisfactionRatings.length > 0 
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;

    // Calculate response rate (feedback received vs requests made)
    const totalRequests = this.feedbackHistory.length + this.pendingRequests.size;
    const responseRate = totalRequests > 0 ? totalFeedback / totalRequests : 0;

    // Get recent feedback
    const recentFeedback = this.feedbackHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalFeedback,
      accuracyRate,
      averageSatisfaction,
      responseRate,
      recentFeedback
    };
  }

  /**
   * Clear all feedback data
   */
  clearFeedbackData(): void {
    this.pendingRequests.clear();
    this.feedbackHistory = [];
  }

  /**
   * Export feedback data
   */
  exportFeedbackData(): {
    feedbackHistory: FeedbackResponse[];
    exportTimestamp: number;
    version: string;
  } {
    return {
      feedbackHistory: this.feedbackHistory,
      exportTimestamp: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Import feedback data
   */
  importFeedbackData(data: ReturnType<typeof this.exportFeedbackData>): boolean {
    try {
      if (data.version !== '1.0') {
        console.warn('Unsupported feedback data version:', data.version);
        return false;
      }

      this.feedbackHistory = data.feedbackHistory || [];
      return true;
    } catch (error) {
      console.error('Failed to import feedback data:', error);
      return false;
    }
  }

  /**
   * Check if feedback should be requested based on settings and history
   */
  shouldRequestFeedback(classification: ClassificationResult): boolean {
    // Don't request feedback too frequently
    const recentRequests = Array.from(this.pendingRequests.values())
      .filter(req => Date.now() - req.timestamp < 60000); // Last minute
    
    if (recentRequests.length >= 3) {
      return false;
    }

    // Request feedback for low confidence classifications
    if (classification.confidence < 0.6) {
      return true;
    }

    // Occasionally request feedback for high confidence to validate
    if (classification.confidence > 0.8 && Math.random() < 0.1) {
      return true;
    }

    // Request feedback for new or unusual feature combinations
    const unusualFeatures = classification.detectedFeatures.filter(feature => 
      !['code_detected', 'mcq_structure', 'interview_question', 'question_patterns'].includes(feature)
    );
    
    if (unusualFeatures.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Private helper methods
   */
  private generateRequestId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupPendingRequests(): void {
    const now = Date.now();
    const expired = Array.from(this.pendingRequests.entries())
      .filter(([_, request]) => now - request.timestamp > this.FEEDBACK_TIMEOUT)
      .map(([id, _]) => id);
    
    expired.forEach(id => this.pendingRequests.delete(id));

    // Also limit total pending requests
    if (this.pendingRequests.size > this.MAX_PENDING) {
      const oldest = Array.from(this.pendingRequests.entries())
        .sort(([_, a], [__, b]) => a.timestamp - b.timestamp)
        .slice(0, this.pendingRequests.size - this.MAX_PENDING)
        .map(([id, _]) => id);
      
      oldest.forEach(id => this.pendingRequests.delete(id));
    }
  }
}

// Singleton instance
export const feedbackCollector = new FeedbackCollector();