// Specialized prompt templates for coding problems and solutions

import { CodingAnalysisContext } from '../response-generators/coding-generator';

export interface CodingPromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  supportedLanguages: string[];
}

export class CodingPromptTemplates {
  /**
   * Standard coding problem prompt
   */
  static readonly STANDARD_CODING: CodingPromptTemplate = {
    name: 'standard_coding',
    description: 'Standard coding problem solution',
    template: `You are an expert software engineer solving a coding problem. Provide a complete, working solution with detailed explanation.

PROBLEM:
{{problem_statement}}

REQUIREMENTS:
- Programming Language: {{language}}
- Coding Style: {{style}}
- Include comprehensive comments
- Handle edge cases
- Optimize for readability and efficiency

SOLUTION FORMAT:
Provide your solution in the following format:

\`\`\`{{language}}
// Your complete solution here
{{code_placeholder}}
\`\`\`

EXPLANATION:
- Explain your approach and algorithm
- Discuss time and space complexity
- Mention any trade-offs or alternative approaches
- Explain how edge cases are handled

COMPLEXITY ANALYSIS:
- Time Complexity: O(?)
- Space Complexity: O(?)

TEST CASES:
Provide at least 3 test cases including edge cases.

{{additional_context}}

Solve this problem step by step with a clean, efficient solution.`,
    variables: ['problem_statement', 'language', 'style', 'code_placeholder', 'additional_context'],
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust']
  };

  /**
   * Algorithm-focused coding prompt
   */
  static readonly ALGORITHM_FOCUSED: CodingPromptTemplate = {
    name: 'algorithm_focused',
    description: 'Algorithm and data structure focused solution',
    template: `You are an algorithms expert solving a computational problem. Focus on algorithmic efficiency and optimal data structure selection.

PROBLEM: {{problem_statement}}

ALGORITHMIC ANALYSIS:
1. Identify the core algorithmic challenge
2. Choose optimal data structures
3. Consider time/space trade-offs
4. Implement the most efficient solution

LANGUAGE: {{language}}
DIFFICULTY: {{difficulty}}
CATEGORY: {{category}}

SOLUTION APPROACH:
- Analyze the problem complexity
- Select appropriate algorithm (sorting, searching, DP, greedy, etc.)
- Choose optimal data structures
- Implement with focus on efficiency

IMPLEMENTATION:
\`\`\`{{language}}
{{code_placeholder}}
\`\`\`

ALGORITHMIC EXPLANATION:
- Algorithm type and why it's optimal
- Data structures used and their benefits
- Step-by-step algorithm walkthrough
- Complexity analysis with justification

OPTIMIZATION NOTES:
- Discuss any optimizations applied
- Alternative approaches considered
- Trade-offs between time and space

TEST STRATEGY:
- Edge cases specific to the algorithm
- Performance test cases
- Correctness verification

{{constraints_info}}

Provide the most algorithmically sound solution.`,
    variables: ['problem_statement', 'language', 'difficulty', 'category', 'code_placeholder', 'constraints_info'],
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust']
  };

