// Coding response formatter with syntax highlighting and code presentation

import { CodingResponse, CodeSolution, TestCase } from '../../types/enhanced-response';

export interface CodingFormattingOptions {
  includeExplanation: boolean;
  includeComplexity: boolean;
  includeTestCases: boolean;
  includeAlternatives: boolean;
  showLineNumbers: boolean;
  highlightSyntax: boolean;
  includeComments: boolean;
  showExecutionSteps: boolean;
  format: 'text' | 'markdown' | 'html';
  theme: 'light' | 'dark' | 'auto';
}

export class CodingFormatter {
  private readonly defaultOptions: CodingFormattingOptions = {
    includeExplanation: true,
    includeComplexity: true,
    includeTestCases: true,
    includeAlternatives: false,
    showLineNumbers: true,
    highlightSyntax: true,
    includeComments: true,
    showExecutionSteps: false,
    format: 'markdown',
    theme: 'auto'
  };

  /**
   * Format coding response for display
   */
  formatResponse(
    response: CodingResponse,
    options: Partial<CodingFormattingOptions> = {}
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
  private formatAsMarkdown(response: CodingResponse, options: CodingFormattingOptions): string {
    let output = '';

    // Problem Statement
    output += `## Problem\n\n${response.problemStatement}\n\n`;

    // Solution Code
    output += `## Solution\n\n`;
    output += this.formatCodeBlock(response.solution, options);
    output += '\n\n';

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `## Explanation\n\n${response.explanation}\n\n`;
    }

    // Complexity Analysis
    if (options.includeComplexity) {
      output += `## Complexity Analysis\n\n`;
      output += `- **Time Complexity:** ${response.timeComplexity}\n`;
      output += `- **Space Complexity:** ${response.spaceComplexity}\n\n`;
    }

    // Test Cases
    if (options.includeTestCases && response.testCases.length > 0) {
      output += `## Test Cases\n\n`;
      response.testCases.forEach((testCase, index) => {
        output += `### Test Case ${index + 1}`;
        if (testCase.description) {
          output += ` - ${testCase.description}`;
        }
        output += '\n\n';
        output += `**Input:** \`${this.formatTestInput(testCase.input)}\`\n`;
        output += `**Expected:** \`${this.formatTestOutput(testCase.expected)}\`\n\n`;
      });
    }

    // Alternative Approaches
    if (options.includeAlternatives && response.alternativeApproaches && response.alternativeApproaches.length > 0) {
      output += `## Alternative Approaches\n\n`;
      response.alternativeApproaches.forEach((approach, index) => {
        output += `${index + 1}. ${approach}\n`;
      });
      output += '\n';
    }

    // Constraints
    if (response.constraints) {
      output += `## Constraints\n\n`;
      if (response.constraints.timeLimit) {
        output += `- Time Limit: ${response.constraints.timeLimit}ms\n`;
      }
      if (response.constraints.memoryLimit) {
        output += `- Memory Limit: ${response.constraints.memoryLimit}MB\n`;
      }
      if (response.constraints.maxInputSize) {
        output += `- Max Input Size: ${response.constraints.maxInputSize}\n`;
      }
      output += '\n';
    }

    return output.trim();
  }

  /**
   * Format as plain text
   */
  private formatAsText(response: CodingResponse, options: CodingFormattingOptions): string {
    let output = '';

    // Problem Statement
    output += `PROBLEM:\n${response.problemStatement}\n\n`;

    // Solution Code
    output += `SOLUTION (${response.solution.language.toUpperCase()}):\n`;
    output += this.formatCodeAsText(response.solution, options);
    output += '\n\n';

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `EXPLANATION:\n${response.explanation}\n\n`;
    }

    // Complexity Analysis
    if (options.includeComplexity) {
      output += `COMPLEXITY ANALYSIS:\n`;
      output += `Time Complexity: ${response.timeComplexity}\n`;
      output += `Space Complexity: ${response.spaceComplexity}\n\n`;
    }

    // Test Cases
    if (options.includeTestCases && response.testCases.length > 0) {
      output += `TEST CASES:\n`;
      response.testCases.forEach((testCase, index) => {
        output += `Test ${index + 1}`;
        if (testCase.description) {
          output += ` (${testCase.description})`;
        }
        output += `:\n`;
        output += `  Input: ${this.formatTestInput(testCase.input)}\n`;
        output += `  Expected: ${this.formatTestOutput(testCase.expected)}\n`;
      });
      output += '\n';
    }

    // Alternative Approaches
    if (options.includeAlternatives && response.alternativeApproaches && response.alternativeApproaches.length > 0) {
      output += `ALTERNATIVE APPROACHES:\n`;
      response.alternativeApproaches.forEach((approach, index) => {
        output += `${index + 1}. ${approach}\n`;
      });
      output += '\n';
    }

