// MCQ response formatter for consistent output formatting

import { MCQResponse, MCQOption } from '../../types/enhanced-response';

export interface MCQFormattingOptions {
  includeExplanation: boolean;
  includeElimination: boolean;
  includeConfidence: boolean;
  showOptionLabels: boolean;
  highlightCorrectAnswer: boolean;
  includeStrategies: boolean;
  format: 'text' | 'markdown' | 'html';
}

export class MCQFormatter {
  private readonly defaultOptions: MCQFormattingOptions = {
    includeExplanation: true,
    includeElimination: true,
    includeConfidence: true,
    showOptionLabels: true,
    highlightCorrectAnswer: true,
    includeStrategies: true,
    format: 'markdown'
  };

  /**
   * Format MCQ response for display
   */
  formatResponse(
    response: MCQResponse,
    options: Partial<MCQFormattingOptions> = {}
  ): string {
    const config = { ...this.defaultOptions, ...options };

    switch (config.format) {
      case 'html':
        return this.formatAsHTML(response, config);
      case 'text':
        return this.formatAsText(response, config);
      case 'markdown':
      default:
        return this.formatAsMarkdown(response, config);
    }
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(response: MCQResponse, options: MCQFormattingOptions): string {
    let output = '';

    // Question
    output += `## Question\n\n${response.question}\n\n`;

    // Options
    output += `## Options\n\n`;
    response.options.forEach(option => {
      const isCorrect = option.id === response.correctAnswer;
      const prefix = options.highlightCorrectAnswer && isCorrect ? '✅ ' : '';
      const emphasis = options.highlightCorrectAnswer && isCorrect ? '**' : '';
      
      output += `${prefix}${emphasis}${option.id}) ${option.text}${emphasis}\n`;
    });
    output += '\n';

    // Correct Answer
    output += `## Answer\n\n**${response.correctAnswer}**\n\n`;

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `## Explanation\n\n${response.explanation}\n\n`;
    }

    // Elimination Strategy
    if (options.includeElimination && response.eliminationStrategy.length > 0) {
      output += `## Elimination Strategy\n\n`;
      response.eliminationStrategy.forEach((strategy, index) => {
        output += `${index + 1}. ${strategy}\n`;
      });
      output += '\n';
    }

    // Confidence
    if (options.includeConfidence) {
      const confidencePercent = Math.round(response.confidenceLevel * 100);
      const confidenceBar = this.generateConfidenceBar(response.confidenceLevel);
      output += `## Confidence Level\n\n${confidencePercent}% ${confidenceBar}\n\n`;
    }

    return output.trim();
  }

  /**
   * Format as plain text
   */
  private formatAsText(response: MCQResponse, options: MCQFormattingOptions): string {
    let output = '';

    // Question
    output += `QUESTION:\n${response.question}\n\n`;

    // Options
    output += `OPTIONS:\n`;
    response.options.forEach(option => {
      const isCorrect = option.id === response.correctAnswer;
      const marker = options.highlightCorrectAnswer && isCorrect ? ' ← CORRECT' : '';
      output += `${option.id}) ${option.text}${marker}\n`;
    });
    output += '\n';

    // Answer
    output += `ANSWER: ${response.correctAnswer}\n\n`;

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `EXPLANATION:\n${response.explanation}\n\n`;
    }

    // Elimination Strategy
    if (options.includeElimination && response.eliminationStrategy.length > 0) {
      output += `ELIMINATION STRATEGY:\n`;
      response.eliminationStrategy.forEach((strategy, index) => {
        output += `${index + 1}. ${strategy}\n`;
      });
      output += '\n';
    }

    // Confidence
    if (options.includeConfidence) {
      const confidencePercent = Math.round(response.confidenceLevel * 100);
      output += `CONFIDENCE: ${confidencePercent}%\n\n`;
    }

    return output.trim();
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(response: MCQResponse, options: MCQFormattingOptions): string {
    let output = '<div class="mcq-response">';

    // Question
    output += `<div class="mcq-question">
      <h3>Question</h3>
      <p>${this.escapeHtml(response.question)}</p>
    </div>`;

    // Options
    output += '<div class="mcq-options"><h3>Options</h3><ul>';
    response.options.forEach(option => {
      const isCorrect = option.id === response.correctAnswer;
      const className = isCorrect && options.highlightCorrectAnswer ? 'correct-option' : '';
      const icon = isCorrect && options.highlightCorrectAnswer ? '<span class="correct-icon">✅</span> ' : '';
      
      output += `<li class="${className}">
        ${icon}<strong>${option.id})</strong> ${this.escapeHtml(option.text)}
      </li>`;
    });
    output += '</ul></div>';

    // Answer
    output += `<div class="mcq-answer">
      <h3>Answer</h3>
      <p class="answer-highlight"><strong>${response.correctAnswer}</strong></p>
    </div>`;

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `<div class="mcq-explanation">
        <h3>Explanation</h3>
        <p>${this.escapeHtml(response.explanation).replace(/\n/g, '<br>')}</p>
      </div>`;
    }

