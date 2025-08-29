// Enhanced theoretical response formatter with structured presentation

import { TheoreticalResponse } from '../../types/enhanced-response';

export interface TheoreticalFormattingOptions {
  includeKeyPoints: boolean;
  includeCommonMistakes: boolean;
  includeRelatedConcepts: boolean;
  includePitfalls: boolean;
  useStructuredLayout: boolean;
  includeVisualSeparators: boolean;
  emphasizeImportantPoints: boolean;
  includeNavigationHints: boolean;
  maxLineLength: number;
  indentLevel: number;
}

export class TheoreticalFormatter {
  private readonly defaultOptions: TheoreticalFormattingOptions = {
    includeKeyPoints: true,
    includeCommonMistakes: true,
    includeRelatedConcepts: true,
    includePitfalls: true,
    useStructuredLayout: true,
    includeVisualSeparators: true,
    emphasizeImportantPoints: true,
    includeNavigationHints: false,
    maxLineLength: 80,
    indentLevel: 2
  };

  /**
   * Format theoretical response with enhanced structure
   */
  formatResponse(
    response: TheoreticalResponse,
    options: Partial<TheoreticalFormattingOptions> = {}
  ): string {
    const config = { ...this.defaultOptions, ...options };
    let formatted = '';

    // Header with topic
    formatted += this.formatHeader(response.topic, config);
    formatted += '\n\n';

    // Summary section
    formatted += this.formatSummary(response.summary, config);
    formatted += '\n\n';

    // Detailed explanation
    formatted += this.formatDetailedExplanation(response.detailedExplanation, config);
    formatted += '\n\n';

    // Key points section
    if (config.includeKeyPoints && response.keyPoints.length > 0) {
      formatted += this.formatKeyPoints(response.keyPoints, config);
      formatted += '\n\n';
    }

    // Common mistakes section
    if (config.includeCommonMistakes && response.commonMistakes.length > 0) {
      formatted += this.formatCommonMistakes(response.commonMistakes, config);
      formatted += '\n\n';
    }

    // Related concepts section
    if (config.includeRelatedConcepts && response.relatedConcepts.length > 0) {
      formatted += this.formatRelatedConcepts(response.relatedConcepts, config);
      formatted += '\n\n';
    }

    // Pitfalls section
    if (config.includePitfalls && response.pitfalls.length > 0) {
      formatted += this.formatPitfalls(response.pitfalls, config);
      formatted += '\n\n';
    }

    // Footer with navigation hints
    if (config.includeNavigationHints) {
      formatted += this.formatNavigationHints(config);
    }

    return formatted.trim();
  }

  /**
   * Format header with topic
   */
  private formatHeader(topic: string, options: TheoreticalFormattingOptions): string {
    let header = '';

    if (options.useStructuredLayout) {
      const separator = options.includeVisualSeparators ? '═'.repeat(Math.min(topic.length + 4, options.maxLineLength)) : '';
      
      if (separator) {
        header += separator + '\n';
      }
      
      header += options.emphasizeImportantPoints ? `📚 **${topic.toUpperCase()}**` : `**${topic}**`;
      
      if (separator) {
        header += '\n' + separator;
      }
    } else {
      header += options.emphasizeImportantPoints ? `**${topic}**` : topic;
    }

    return header;
  }

