// Interview response formatter for conversational and professional presentation

import { VerbalInterviewResponse } from '../../types/enhanced-response';

export interface InterviewFormattingOptions {
  includeKeyPoints: boolean;
  includeFollowUpPrep: boolean;
  includeDuration: boolean;
  showToneIndicator: boolean;
  includeDeliveryTips: boolean;
  showSpeakingNotes: boolean;
  format: 'text' | 'markdown' | 'html' | 'speaking_notes';
  style: 'professional' | 'conversational' | 'executive';
}

export class InterviewFormatter {
  private readonly defaultOptions: InterviewFormattingOptions = {
    includeKeyPoints: true,
    includeFollowUpPrep: true,
    includeDuration: true,
    showToneIndicator: true,
    includeDeliveryTips: true,
    showSpeakingNotes: false,
    format: 'markdown',
    style: 'professional'
  };

  /**
   * Format interview response for display
   */
  formatResponse(
    response: VerbalInterviewResponse,
    options: Partial<InterviewFormattingOptions> = {}
  ): string {
    const config = { ...this.defaultOptions, ...options };

    switch (config.format) {
      case 'html':
        return this.formatAsHTML(response, config);
      case 'text':
        return this.formatAsText(response, config);
      case 'speaking_notes':
        return this.formatAsSpeakingNotes(response, config);
      case 'markdown':
      default:
        return this.formatAsMarkdown(response, config);
    }
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(response: VerbalInterviewResponse, options: InterviewFormattingOptions): string {
    let output = '';

    // Question
    output += `## Interview Question\n\n${response.question}\n\n`;

    // Response metadata
    if (options.showToneIndicator || options.includeDuration) {
      output += `## Response Overview\n\n`;
      
      if (options.showToneIndicator) {
        const toneEmoji = this.getToneEmoji(response.tone);
        output += `**Tone:** ${toneEmoji} ${this.capitalizeTone(response.tone)}\n`;
      }
      
      if (options.includeDuration && response.duration) {
        output += `**Duration:** ${response.duration}\n`;
      }
      
      output += '\n';
    }

    // Main Answer
    output += `## Your Response\n\n`;
    output += this.formatAnswerForReading(response.answer, options.style);
    output += '\n\n';

    // Key Points
    if (options.includeKeyPoints && response.keyPoints.length > 0) {
      output += `## Key Points Covered\n\n`;
      response.keyPoints.forEach(point => {
        output += `- ${point}\n`;
      });
      output += '\n';
    }

    // Follow-up Preparation
    if (options.includeFollowUpPrep && response.followUpPreparation.length > 0) {
      output += `## Follow-up Preparation\n\n`;
      response.followUpPreparation.forEach((prep, index) => {
        output += `${index + 1}. ${prep}\n`;
      });
      output += '\n';
    }

    // Delivery Tips
    if (options.includeDeliveryTips) {
      output += `## Delivery Tips\n\n`;
      output += this.generateDeliveryTips(response);
      output += '\n';
    }

    return output.trim();
  }

  /**
   * Format as plain text
   */
  private formatAsText(response: VerbalInterviewResponse, options: InterviewFormattingOptions): string {
    let output = '';

    // Question
    output += `INTERVIEW QUESTION:\n${response.question}\n\n`;

    // Response metadata
    if (options.showToneIndicator || options.includeDuration) {
      output += `RESPONSE DETAILS:\n`;
      
      if (options.showToneIndicator) {
        output += `Tone: ${this.capitalizeTone(response.tone)}\n`;
      }
      
      if (options.includeDuration && response.duration) {
        output += `Duration: ${response.duration}\n`;
      }
      
      output += '\n';
    }

    // Main Answer
    output += `YOUR RESPONSE:\n${response.answer}\n\n`;

    // Key Points
    if (options.includeKeyPoints && response.keyPoints.length > 0) {
      output += `KEY POINTS COVERED:\n`;
      response.keyPoints.forEach(point => {
        output += `- ${point}\n`;
      });
      output += '\n';
    }

    // Follow-up Preparation
    if (options.includeFollowUpPrep && response.followUpPreparation.length > 0) {
      output += `FOLLOW-UP PREPARATION:\n`;
      response.followUpPreparation.forEach((prep, index) => {
        output += `${index + 1}. ${prep}\n`;
      });
      output += '\n';
    }

    // Delivery Tips
    if (options.includeDeliveryTips) {
      output += `DELIVERY TIPS:\n`;
      output += this.generateDeliveryTips(response, 'text');
      output += '\n';
    }

    return output.trim();
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(response: VerbalInterviewResponse, options: InterviewFormattingOptions): string {
    let output = '<div class="interview-response">';

    // Question
    output += `<div class="interview-question">
      <h2>Interview Question</h2>
      <p class="question-text">${this.escapeHtml(response.question)}</p>
    </div>`;

    // Response metadata
    if (options.showToneIndicator || options.includeDuration) {
      output += '<div class="response-metadata">';
      output += '<h3>Response Overview</h3>';
      output += '<div class="metadata-grid">';
      
      if (options.showToneIndicator) {
        const toneEmoji = this.getToneEmoji(response.tone);
        const toneClass = `tone-${response.tone}`;
        output += `<div class="metadata-item ${toneClass}">
          <span class="metadata-label">Tone:</span>
          <span class="metadata-value">${toneEmoji} ${this.capitalizeTone(response.tone)}</span>
        </div>`;
      }
      
      if (options.includeDuration && response.duration) {
        output += `<div class="metadata-item">
          <span class="metadata-label">Duration:</span>
          <span class="metadata-value">${response.duration}</span>
        </div>`;
      }
      
      output += '</div></div>';
    }

    // Main Answer
    output += '<div class="main-response">';
    output += '<h3>Your Response</h3>';
    output += `<div class="response-text ${options.style}">${this.formatAnswerAsHTML(response.answer, options.style)}</div>`;
    output += '</div>';

    // Key Points
    if (options.includeKeyPoints && response.keyPoints.length > 0) {
      output += '<div class="key-points">';
      output += '<h3>Key Points Covered</h3>';
      output += '<ul>';
      response.keyPoints.forEach(point => {
        output += `<li>${this.escapeHtml(point)}</li>`;
      });
      output += '</ul></div>';
    }

    // Follow-up Preparation
    if (options.includeFollowUpPrep && response.followUpPreparation.length > 0) {
      output += '<div class="followup-prep">';
      output += '<h3>Follow-up Preparation</h3>';
      output += '<ol>';
      response.followUpPreparation.forEach(prep => {
        output += `<li>${this.escapeHtml(prep)}</li>`;
      });
      output += '</ol></div>';
    }

    // Delivery Tips
    if (options.includeDeliveryTips) {
      output += '<div class="delivery-tips">';
      output += '<h3>Delivery Tips</h3>';
      output += this.generateDeliveryTipsHTML(response);
      output += '</div>';
    }

    output += '</div>';
    return output;
  }

  /**
   * Format as speaking notes
   */
  private formatAsSpeakingNotes(response: VerbalInterviewResponse, options: InterviewFormattingOptions): string {
    let output = '';

    // Question (abbreviated)
    output += `Q: ${this.abbreviateQuestion(response.question)}\n\n`;

    // Speaking outline
    output += `SPEAKING OUTLINE:\n`;
    output += this.generateSpeakingOutline(response.answer);
    output += '\n\n';

    // Key phrases to remember
    output += `KEY PHRASES:\n`;
    output += this.extractKeyPhrases(response.answer);
    output += '\n\n';

    // Timing notes
    if (response.duration) {
      output += `TIMING: ${response.duration}\n`;
      output += this.generateTimingNotes(response.answer, response.duration);
      output += '\n\n';
    }

    // Tone reminders
    output += `TONE REMINDERS:\n`;
    output += this.generateToneReminders(response.tone);
    output += '\n\n';

    // Follow-up prep (condensed)
    if (response.followUpPreparation.length > 0) {
      output += `FOLLOW-UP PREP:\n`;
      response.followUpPreparation.slice(0, 3).forEach((prep, index) => {
        output += `${index + 1}. ${prep}\n`;
      });
    }

    return output.trim();
  }

  /**
   * Format answer for reading
   */
  private formatAnswerForReading(answer: string, style: string): string {
    // Add paragraph breaks for better readability
    let formatted = answer.replace(/\. ([A-Z])/g, '.\n\n$1');
    
    // Add emphasis for key phrases based on style
    if (style === 'executive') {
      formatted = formatted.replace(/\b(strategic|vision|leadership|results|impact)\b/gi, '**$1**');
    } else if (style === 'conversational') {
      formatted = formatted.replace(/\b(I believe|In my experience|What I've found)\b/gi, '*$1*');
    }
    
    return formatted;
  }

  /**
   * Format answer as HTML
   */
  private formatAnswerAsHTML(answer: string, style: string): string {
    let html = this.escapeHtml(answer);
    
    // Add paragraph breaks
    html = html.replace(/\. ([A-Z])/g, '.</p><p>$1');
    html = `<p>${html}</p>`;
    
    // Add emphasis based on style
    if (style === 'executive') {
      html = html.replace(/\b(strategic|vision|leadership|results|impact)\b/gi, '<strong>$1</strong>');
    } else if (style === 'conversational') {
      html = html.replace(/\b(I believe|In my experience|What I've found)\b/gi, '<em>$1</em>');
    }
    
    return html;
  }

  /**
   * Generate delivery tips
   */
  private generateDeliveryTips(response: VerbalInterviewResponse, format: string = 'markdown'): string {
    const tips: string[] = [];
    
    // Tone-specific tips
    if (response.tone === 'confident') {
      tips.push('Maintain steady eye contact and speak with conviction');
      tips.push('Use assertive body language - sit up straight, use hand gestures');
      tips.push('Speak at a measured pace to emphasize key points');
    } else if (response.tone === 'thoughtful') {
      tips.push('Take brief pauses to show you\'re considering your words carefully');
      tips.push('Use phrases like "Let me think about that" to show analytical thinking');
      tips.push('Maintain a calm, composed demeanor throughout');
    } else if (response.tone === 'enthusiastic') {
      tips.push('Let your energy show through your voice and facial expressions');
      tips.push('Use varied intonation to keep the interviewer engaged');
      tips.push('Smile naturally when discussing topics you\'re passionate about');
    }

    // General delivery tips
    tips.push('Practice the response out loud to ensure natural flow');
    tips.push('Prepare to adapt the length based on interviewer cues');
    tips.push('Have specific examples ready if asked for more details');

    if (format === 'markdown') {
      return tips.map(tip => `- ${tip}`).join('\n');
    } else {
      return tips.map((tip, index) => `${index + 1}. ${tip}`).join('\n');
    }
  }

  /**
   * Generate delivery tips as HTML
   */
  private generateDeliveryTipsHTML(response: VerbalInterviewResponse): string {
    const tips = this.generateDeliveryTips(response, 'text').split('\n');
    let html = '<ul class="delivery-tips-list">';
    
    tips.forEach(tip => {
      const cleanTip = tip.replace(/^\d+\.\s*/, '');
      html += `<li>${this.escapeHtml(cleanTip)}</li>`;
    });
    
    html += '</ul>';
    return html;
  }

  /**
   * Generate speaking outline
   */
  private generateSpeakingOutline(answer: string): string {
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const outline: string[] = [];
    
    // Create outline with key points
    sentences.forEach((sentence, index) => {
      if (index % 2 === 0) { // Every other sentence for brevity
        const trimmed = sentence.trim();
        if (trimmed.length > 0) {
          outline.push(`• ${trimmed.substring(0, 60)}...`);
        }
      }
    });
    
    return outline.join('\n');
  }

  /**
   * Extract key phrases
   */
  private extractKeyPhrases(answer: string): string {
    const keyPhrases: string[] = [];
    
    // Extract phrases that start with "I"
    const iStatements = answer.match(/I [^.!?]*/g) || [];
    iStatements.slice(0, 3).forEach(statement => {
      keyPhrases.push(`"${statement.trim()}"`);
    });
    
    // Extract important transition phrases
    const transitions = answer.match(/\b(However|Additionally|Furthermore|In conclusion|Most importantly)[^.!?]*/gi) || [];
    transitions.forEach(transition => {
      keyPhrases.push(`"${transition.trim()}"`);
    });
    
    return keyPhrases.join('\n');
  }

  /**
   * Generate timing notes
   */
  private generateTimingNotes(answer: string, duration: string): string {
    const wordCount = answer.split(/\s+/).length;
    const wordsPerMinute = 150;
    const estimatedMinutes = Math.ceil(wordCount / wordsPerMinute);
    
    let notes = `Estimated ${estimatedMinutes} min at normal pace\n`;
    notes += `Word count: ${wordCount} words\n`;
    notes += `Pace: ~${wordsPerMinute} words/minute`;
    
    return notes;
  }

  /**
   * Generate tone reminders
   */
  private generateToneReminders(tone: 'confident' | 'thoughtful' | 'enthusiastic'): string {
    const reminders = {
      confident: [
        'Speak with authority and conviction',
        'Use definitive language ("I will", "I have")',
        'Maintain strong posture and eye contact'
      ],
      thoughtful: [
        'Take measured pauses between key points',
        'Use analytical language ("I analyzed", "I considered")',
        'Show careful consideration in your responses'
      ],
      enthusiastic: [
        'Let your passion show in your voice',
        'Use energetic language ("I love", "I\'m excited")',
        'Maintain animated but professional demeanor'
      ]
    };
    
    return reminders[tone].map((reminder, index) => `${index + 1}. ${reminder}`).join('\n');
  }

  /**
   * Format for practice mode
   */
  formatForPractice(response: VerbalInterviewResponse): string {
    let output = `## Practice Session\n\n`;
    
    output += `**Question:** ${response.question}\n\n`;
    output += `**Your Goal:** Deliver a ${response.tone} response in ${response.duration || '2-3 minutes'}\n\n`;
    
    // Bullet point version for practice
    output += `**Key Points to Cover:**\n`;
    response.keyPoints.forEach(point => {
      output += `- ${point}\n`;
    });
    
    output += `\n**Practice Tips:**\n`;
    output += `- Record yourself and listen back\n`;
    output += `- Time your response\n`;
    output += `- Practice with different emotional tones\n`;
    output += `- Focus on natural transitions between points\n`;
    
    return output;
  }

  /**
   * Format for quick reference
   */
  formatQuick(response: VerbalInterviewResponse): string {
    const keyPoint = response.keyPoints[0] || 'Professional response';
    return `${response.tone.charAt(0).toUpperCase() + response.tone.slice(1)} response (${response.duration || '2-3 min'}): ${keyPoint}`;
  }

  /**
   * Helper methods
   */
  private getToneEmoji(tone: 'confident' | 'thoughtful' | 'enthusiastic'): string {
    const emojis = {
      confident: '💪',
      thoughtful: '🤔',
      enthusiastic: '🌟'
    };
    return emojis[tone];
  }

  private capitalizeTone(tone: string): string {
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  }

  private abbreviateQuestion(question: string): string {
    if (question.length <= 60) return question;
    return question.substring(0, 57) + '...';
  }

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
      .interview-response {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
      }
      
      .interview-question {
        background: #f8fafc;
        border-left: 4px solid #3b82f6;
        padding: 20px;
        margin-bottom: 24px;
        border-radius: 0 8px 8px 0;
      }
      
      .question-text {
        font-size: 1.1em;
        font-weight: 500;
        color: #1e293b;
        margin: 0;
      }
      
      .response-metadata {
        background: #f1f5f9;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      }
      
      .metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      
      .metadata-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .metadata-label {
        font-weight: 600;
        color: #475569;
      }
      
      .metadata-value {
        color: #1e293b;
      }
      
      .tone-confident .metadata-value {
        color: #dc2626;
        font-weight: 600;
      }
      
      .tone-thoughtful .metadata-value {
        color: #7c3aed;
        font-weight: 600;
      }
      
      .tone-enthusiastic .metadata-value {
        color: #ea580c;
        font-weight: 600;
      }
      
      .main-response {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 24px;
      }
      
      .response-text {
        font-size: 1.05em;
        line-height: 1.7;
        color: #334155;
      }
      
      .response-text.executive {
        font-weight: 500;
      }
      
      .response-text.conversational {
        font-style: slightly italic;
      }
      
      .key-points, .followup-prep, .delivery-tips {
        background: #fefefe;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .key-points h3, .followup-prep h3, .delivery-tips h3 {
        color: #1e293b;
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 1.1em;
      }
      
      .key-points ul, .delivery-tips-list {
        margin: 0;
        padding-left: 20px;
      }
      
      .key-points li, .delivery-tips-list li {
        margin-bottom: 8px;
        color: #475569;
      }
      
      .followup-prep ol {
        margin: 0;
        padding-left: 20px;
      }
      
      .followup-prep li {
        margin-bottom: 12px;
        color: #475569;
      }
    `;
  }
}

// Singleton instance
export const interviewFormatter = new InterviewFormatter();