    // Elimination Strategy
    if (options.includeElimination && response.eliminationStrategy.length > 0) {
      output += '<div class="mcq-elimination"><h3>Elimination Strategy</h3><ol>';
      response.eliminationStrategy.forEach(strategy => {
        output += `<li>${this.escapeHtml(strategy)}</li>`;
      });
      output += '</ol></div>';
    }

    // Confidence
    if (options.includeConfidence) {
      const confidencePercent = Math.round(response.confidenceLevel * 100);
      const confidenceClass = this.getConfidenceClass(response.confidenceLevel);
      
      output += `<div class="mcq-confidence">
        <h3>Confidence Level</h3>
        <div class="confidence-display">
          <span class="confidence-percent ${confidenceClass}">${confidencePercent}%</span>
          <div class="confidence-bar">
            <div class="confidence-fill ${confidenceClass}" style="width: ${confidencePercent}%"></div>
          </div>
        </div>
      </div>`;
    }

    output += '</div>';
    return output;
  }

  /**
   * Format for quick display (compact format)
   */
  formatQuick(response: MCQResponse): string {
    const correctOption = response.options.find(opt => opt.id === response.correctAnswer);
    const confidencePercent = Math.round(response.confidenceLevel * 100);
    
    return `Answer: ${response.correctAnswer}) ${correctOption?.text || 'Unknown'} (${confidencePercent}% confidence)`;
  }

  /**
   * Format for comparison (side-by-side options)
   */
  formatComparison(response: MCQResponse): string {
    let output = `**Question:** ${response.question}\n\n`;
    
    output += '| Option | Text | Status |\n';
    output += '|--------|------|--------|\n';
    
    response.options.forEach(option => {
      const isCorrect = option.id === response.correctAnswer;
      const status = isCorrect ? '✅ Correct' : '❌ Incorrect';
      output += `| ${option.id} | ${option.text} | ${status} |\n`;
    });
    
    output += `\n**Confidence:** ${Math.round(response.confidenceLevel * 100)}%`;
    
    return output;
  }

  /**
   * Format for study mode (detailed analysis)
   */
  formatStudyMode(response: MCQResponse): string {
    let output = this.formatAsMarkdown(response, {
      ...this.defaultOptions,
      includeStrategies: true
    });

    // Add study tips
    output += '\n## Study Tips\n\n';
    output += this.generateStudyTips(response);

    return output;
  }

  /**
   * Generate confidence bar visualization
   */
  private generateConfidenceBar(confidence: number): string {
    const barLength = 20;
    const filledLength = Math.round(confidence * barLength);
    const emptyLength = barLength - filledLength;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `[${filled}${empty}]`;
  }

  /**
   * Get CSS class for confidence level
   */
  private getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  }

  /**
   * Generate study tips based on response
   */
  private generateStudyTips(response: MCQResponse): string {
    const tips: string[] = [];
    
    if (response.confidenceLevel < 0.7) {
      tips.push('Review the key concepts related to this question');
      tips.push('Practice similar questions to improve understanding');
    }
    
    if (response.eliminationStrategy.length > 0) {
      tips.push('Practice elimination techniques for similar question types');
    }
    
    tips.push('Create flashcards for key terms mentioned in this question');
    tips.push('Discuss this topic with study partners or instructors');
    
    return tips.map((tip, index) => `${index + 1}. ${tip}`).join('\n');
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate CSS styles for HTML format
   */
  static generateCSS(): string {
    return `
      .mcq-response {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
      }
      
      .mcq-question h3,
      .mcq-options h3,
      .mcq-answer h3,
      .mcq-explanation h3,
      .mcq-elimination h3,
      .mcq-confidence h3 {
        color: #2563eb;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
        margin-bottom: 16px;
      }
      
      .mcq-options ul {
        list-style: none;
        padding: 0;
      }
      
      .mcq-options li {
        padding: 8px 12px;
        margin: 4px 0;
        border-radius: 6px;
        background: #f9fafb;
      }
      
      .mcq-options li.correct-option {
        background: #dcfce7;
        border: 2px solid #16a34a;
      }
      
      .correct-icon {
        margin-right: 8px;
      }
      
      .answer-highlight {
        font-size: 1.2em;
        color: #16a34a;
        font-weight: bold;
      }
      
      .confidence-display {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .confidence-bar {
        flex: 1;
        height: 20px;
        background: #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .confidence-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .confidence-high { background: #16a34a; color: #16a34a; }
      .confidence-medium { background: #eab308; color: #eab308; }
      .confidence-low { background: #dc2626; color: #dc2626; }
    `;
  }
}

// Singleton instance
export const mcqFormatter = new MCQFormatter();