    return output.trim();
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(response: CodingResponse, options: CodingFormattingOptions): string {
    let output = '<div class="coding-response">';

    // Problem Statement
    output += `<div class="problem-statement">
      <h2>Problem</h2>
      <p>${this.escapeHtml(response.problemStatement)}</p>
    </div>`;

    // Solution Code
    output += '<div class="solution-section">';
    output += '<h2>Solution</h2>';
    output += this.formatCodeAsHTML(response.solution, options);
    output += '</div>';

    // Explanation
    if (options.includeExplanation && response.explanation) {
      output += `<div class="explanation-section">
        <h2>Explanation</h2>
        <div class="explanation-content">${this.formatExplanationAsHTML(response.explanation)}</div>
      </div>`;
    }

    // Complexity Analysis
    if (options.includeComplexity) {
      output += `<div class="complexity-section">
        <h2>Complexity Analysis</h2>
        <ul>
          <li><strong>Time Complexity:</strong> <code>${response.timeComplexity}</code></li>
          <li><strong>Space Complexity:</strong> <code>${response.spaceComplexity}</code></li>
        </ul>
      </div>`;
    }

    // Test Cases
    if (options.includeTestCases && response.testCases.length > 0) {
      output += '<div class="test-cases-section"><h2>Test Cases</h2>';
      response.testCases.forEach((testCase, index) => {
        output += `<div class="test-case">
          <h3>Test Case ${index + 1}${testCase.description ? ` - ${testCase.description}` : ''}</h3>
          <div class="test-io">
            <div class="test-input">
              <strong>Input:</strong> <code>${this.escapeHtml(this.formatTestInput(testCase.input))}</code>
            </div>
            <div class="test-output">
              <strong>Expected:</strong> <code>${this.escapeHtml(this.formatTestOutput(testCase.expected))}</code>
            </div>
          </div>
        </div>`;
      });
      output += '</div>';
    }

    // Alternative Approaches
    if (options.includeAlternatives && response.alternativeApproaches && response.alternativeApproaches.length > 0) {
      output += '<div class="alternatives-section"><h2>Alternative Approaches</h2><ol>';
      response.alternativeApproaches.forEach(approach => {
        output += `<li>${this.escapeHtml(approach)}</li>`;
      });
      output += '</ol></div>';
    }

    output += '</div>';
    return output;
  }

  /**
   * Format code block for markdown
   */
  private formatCodeBlock(solution: CodeSolution, options: CodingFormattingOptions): string {
    let output = `\`\`\`${solution.language}\n`;
    
    if (options.showLineNumbers) {
      const lines = solution.code.split('\n');
      lines.forEach((line, index) => {
        const lineNum = (index + 1).toString().padStart(2, ' ');
        output += `${lineNum} | ${line}\n`;
      });
    } else {
      output += solution.code;
    }
    
    output += '\n```';

    // Add comments if requested
    if (options.includeComments && solution.comments && solution.comments.length > 0) {
      output += '\n\n**Code Comments:**\n';
      solution.comments.forEach(comment => {
        output += `- ${comment}\n`;
      });
    }

    return output;
  }

  /**
   * Format code as plain text
   */
  private formatCodeAsText(solution: CodeSolution, options: CodingFormattingOptions): string {
    let output = '';
    
    if (options.showLineNumbers) {
      const lines = solution.code.split('\n');
      lines.forEach((line, index) => {
        const lineNum = (index + 1).toString().padStart(3, ' ');
        output += `${lineNum} | ${line}\n`;
      });
    } else {
      output = solution.code;
    }

    // Add comments if requested
    if (options.includeComments && solution.comments && solution.comments.length > 0) {
      output += '\n\nCODE COMMENTS:\n';
      solution.comments.forEach(comment => {
        output += `- ${comment}\n`;
      });
    }

    return output;
  }