  /**
   * Interview-style coding prompt
   */
  static readonly INTERVIEW_CODING: CodingPromptTemplate = {
    name: 'interview_coding',
    description: 'Interview-style coding problem solution',
    template: `You are in a technical interview solving a coding problem. Demonstrate clear thinking, good coding practices, and communication skills.

INTERVIEW PROBLEM:
{{problem_statement}}

INTERVIEW APPROACH:
1. Clarify the problem and constraints
2. Discuss your approach before coding
3. Write clean, readable code
4. Test your solution
5. Discuss optimizations

LANGUAGE: {{language}}
TIME LIMIT: {{time_limit}} minutes

SOLUTION PROCESS:

STEP 1 - PROBLEM UNDERSTANDING:
- Restate the problem in your own words
- Identify inputs, outputs, and constraints
- Ask clarifying questions (if any)

STEP 2 - APPROACH DISCUSSION:
- Explain your high-level approach
- Discuss algorithm and data structure choices
- Mention time/space complexity expectations

STEP 3 - IMPLEMENTATION:
\`\`\`{{language}}
{{code_placeholder}}
\`\`\`

STEP 4 - TESTING:
- Walk through your code with example inputs
- Identify and test edge cases
- Verify correctness

STEP 5 - OPTIMIZATION:
- Discuss potential improvements
- Consider alternative approaches
- Analyze trade-offs

INTERVIEW COMMUNICATION:
- Explain your thought process clearly
- Mention any assumptions made
- Discuss how you'd handle production considerations

{{interview_context}}

Show your problem-solving skills and coding expertise.`,
    variables: ['problem_statement', 'language', 'time_limit', 'code_placeholder', 'interview_context'],
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'csharp']
  };

  /**
   * System design coding prompt
   */
  static readonly SYSTEM_DESIGN_CODING: CodingPromptTemplate = {
    name: 'system_design_coding',
    description: 'System design implementation focused solution',
    template: `You are designing and implementing a system component. Focus on scalability, maintainability, and production-ready code.

SYSTEM REQUIREMENT:
{{problem_statement}}

DESIGN CONSIDERATIONS:
- Scalability requirements
- Performance constraints
- Maintainability and extensibility
- Error handling and resilience
- Testing and monitoring

LANGUAGE: {{language}}
ARCHITECTURE STYLE: {{style}}

SYSTEM DESIGN:

COMPONENT ARCHITECTURE:
- Define clear interfaces and contracts
- Separate concerns appropriately
- Consider dependency injection
- Plan for configuration management

IMPLEMENTATION:
\`\`\`{{language}}
{{code_placeholder}}
\`\`\`

PRODUCTION CONSIDERATIONS:
- Error handling and logging
- Input validation and sanitization
- Resource management
- Performance monitoring hooks
- Configuration externalization

SCALABILITY FEATURES:
- Async processing where appropriate
- Caching strategies
- Database optimization
- Load balancing considerations

TESTING STRATEGY:
- Unit tests for core logic
- Integration tests for components
- Performance benchmarks
- Error scenario testing

MONITORING & OBSERVABILITY:
- Key metrics to track
- Logging strategy
- Health check endpoints
- Alerting considerations

{{system_constraints}}

Build a production-ready, scalable solution.`,
    variables: ['problem_statement', 'language', 'style', 'code_placeholder', 'system_constraints'],
    supportedLanguages: ['javascript', 'python', 'java', 'csharp', 'go']
  };

  /**
   * Optimization-focused coding prompt
   */
  static readonly OPTIMIZATION_FOCUSED: CodingPromptTemplate = {
    name: 'optimization_focused',
    description: 'Performance optimization focused solution',
    template: `You are optimizing code for maximum performance. Focus on algorithmic efficiency, memory usage, and execution speed.

OPTIMIZATION CHALLENGE:
{{problem_statement}}

PERFORMANCE REQUIREMENTS:
- Target Time Complexity: {{target_time_complexity}}
- Target Space Complexity: {{target_space_complexity}}
- Expected Input Size: {{input_size}}
- Performance Critical: {{is_performance_critical}}

LANGUAGE: {{language}}

OPTIMIZATION STRATEGY:

PERFORMANCE ANALYSIS:
- Identify bottlenecks in naive approach
- Analyze algorithmic complexity
- Consider memory access patterns
- Evaluate I/O operations

OPTIMIZED SOLUTION:
\`\`\`{{language}}
{{code_placeholder}}
\`\`\`

OPTIMIZATION TECHNIQUES APPLIED:
- Algorithm optimization (better complexity)
- Data structure optimization
- Memory access optimization
- Loop optimization
- Caching strategies

PERFORMANCE COMPARISON:
- Before optimization: O(?) time, O(?) space
- After optimization: O(?) time, O(?) space
- Expected performance improvement: X% faster

BENCHMARKING APPROACH:
- Test cases for performance measurement
- Memory usage profiling
- Scalability testing with large inputs

TRADE-OFF ANALYSIS:
- Code complexity vs performance gain
- Memory usage vs execution speed
- Maintainability vs optimization

{{performance_constraints}}

Deliver the most performant solution possible.`,
    variables: ['problem_statement', 'target_time_complexity', 'target_space_complexity', 'input_size', 'is_performance_critical', 'language', 'code_placeholder', 'performance_constraints'],
    supportedLanguages: ['cpp', 'rust', 'java', 'csharp', 'go', 'python', 'javascript']
  };

  /**
   * Generate prompt based on problem characteristics
   */
  static generatePrompt(
    context: CodingAnalysisContext,
    templateName?: string
  ): string {
    // Auto-select template if not specified
    if (!templateName) {
      templateName = this.selectBestTemplate(context);
    }

    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return this.fillTemplate(template, context);
  }

  /**
   * Select the best template based on problem characteristics
   */
  private static selectBestTemplate(context: CodingAnalysisContext): string {
    const { problemStatement, category, timeLimit } = context;
    const statementLower = problemStatement.toLowerCase();

    // Check for system design problems
    if (category === 'system-design' || 
        statementLower.includes('design') || 
        statementLower.includes('architecture') ||
        statementLower.includes('scalable')) {
      return 'system_design_coding';
    }

    // Check for optimization problems
    if (statementLower.includes('optimize') || 
        statementLower.includes('efficient') ||
        statementLower.includes('performance') ||
        statementLower.includes('faster')) {
      return 'optimization_focused';
    }

    // Check for interview context
    if (timeLimit && timeLimit <= 45 || 
        category === 'interview' ||
        statementLower.includes('interview')) {
      return 'interview_coding';
    }

    // Check for algorithm-heavy problems
    if (category === 'algorithms' ||
        statementLower.includes('algorithm') ||
        statementLower.includes('dynamic programming') ||
        statementLower.includes('graph') ||
        statementLower.includes('tree')) {
      return 'algorithm_focused';
    }

    // Default to standard template
    return 'standard_coding';
  }

  /**
   * Get template by name
   */
  private static getTemplate(name: string): CodingPromptTemplate | null {
    const templates = {
      'standard_coding': this.STANDARD_CODING,
      'algorithm_focused': this.ALGORITHM_FOCUSED,
      'interview_coding': this.INTERVIEW_CODING,
      'system_design_coding': this.SYSTEM_DESIGN_CODING,
      'optimization_focused': this.OPTIMIZATION_FOCUSED
    };

    return templates[name as keyof typeof templates] || null;
  }

  /**
   * Fill template with context data
   */
  private static fillTemplate(
    template: CodingPromptTemplate,
    context: CodingAnalysisContext
  ): string {
    let prompt = template.template;

    // Generate code placeholder based on language
    const codePlaceholder = this.generateCodePlaceholder(context.language || 'javascript');

    // Replace variables
    const replacements = {
      problem_statement: context.problemStatement,
      language: context.language || 'javascript',
      style: context.style || 'procedural',
      difficulty: context.difficulty || 'medium',
      category: context.category || 'general',
      time_limit: context.timeLimit?.toString() || '30',
      code_placeholder: codePlaceholder,
      target_time_complexity: this.estimateTargetComplexity(context, 'time'),
      target_space_complexity: this.estimateTargetComplexity(context, 'space'),
      input_size: this.estimateInputSize(context),
      is_performance_critical: this.isPerformanceCritical(context).toString(),
      additional_context: this.generateAdditionalContext(context),
      constraints_info: this.generateConstraintsInfo(context),
      interview_context: this.generateInterviewContext(context),
      system_constraints: this.generateSystemConstraints(context),
      performance_constraints: this.generatePerformanceConstraints(context)
    };

    // Replace all variables in template
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Generate code placeholder based on language
   */
  private static generateCodePlaceholder(language: string): string {
    const placeholders = {
      javascript: `function solveProblem(input) {
    // Your solution here
    return result;
}`,
      python: `def solve_problem(input):
    """Your solution here"""
    return result`,
      java: `public class Solution {
    public ResultType solveProblem(InputType input) {
        // Your solution here
        return result;
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

ResultType solveProblem(InputType input) {
    // Your solution here
    return result;
}`,
      csharp: `public class Solution {
    public ResultType SolveProblem(InputType input) {
        // Your solution here
        return result;
    }
}`,
      go: `func solveProblem(input InputType) ResultType {
    // Your solution here
    return result
}`,
      rust: `fn solve_problem(input: InputType) -> ResultType {
    // Your solution here
    result
}`
    };

    return placeholders[language as keyof typeof placeholders] || placeholders.javascript;
  }

  /**
   * Estimate target complexity based on problem
   */
  private static estimateTargetComplexity(context: CodingAnalysisContext, type: 'time' | 'space'): string {
    const { problemStatement } = context;
    const statementLower = problemStatement.toLowerCase();

    if (statementLower.includes('sort')) {
      return type === 'time' ? 'O(n log n)' : 'O(1)';
    } else if (statementLower.includes('search') && statementLower.includes('binary')) {
      return type === 'time' ? 'O(log n)' : 'O(1)';
    } else if (statementLower.includes('dynamic programming') || statementLower.includes('dp')) {
      return type === 'time' ? 'O(n²)' : 'O(n)';
    } else if (statementLower.includes('graph') || statementLower.includes('tree')) {
      return type === 'time' ? 'O(V + E)' : 'O(V)';
    } else {
      return type === 'time' ? 'O(n)' : 'O(1)';
    }
  }

  /**
   * Estimate input size based on problem
   */
  private static estimateInputSize(context: CodingAnalysisContext): string {
    const { constraints } = context;
    
    if (constraints?.maxInputSize) {
      return constraints.maxInputSize.toString();
    }

    const { problemStatement } = context;
    if (problemStatement.includes('10^6') || problemStatement.includes('1000000')) {
      return '10^6';
    } else if (problemStatement.includes('10^5') || problemStatement.includes('100000')) {
      return '10^5';
    } else if (problemStatement.includes('10^4') || problemStatement.includes('10000')) {
      return '10^4';
    } else {
      return '10^3';
    }
  }

  /**
   * Check if problem is performance critical
   */
  private static isPerformanceCritical(context: CodingAnalysisContext): boolean {
    const { problemStatement, timeLimit } = context;
    const statementLower = problemStatement.toLowerCase();

    return (
      statementLower.includes('optimize') ||
      statementLower.includes('efficient') ||
      statementLower.includes('performance') ||
      statementLower.includes('fast') ||
      (timeLimit !== undefined && timeLimit < 30)
    );
  }

  /**
   * Generate additional context information
   */
  private static generateAdditionalContext(context: CodingAnalysisContext): string {
    const contextParts: string[] = [];

    if (context.constraints) {
      contextParts.push('CONSTRAINTS:');
      if (context.constraints.timeLimit) {
        contextParts.push(`- Time Limit: ${context.constraints.timeLimit}ms`);
      }
      if (context.constraints.memoryLimit) {
        contextParts.push(`- Memory Limit: ${context.constraints.memoryLimit}MB`);
      }
      if (context.constraints.maxInputSize) {
        contextParts.push(`- Max Input Size: ${context.constraints.maxInputSize}`);
      }
    }

    if (context.difficulty) {
      contextParts.push(`DIFFICULTY: ${context.difficulty.toUpperCase()}`);
    }

    return contextParts.join('\n');
  }

  /**
   * Generate constraints information
   */
  private static generateConstraintsInfo(context: CodingAnalysisContext): string {
    if (!context.constraints) {
      return 'No specific constraints provided.';
    }

    const constraints: string[] = [];
    
    if (context.constraints.timeLimit) {
      constraints.push(`Time limit: ${context.constraints.timeLimit}ms`);
    }
    if (context.constraints.memoryLimit) {
      constraints.push(`Memory limit: ${context.constraints.memoryLimit}MB`);
    }
    if (context.constraints.maxInputSize) {
      constraints.push(`Maximum input size: ${context.constraints.maxInputSize}`);
    }

    return constraints.length > 0 
      ? `CONSTRAINTS:\n${constraints.map(c => `- ${c}`).join('\n')}`
      : 'No specific constraints provided.';
  }

  /**
   * Generate interview context
   */
  private static generateInterviewContext(context: CodingAnalysisContext): string {
    const contextParts: string[] = [];

    contextParts.push('INTERVIEW TIPS:');
    contextParts.push('- Think out loud and explain your reasoning');
    contextParts.push('- Start with a brute force solution if needed');
    contextParts.push('- Optimize step by step');
    contextParts.push('- Test your solution with examples');
    contextParts.push('- Discuss edge cases and error handling');

    if (context.timeLimit && context.timeLimit <= 30) {
      contextParts.push('- Time is limited, focus on a working solution first');
    }

    return contextParts.join('\n');
  }

  /**
   * Generate system constraints
   */
  private static generateSystemConstraints(context: CodingAnalysisContext): string {
    const constraints: string[] = [];

    constraints.push('SYSTEM REQUIREMENTS:');
    constraints.push('- Handle concurrent requests');
    constraints.push('- Implement proper error handling');
    constraints.push('- Include logging and monitoring');
    constraints.push('- Design for horizontal scaling');
    constraints.push('- Consider data consistency');

    if (context.constraints?.memoryLimit) {
      constraints.push(`- Memory usage limit: ${context.constraints.memoryLimit}MB`);
    }

    return constraints.join('\n');
  }

  /**
   * Generate performance constraints
   */
  private static generatePerformanceConstraints(context: CodingAnalysisContext): string {
    const constraints: string[] = [];

    constraints.push('PERFORMANCE TARGETS:');
    
    if (context.constraints?.timeLimit) {
      constraints.push(`- Execution time: < ${context.constraints.timeLimit}ms`);
    } else {
      constraints.push('- Execution time: Minimize for large inputs');
    }

    if (context.constraints?.memoryLimit) {
      constraints.push(`- Memory usage: < ${context.constraints.memoryLimit}MB`);
    } else {
      constraints.push('- Memory usage: Optimize for space efficiency');
    }

    constraints.push('- CPU utilization: Minimize computational overhead');
    constraints.push('- Scalability: Handle increasing input sizes gracefully');

    return constraints.join('\n');
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): CodingPromptTemplate[] {
    return [
      this.STANDARD_CODING,
      this.ALGORITHM_FOCUSED,
      this.INTERVIEW_CODING,
      this.SYSTEM_DESIGN_CODING,
      this.OPTIMIZATION_FOCUSED
    ];
  }

  /**
   * Get templates for specific language
   */
  static getTemplatesForLanguage(language: string): CodingPromptTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.supportedLanguages.includes(language.toLowerCase())
    );
  }

  /**
   * Validate template variables
   */
  static validateTemplate(template: CodingPromptTemplate): boolean {
    const templateVars = template.template.match(/{{(\w+)}}/g) || [];
    const definedVars = template.variables.map(v => `{{${v}}}`);
    
    return templateVars.every(v => definedVars.includes(v));
  }
}