  /**
   * Format summary section
   */
  private formatSummary(summary: string, options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '🎯 **OVERVIEW**' : '**Overview**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(20) + '\n';
      }
    }

    formatted += this.wrapText(summary, options.maxLineLength, options.indentLevel);

    return formatted;
  }

  /**
   * Format detailed explanation
   */
  private formatDetailedExplanation(explanation: string, options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '📖 **DETAILED EXPLANATION**' : '**Detailed Explanation**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(30) + '\n';
      }
    }

    // Process explanation to enhance formatting
    const processedExplanation = this.enhanceExplanationFormatting(explanation, options);
    formatted += processedExplanation;

    return formatted;
  }

  /**
   * Format key points section
   */
  private formatKeyPoints(keyPoints: string[], options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '🔑 **KEY POINTS**' : '**Key Points**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(20) + '\n';
      }
    }

    keyPoints.forEach((point, index) => {
      const bullet = options.emphasizeImportantPoints ? '▶️' : '•';
      const wrappedPoint = this.wrapText(point, options.maxLineLength - 4, 0);
      formatted += `${bullet} ${wrappedPoint}\n`;
    });

    return formatted.trim();
  }

  /**
   * Format common mistakes section
   */
  private formatCommonMistakes(mistakes: string[], options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '⚠️ **COMMON MISTAKES**' : '**Common Mistakes**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(25) + '\n';
      }
    }

    mistakes.forEach((mistake, index) => {
      const bullet = options.emphasizeImportantPoints ? '❌' : '•';
      const wrappedMistake = this.wrapText(mistake, options.maxLineLength - 4, 0);
      formatted += `${bullet} ${wrappedMistake}\n`;
    });

    return formatted.trim();
  }

  /**
   * Format related concepts section
   */
  private formatRelatedConcepts(concepts: string[], options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '🔗 **RELATED CONCEPTS**' : '**Related Concepts**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(25) + '\n';
      }
    }

    concepts.forEach((concept, index) => {
      const bullet = options.emphasizeImportantPoints ? '🔸' : '•';
      const wrappedConcept = this.wrapText(concept, options.maxLineLength - 4, 0);
      formatted += `${bullet} ${wrappedConcept}\n`;
    });

    return formatted.trim();
  }

  /**
   * Format pitfalls section
   */
  private formatPitfalls(pitfalls: string[], options: TheoreticalFormattingOptions): string {
    let formatted = '';

    if (options.useStructuredLayout) {
      formatted += options.emphasizeImportantPoints ? '🚨 **PITFALLS TO AVOID**' : '**Pitfalls to Avoid**';
      formatted += '\n';
      if (options.includeVisualSeparators) {
        formatted += '─'.repeat(30) + '\n';
      }
    }

    pitfalls.forEach((pitfall, index) => {
      const bullet = options.emphasizeImportantPoints ? '⚡' : '•';
      const wrappedPitfall = this.wrapText(pitfall, options.maxLineLength - 4, 0);
      formatted += `${bullet} ${wrappedPitfall}\n`;
    });

    return formatted.trim();
  }

  /**
   * Format navigation hints
   */
  private formatNavigationHints(options: TheoreticalFormattingOptions): string {
    let hints = '';

    if (options.includeVisualSeparators) {
      hints += '─'.repeat(50) + '\n';
    }

    hints += '💡 **Study Tips:**\n';
    hints += '• Review key points first for quick understanding\n';
    hints += '• Pay special attention to common mistakes\n';
    hints += '• Explore related concepts to deepen knowledge\n';
    hints += '• Practice identifying and avoiding pitfalls\n';

    return hints;
  }

  /**
   * Enhance explanation formatting
   */
  private enhanceExplanationFormatting(explanation: string, options: TheoreticalFormattingOptions): string {
    let enhanced = explanation;

    // Add emphasis to section headers
    if (options.emphasizeImportantPoints) {
      enhanced = enhanced.replace(/\*\*([^*]+)\*\*/g, '**$1**');
      
      // Enhance bullet points
      enhanced = enhanced.replace(/^(\d+\.\s)/gm, '📍 $1');
      enhanced = enhanced.replace(/^(-\s)/gm, '▸ ');
    }

    // Wrap long lines
    const lines = enhanced.split('\n');
    const wrappedLines = lines.map(line => {
      if (line.length > options.maxLineLength) {
        return this.wrapText(line, options.maxLineLength, 0);
      }
      return line;
    });

    return wrappedLines.join('\n');
  }

  /**
   * Wrap text to specified line length
   */
  private wrapText(text: string, maxLength: number, indent: number = 0): string {
    if (text.length <= maxLength) {
      return text;
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const indentStr = ' '.repeat(indent);

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length + indent <= maxLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(indentStr + currentLine);
          currentLine = word;
        } else {
          // Word is longer than max length, break it
          lines.push(indentStr + word);
        }
      }
    }

    if (currentLine) {
      lines.push(indentStr + currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Format for different output types
   */
  formatForMarkdown(response: TheoreticalResponse): string {
    const options: Partial<TheoreticalFormattingOptions> = {
      useStructuredLayout: true,
      includeVisualSeparators: false,
      emphasizeImportantPoints: false,
      maxLineLength: 100
    };

    return this.formatResponse(response, options);
  }

  formatForPlainText(response: TheoreticalResponse): string {
    const options: Partial<TheoreticalFormattingOptions> = {
      useStructuredLayout: true,
      includeVisualSeparators: true,
      emphasizeImportantPoints: false,
      maxLineLength: 80
    };

    return this.formatResponse(response, options);
  }

  formatForConsole(response: TheoreticalResponse): string {
    const options: Partial<TheoreticalFormattingOptions> = {
      useStructuredLayout: true,
      includeVisualSeparators: true,
      emphasizeImportantPoints: true,
      maxLineLength: 70
    };

    return this.formatResponse(response, options);
  }

  formatCompact(response: TheoreticalResponse): string {
    const options: Partial<TheoreticalFormattingOptions> = {
      includeKeyPoints: true,
      includeCommonMistakes: true,
      includeRelatedConcepts: false,
      includePitfalls: false,
      useStructuredLayout: false,
      includeVisualSeparators: false,
      emphasizeImportantPoints: false,
      maxLineLength: 120
    };

    return this.formatResponse(response, options);
  }

  /**
   * Generate summary statistics
   */
  generateStatistics(response: TheoreticalResponse): string {
    const stats = {
      topicLength: response.topic.length,
      summaryWords: response.summary.split(' ').length,
      explanationWords: response.detailedExplanation.split(' ').length,
      keyPointsCount: response.keyPoints.length,
      mistakesCount: response.commonMistakes.length,
      conceptsCount: response.relatedConcepts.length,
      pitfallsCount: response.pitfalls.length
    };

    return `📊 **Response Statistics:**
• Topic: ${stats.topicLength} characters
• Summary: ${stats.summaryWords} words
• Explanation: ${stats.explanationWords} words
• Key Points: ${stats.keyPointsCount}
• Common Mistakes: ${stats.mistakesCount}
• Related Concepts: ${stats.conceptsCount}
• Pitfalls: ${stats.pitfallsCount}`;
  }

  /**
   * Validate formatting quality
   */
  validateFormatting(formattedResponse: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for basic structure
    if (!formattedResponse.includes('**')) {
      issues.push('Missing section headers or emphasis');
    }

    // Check line length
    const lines = formattedResponse.split('\n');
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > 0) {
      suggestions.push(`Consider wrapping ${longLines.length} long lines`);
    }

    // Check for empty sections
    if (formattedResponse.includes('\n\n\n')) {
      suggestions.push('Remove excessive empty lines');
    }

    // Check for consistent bullet points
    const bulletTypes = formattedResponse.match(/^[•▶️❌🔸⚡]\s/gm) || [];
    if (bulletTypes.length === 0) {
      suggestions.push('Consider using consistent bullet points');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Singleton instance
export const theoreticalFormatter = new TheoreticalFormatter();