  /**
   * Format code as HTML with syntax highlighting
   */
  private formatCodeAsHTML(solution: CodeSolution, options: CodingFormattingOptions): string {
    const themeClass = options.theme === 'dark' ? 'code-dark' : 'code-light';
    let output = `<div class="code-container ${themeClass}">`;
    
    output += `<div class="code-header">
      <span class="language-label">${solution.language.toUpperCase()}</span>
      <span class="style-label">${solution.style}</span>
    </div>`;

    output += '<pre class="code-block"><code>';
    
    if (options.showLineNumbers) {
      const lines = solution.code.split('\n');
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        output += `<span class="line-number">${lineNum}</span><span class="code-line">${this.escapeHtml(line)}</span>\n`;
      });
    } else {
      output += this.escapeHtml(solution.code);
    }
    
    output += '</code></pre>';

    // Add comments if requested
    if (options.includeComments && solution.comments && solution.comments.length > 0) {
      output += '<div class="code-comments"><h4>Code Comments</h4><ul>';
      solution.comments.forEach(comment => {
        output += `<li>${this.escapeHtml(comment)}</li>`;
      });
      output += '</ul></div>';
    }

    output += '</div>';
    return output;
  }

  /**
   * Format explanation as HTML with proper structure
   */
  private formatExplanationAsHTML(explanation: string): string {
    // Convert markdown-like formatting to HTML
    let html = this.escapeHtml(explanation);
    
    // Convert headers
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    
    // Convert bold text
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert code spans
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Convert line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = `<p>${html}</p>`;
    
    return html;
  }

  /**
   * Format test input for display
   */
  private formatTestInput(input: any): string {
    if (typeof input === 'string') {
      return `"${input}"`;
    } else if (Array.isArray(input)) {
      return `[${input.map(item => this.formatTestInput(item)).join(', ')}]`;
    } else if (typeof input === 'object' && input !== null) {
      return JSON.stringify(input, null, 2);
    } else {
      return String(input);
    }
  }

  /**
   * Format test output for display
   */
  private formatTestOutput(output: any): string {
    return this.formatTestInput(output); // Same formatting logic
  }

  /**
   * Format for quick display (compact format)
   */
  formatQuick(response: CodingResponse): string {
    const language = response.solution.language.toUpperCase();
    const complexity = `${response.timeComplexity} time, ${response.spaceComplexity} space`;
    
    return `${language} Solution - ${complexity}`;
  }

  /**
   * Format for code review (detailed analysis)
   */
  formatCodeReview(response: CodingResponse): string {
    let output = this.formatAsMarkdown(response, {
      ...this.defaultOptions,
      includeComments: true,
      showLineNumbers: true,
      includeAlternatives: true
    });

    // Add code review section
    output += '\n## Code Review\n\n';
    output += this.generateCodeReviewNotes(response);

    return output;
  }

  /**
   * Format for execution (runnable code)
   */
  formatExecutable(response: CodingResponse): string {
    let output = response.solution.code;

    // Add test execution code
    if (response.testCases.length > 0) {
      output += '\n\n// Test Cases\n';
      response.testCases.forEach((testCase, index) => {
        const input = this.formatTestInput(testCase.input);
        const expected = this.formatTestOutput(testCase.expected);
        
        output += `console.log('Test ${index + 1}:');\n`;
        output += `console.log('Input:', ${input});\n`;
        output += `console.log('Expected:', ${expected});\n`;
        output += `console.log('Result:', solveProblem(${input}));\n`;
        output += `console.log('---');\n`;
      });
    }

    return output;
  }

  /**
   * Generate code review notes
   */
  private generateCodeReviewNotes(response: CodingResponse): string {
    const notes: string[] = [];
    
    // Analyze code quality
    const codeLines = response.solution.code.split('\n').filter(line => line.trim().length > 0);
    
    if (codeLines.length < 10) {
      notes.push('✅ **Concise**: Solution is compact and readable');
    } else if (codeLines.length > 50) {
      notes.push('⚠️ **Length**: Consider breaking down into smaller functions');
    }

    // Check for comments
    const hasComments = response.solution.code.includes('//') || response.solution.code.includes('/*');
    if (hasComments) {
      notes.push('✅ **Documentation**: Code includes helpful comments');
    } else {
      notes.push('💡 **Suggestion**: Add comments to explain complex logic');
    }

    // Check complexity
    if (response.timeComplexity.includes('O(1)') || response.timeComplexity.includes('O(log n)')) {
      notes.push('🚀 **Performance**: Excellent time complexity');
    } else if (response.timeComplexity.includes('O(n²)') || response.timeComplexity.includes('O(2^n)')) {
      notes.push('⚠️ **Performance**: Consider optimizing for better time complexity');
    }

    // Check space complexity
    if (response.spaceComplexity.includes('O(1)')) {
      notes.push('💾 **Memory**: Optimal space usage');
    }

    return notes.join('\n');
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
      .coding-response {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
      }
      
      .coding-response h2 {
        color: #2563eb;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
        margin-bottom: 16px;
      }
      
      .code-container {
        margin: 16px 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }
      
      .code-header {
        background: #f9fafb;
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .language-label {
        font-weight: bold;
        color: #374151;
      }
      
      .style-label {
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: capitalize;
      }
      
      .code-block {
        background: #ffffff;
        padding: 16px;
        margin: 0;
        overflow-x: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
      }
      
      .code-dark .code-block {
        background: #1f2937;
        color: #f9fafb;
      }
      
      .line-number {
        display: inline-block;
        width: 40px;
        color: #9ca3af;
        text-align: right;
        margin-right: 16px;
        user-select: none;
      }
      
      .code-line {
        display: inline-block;
        width: calc(100% - 56px);
      }
      
      .test-case {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 16px;
        margin: 12px 0;
      }
      
      .test-case h3 {
        margin-top: 0;
        color: #374151;
      }
      
      .test-io {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 12px;
      }
      
      .test-input, .test-output {
        background: white;
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
      }
      
      .complexity-section ul {
        list-style: none;
        padding: 0;
      }
      
      .complexity-section li {
        padding: 8px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .complexity-section li:last-child {
        border-bottom: none;
      }
      
      .code-comments {
        background: #f9fafb;
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
      }
      
      .code-comments h4 {
        margin: 0 0 8px 0;
        color: #374151;
      }
      
      .code-comments ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .alternatives-section ol {
        padding-left: 20px;
      }
      
      .alternatives-section li {
        margin: 8px 0;
      }
    `;
  }
}

// Singleton instance
export const codingFormatter = new CodingFormatter();