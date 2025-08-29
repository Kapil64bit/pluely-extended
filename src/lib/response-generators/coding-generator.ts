// Coding response generator with language-specific templates and analysis

import { CodingResponse, CodeSolution, TestCase, ProblemConstraints } from '../../types/enhanced-response';

export interface CodingAnalysisContext {
  problemStatement: string;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string; // algorithms, data-structures, system-design, etc.
  constraints?: ProblemConstraints;
  timeLimit?: number;
  includeTests?: boolean;
  style?: 'functional' | 'object-oriented' | 'procedural';
}

export interface CodingGenerationOptions {
  includeExplanation: boolean;
  includeComplexity: boolean;
  includeTestCases: boolean;
  includeAlternatives: boolean;
  includeComments: boolean;
  optimizeForReadability: boolean;
  showStepByStep: boolean;
  includeEdgeCases: boolean;
}

export class CodingResponseGenerator {
  private readonly defaultOptions: CodingGenerationOptions = {
    includeExplanation: true,
    includeComplexity: true,
    includeTestCases: true,
    includeAlternatives: false,
    includeComments: true,
    optimizeForReadability: true,
    showStepByStep: true,
    includeEdgeCases: true
  };

  /**
   * Generate specialized prompt for coding problems
   */
  async generatePrompt(context: CodingAnalysisContext): Promise<string> {
    const { problemStatement, language, difficulty, category, includeTests, style } = context;
    
    let prompt = `You are a senior software engineer and coding expert. `;
    
    if (language) {
      prompt += `You specialize in ${language} programming. `;
    }
    
    if (difficulty) {
      prompt += `This is a ${difficulty}-level problem. `;
    }

    if (category) {
      prompt += `The problem category is ${category}. `;
    }

    prompt += `

PROBLEM STATEMENT:
${problemStatement}

REQUIREMENTS:
1. Provide a clean, efficient solution
2. Include detailed explanation of your approach
3. Analyze time and space complexity
4. Add meaningful comments to explain key logic
5. Consider edge cases and error handling
`;

    if (language) {
      prompt += `6. Use ${language} best practices and idioms
`;
    }

    if (includeTests) {
      prompt += `7. Include comprehensive test cases
`;
    }

    if (style) {
      prompt += `8. Follow ${style} programming style
`;
    }

    prompt += `
RESPONSE FORMAT:
- Approach: [High-level strategy and algorithm choice]
- Solution: [Complete, working code with comments]
- Explanation: [Step-by-step walkthrough of the solution]
- Complexity Analysis: [Time and space complexity with reasoning]
- Edge Cases: [Important edge cases and how they're handled]
`;

    if (includeTests) {
      prompt += `- Test Cases: [Comprehensive test cases including edge cases]
`;
    }

    prompt += `- Alternative Approaches: [Brief mention of other possible solutions]

Please provide a production-ready solution with clear explanations that demonstrate expert-level understanding.`;

    return prompt;
  }

  private readonly languageConfigs = {
    javascript: {
      extension: 'js',
      commentStyle: '//',
      features: ['arrow-functions', 'destructuring', 'async-await'],
      testFramework: 'jest'
    },
    python: {
      extension: 'py',
      commentStyle: '#',
      features: ['list-comprehensions', 'generators', 'decorators'],
      testFramework: 'pytest'
    },
    java: {
      extension: 'java',
      commentStyle: '//',
      features: ['generics', 'streams', 'lambda'],
      testFramework: 'junit'
    },
    cpp: {
      extension: 'cpp',
      commentStyle: '//',
      features: ['templates', 'stl', 'smart-pointers'],
      testFramework: 'gtest'
    },
    csharp: {
      extension: 'cs',
      commentStyle: '//',
      features: ['linq', 'generics', 'async'],
      testFramework: 'nunit'
    },
    go: {
      extension: 'go',
      commentStyle: '//',
      features: ['goroutines', 'channels', 'interfaces'],
      testFramework: 'testing'
    },
    rust: {
      extension: 'rs',
      commentStyle: '//',
      features: ['ownership', 'pattern-matching', 'traits'],
      testFramework: 'cargo-test'
    }
  };

  /**
   * Generate coding response with solution and analysis
   */
  async generateResponse(
    context: CodingAnalysisContext,
    options: Partial<CodingGenerationOptions> = {}
  ): Promise<CodingResponse> {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // Analyze the problem
      const analysis = this.analyzeProblem(context);
      
      // Generate code solution
      const solution = await this.generateCodeSolution(context, analysis, config);
      
      // Generate explanation
      const explanation = config.includeExplanation
        ? this.generateExplanation(context, solution, analysis)
        : '';

      // Analyze complexity
      const { timeComplexity, spaceComplexity } = config.includeComplexity
        ? this.analyzeComplexity(context, solution, analysis)
        : { timeComplexity: 'O(?)', spaceComplexity: 'O(?)' };

      // Generate test cases
      const testCases = config.includeTestCases
        ? this.generateTestCases(context, solution, analysis)
        : [];

      // Generate alternative approaches
      const alternativeApproaches = config.includeAlternatives
        ? this.generateAlternativeApproaches(context, analysis)
        : [];

      return {
        problemStatement: context.problemStatement,
        solution,
        explanation,
        timeComplexity,
        spaceComplexity,
        testCases,
        alternativeApproaches,
        constraints: context.constraints
      };

    } catch (error) {
      console.error('Error generating coding response:', error);
      return this.generateFallbackResponse(context);
    }
  }

  /**
   * Generate code solution based on context and analysis
   */
  private async generateCodeSolution(
    context: CodingAnalysisContext,
    analysis: any,
    options: CodingGenerationOptions
  ): Promise<CodeSolution> {
    const language = context.language || 'javascript';
    const style = context.style || this.determineOptimalStyle(analysis);
    
    // Generate the actual code (this would typically call an AI model)
    const code = this.generateCodeImplementation(context, analysis, language, style, options);
    
    return {
      language,
      code,
      style,
      comments: options.includeComments ? this.generateCodeComments(code, language) : []
    };
  }

  /**
   * Generate code implementation
   */
  private generateCodeImplementation(
    context: CodingAnalysisContext,
    analysis: any,
    language: string,
    style: 'functional' | 'object-oriented' | 'procedural',
    options: CodingGenerationOptions
  ): string {
    // This is a simplified implementation - in practice, this would use AI models
    const templates = this.getCodeTemplates(language, style);
    const problemType = analysis.problemType;
    
    if (templates[problemType]) {
      return this.fillCodeTemplate(templates[problemType], context, analysis);
    }
    
    // Fallback generic template
    return this.generateGenericSolution(context, language, style);
  }

  /**
   * Get code templates for different problem types
   */
  private getCodeTemplates(language: string, style: string): Record<string, string> {
    const templates: Record<string, Record<string, string>> = {
      javascript: {
        array_manipulation: `
function solveProblem(${this.getParameterTemplate('javascript')}) {
    // Initialize result
    let result = [];
    
    // Process input
    for (let i = 0; i < input.length; i++) {
        // Apply logic here
        result.push(processElement(input[i]));
    }
    
    return result;
}

function processElement(element) {
    // Element processing logic
    return element;
}`,
        string_processing: `
function solveProblem(str) {
    // Validate input
    if (!str || typeof str !== 'string') {
        return '';
    }
    
    // Process string
    let result = '';
    for (let char of str) {
        // Apply character processing
        result += processChar(char);
    }
    
    return result;
}

function processChar(char) {
    // Character processing logic
    return char;
}`,
        tree_traversal: `
function solveProblem(root) {
    if (!root) return null;
    
    const result = [];
    
    function traverse(node) {
        if (!node) return;
        
        // Process current node
        result.push(node.val);
        
        // Traverse children
        traverse(node.left);
        traverse(node.right);
    }
    
    traverse(root);
    return result;
}`
      },
      python: {
        array_manipulation: `
def solve_problem(input_array):
    """
    Solve the problem with the given input array.
    
    Args:
        input_array: List of elements to process
        
    Returns:
        List of processed results
    """
    if not input_array:
        return []
    
    result = []
    for element in input_array:
        # Apply processing logic
        processed = process_element(element)
        result.append(processed)
    
    return result

def process_element(element):
    """Process individual element."""
    return element`,
        string_processing: `
def solve_problem(s):
    """
    Process the input string.
    
    Args:
        s: Input string to process
        
    Returns:
        Processed string result
    """
    if not s:
        return ""
    
    result = []
    for char in s:
        # Apply character processing
        processed_char = process_char(char)
        result.append(processed_char)
    
    return ''.join(result)

def process_char(char):
    """Process individual character."""
    return char`
      }
    };
    
    return templates[language] || {};
  }

  /**
   * Analyze problem characteristics
   */
  private analyzeProblem(context: CodingAnalysisContext): any {
    const { problemStatement } = context;
    const statementLower = problemStatement.toLowerCase();
    
    return {
      problemType: this.identifyProblemType(problemStatement),
      dataStructures: this.identifyDataStructures(problemStatement),
      algorithms: this.identifyAlgorithms(problemStatement),
      complexity: this.estimateComplexity(problemStatement),
      hasEdgeCases: this.identifyEdgeCases(problemStatement),
      isOptimizationProblem: statementLower.includes('optimize') || statementLower.includes('efficient'),
      requiresValidation: statementLower.includes('valid') || statementLower.includes('check'),
      hasConstraints: context.constraints !== undefined
    };
  }

  /**
   * Identify problem type from statement
   */
  private identifyProblemType(statement: string): string {
    const statementLower = statement.toLowerCase();
    
    if (statementLower.includes('array') || statementLower.includes('list')) {
      return 'array_manipulation';
    } else if (statementLower.includes('string') || statementLower.includes('text')) {
      return 'string_processing';
    } else if (statementLower.includes('tree') || statementLower.includes('node')) {
      return 'tree_traversal';
    } else if (statementLower.includes('graph') || statementLower.includes('vertex')) {
      return 'graph_algorithms';
    } else if (statementLower.includes('sort') || statementLower.includes('order')) {
      return 'sorting';
    } else if (statementLower.includes('search') || statementLower.includes('find')) {
      return 'searching';
    } else if (statementLower.includes('dynamic') || statementLower.includes('dp')) {
      return 'dynamic_programming';
    } else {
      return 'general_algorithm';
    }
  }

  /**
   * Identify required data structures
   */
  private identifyDataStructures(statement: string): string[] {
    const structures: string[] = [];
    const statementLower = statement.toLowerCase();
    
    const dataStructureKeywords = {
      'array': ['array', 'list'],
      'stack': ['stack', 'lifo'],
      'queue': ['queue', 'fifo'],
      'heap': ['heap', 'priority'],
      'hash_table': ['hash', 'map', 'dictionary'],
      'tree': ['tree', 'binary tree'],
      'graph': ['graph', 'vertex', 'edge'],
      'linked_list': ['linked list', 'node']
    };
    
    Object.entries(dataStructureKeywords).forEach(([structure, keywords]) => {
      if (keywords.some(keyword => statementLower.includes(keyword))) {
        structures.push(structure);
      }
    });
    
    return structures;
  }

  /**
   * Identify required algorithms
   */
  private identifyAlgorithms(statement: string): string[] {
    const algorithms: string[] = [];
    const statementLower = statement.toLowerCase();
    
    const algorithmKeywords = {
      'binary_search': ['binary search', 'log n'],
      'two_pointers': ['two pointer', 'left right'],
      'sliding_window': ['sliding window', 'subarray'],
      'dfs': ['depth first', 'dfs', 'recursive'],
      'bfs': ['breadth first', 'bfs', 'level order'],
      'dynamic_programming': ['dynamic programming', 'dp', 'memoization'],
      'greedy': ['greedy', 'optimal choice'],
      'divide_conquer': ['divide and conquer', 'merge']
    };
    
    Object.entries(algorithmKeywords).forEach(([algorithm, keywords]) => {
      if (keywords.some(keyword => statementLower.includes(keyword))) {
        algorithms.push(algorithm);
      }
    });
    
    return algorithms;
  }

  /**
   * Estimate problem complexity
   */
  private estimateComplexity(statement: string): 'low' | 'medium' | 'high' {
    const statementLower = statement.toLowerCase();
    let complexityScore = 0;
    
    // Length-based complexity
    if (statement.length > 500) complexityScore += 2;
    else if (statement.length > 200) complexityScore += 1;
    
    // Keyword-based complexity
    const complexKeywords = ['optimize', 'efficient', 'minimum', 'maximum', 'dynamic', 'recursive'];
    complexityScore += complexKeywords.filter(keyword => statementLower.includes(keyword)).length;
    
    // Multiple data structures
    const dataStructures = this.identifyDataStructures(statement);
    if (dataStructures.length > 2) complexityScore += 2;
    else if (dataStructures.length > 1) complexityScore += 1;
    
    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Identify potential edge cases
   */
  private identifyEdgeCases(statement: string): string[] {
    const edgeCases: string[] = [];
    const statementLower = statement.toLowerCase();
    
    if (statementLower.includes('array') || statementLower.includes('list')) {
      edgeCases.push('Empty array', 'Single element', 'All elements same');
    }
    
    if (statementLower.includes('string')) {
      edgeCases.push('Empty string', 'Single character', 'All characters same');
    }
    
    if (statementLower.includes('number') || statementLower.includes('integer')) {
      edgeCases.push('Zero', 'Negative numbers', 'Large numbers');
    }
    
    if (statementLower.includes('tree') || statementLower.includes('node')) {
      edgeCases.push('Empty tree', 'Single node', 'Unbalanced tree');
    }
    
    return edgeCases;
  }

  /**
   * Determine optimal coding style
   */
  private determineOptimalStyle(analysis: any): 'functional' | 'object-oriented' | 'procedural' {
    if (analysis.dataStructures.includes('tree') || analysis.dataStructures.includes('graph')) {
      return 'object-oriented';
    } else if (analysis.algorithms.includes('dynamic_programming') || analysis.algorithms.includes('recursive')) {
      return 'functional';
    } else {
      return 'procedural';
    }
  }

  /**
   * Generate explanation for the solution
   */
  private generateExplanation(
    context: CodingAnalysisContext,
    solution: CodeSolution,
    analysis: any
  ): string {
    let explanation = `## Solution Explanation\n\n`;
    
    explanation += `**Problem Type:** ${analysis.problemType.replace('_', ' ')}\n\n`;
    
    explanation += `**Approach:**\n`;
    explanation += `This solution uses a ${solution.style} approach to solve the problem. `;
    
    if (analysis.algorithms.length > 0) {
      explanation += `The main algorithm employed is ${analysis.algorithms[0].replace('_', ' ')}.\n\n`;
    } else {
      explanation += `The solution follows a straightforward algorithmic approach.\n\n`;
    }
    
    explanation += `**Key Steps:**\n`;
    explanation += `1. Input validation and edge case handling\n`;
    explanation += `2. Initialize necessary data structures\n`;
    explanation += `3. Process the input using the chosen algorithm\n`;
    explanation += `4. Return the computed result\n\n`;
    
    if (analysis.dataStructures.length > 0) {
      explanation += `**Data Structures Used:**\n`;
      analysis.dataStructures.forEach((ds: string) => {
        explanation += `- ${ds.replace('_', ' ')}\n`;
      });
      explanation += '\n';
    }
    
    if (analysis.hasEdgeCases.length > 0) {
      explanation += `**Edge Cases Handled:**\n`;
      analysis.hasEdgeCases.forEach((edge: string) => {
        explanation += `- ${edge}\n`;
      });
      explanation += '\n';
    }
    
    return explanation;
  }

  /**
   * Analyze time and space complexity
   */
  private analyzeComplexity(
    context: CodingAnalysisContext,
    solution: CodeSolution,
    analysis: any
  ): { timeComplexity: string; spaceComplexity: string } {
    // This is a simplified complexity analysis
    // In practice, this would use more sophisticated analysis
    
    let timeComplexity = 'O(n)';
    let spaceComplexity = 'O(1)';
    
    // Adjust based on problem type and algorithms
    if (analysis.algorithms.includes('binary_search')) {
      timeComplexity = 'O(log n)';
    } else if (analysis.algorithms.includes('dynamic_programming')) {
      timeComplexity = 'O(n²)';
      spaceComplexity = 'O(n)';
    } else if (analysis.problemType === 'sorting') {
      timeComplexity = 'O(n log n)';
    } else if (analysis.problemType === 'tree_traversal') {
      timeComplexity = 'O(n)';
      spaceComplexity = 'O(h)'; // h = height of tree
    } else if (analysis.problemType === 'graph_algorithms') {
      timeComplexity = 'O(V + E)';
      spaceComplexity = 'O(V)';
    }
    
    // Adjust for nested loops in code
    const nestedLoops = (solution.code.match(/for.*for/g) || []).length;
    if (nestedLoops > 0) {
      timeComplexity = `O(n^${nestedLoops + 1})`;
    }
    
    return { timeComplexity, spaceComplexity };
  }

  /**
   * Generate test cases for the solution
   */
  private generateTestCases(
    context: CodingAnalysisContext,
    solution: CodeSolution,
    analysis: any
  ): TestCase[] {
    const testCases: TestCase[] = [];
    
    // Basic test case
    testCases.push({
      input: this.generateBasicInput(analysis.problemType),
      expected: this.generateBasicOutput(analysis.problemType),
      description: 'Basic functionality test'
    });
    
    // Edge cases
    if (analysis.hasEdgeCases.includes('Empty array')) {
      testCases.push({
        input: [],
        expected: this.generateEmptyOutput(analysis.problemType),
        description: 'Empty input test'
      });
    }
    
    if (analysis.hasEdgeCases.includes('Single element')) {
      testCases.push({
        input: this.generateSingleElementInput(analysis.problemType),
        expected: this.generateSingleElementOutput(analysis.problemType),
        description: 'Single element test'
      });
    }
    
    // Large input test
    testCases.push({
      input: this.generateLargeInput(analysis.problemType),
      expected: this.generateLargeOutput(analysis.problemType),
      description: 'Large input performance test'
    });
    
    return testCases;
  }

  /**
   * Generate alternative approaches
   */
  private generateAlternativeApproaches(
    context: CodingAnalysisContext,
    analysis: any
  ): string[] {
    const alternatives: string[] = [];
    
    if (analysis.problemType === 'array_manipulation') {
      alternatives.push('Use built-in array methods for more concise code');
      alternatives.push('Implement using functional programming approach with map/filter/reduce');
      alternatives.push('Use two-pointer technique for space optimization');
    }
    
    if (analysis.problemType === 'string_processing') {
      alternatives.push('Use regular expressions for pattern matching');
      alternatives.push('Implement using string builder for better performance');
      alternatives.push('Use character array manipulation for in-place operations');
    }
    
    if (analysis.algorithms.includes('recursive')) {
      alternatives.push('Convert recursive solution to iterative using stack');
      alternatives.push('Add memoization to optimize recursive calls');
    }
    
    return alternatives;
  }

  /**
   * Generate code comments
   */
  private generateCodeComments(code: string, language: string): string[] {
    const comments: string[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('function') || line.trim().startsWith('def')) {
        comments.push(`Line ${index + 1}: Function definition`);
      } else if (line.includes('for') || line.includes('while')) {
        comments.push(`Line ${index + 1}: Loop iteration`);
      } else if (line.includes('if') || line.includes('else')) {
        comments.push(`Line ${index + 1}: Conditional logic`);
      } else if (line.includes('return')) {
        comments.push(`Line ${index + 1}: Return statement`);
      }
    });
    
    return comments;
  }

  /**
   * Helper methods for test case generation
   */
  private generateBasicInput(problemType: string): any {
    const inputs = {
      array_manipulation: [1, 2, 3, 4, 5],
      string_processing: 'hello world',
      tree_traversal: { val: 1, left: { val: 2 }, right: { val: 3 } },
      sorting: [3, 1, 4, 1, 5],
      searching: { array: [1, 2, 3, 4, 5], target: 3 }
    };
    return inputs[problemType as keyof typeof inputs] || [1, 2, 3];
  }

  private generateBasicOutput(problemType: string): any {
    const outputs = {
      array_manipulation: [1, 2, 3, 4, 5],
      string_processing: 'hello world',
      tree_traversal: [1, 2, 3],
      sorting: [1, 1, 3, 4, 5],
      searching: 2
    };
    return outputs[problemType as keyof typeof outputs] || [1, 2, 3];
  }

  private generateEmptyOutput(problemType: string): any {
    const outputs = {
      array_manipulation: [],
      string_processing: '',
      tree_traversal: [],
      sorting: [],
      searching: -1
    };
    return outputs[problemType as keyof typeof outputs] || [];
  }

  private generateSingleElementInput(problemType: string): any {
    const inputs = {
      array_manipulation: [42],
      string_processing: 'a',
      tree_traversal: { val: 1 },
      sorting: [42],
      searching: { array: [42], target: 42 }
    };
    return inputs[problemType as keyof typeof inputs] || [42];
  }

  private generateSingleElementOutput(problemType: string): any {
    const outputs = {
      array_manipulation: [42],
      string_processing: 'a',
      tree_traversal: [1],
      sorting: [42],
      searching: 0
    };
    return outputs[problemType as keyof typeof outputs] || [42];
  }

  private generateLargeInput(problemType: string): any {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i + 1);
    const inputs = {
      array_manipulation: largeArray,
      string_processing: 'a'.repeat(1000),
      sorting: largeArray.reverse(),
      searching: { array: largeArray, target: 500 }
    };
    return inputs[problemType as keyof typeof inputs] || largeArray;
  }

  private generateLargeOutput(problemType: string): any {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i + 1);
    const outputs = {
      array_manipulation: largeArray,
      string_processing: 'a'.repeat(1000),
      sorting: largeArray,
      searching: 499
    };
    return outputs[problemType as keyof typeof outputs] || largeArray;
  }

  /**
   * Fill code template with context data
   */
  private fillCodeTemplate(template: string, context: CodingAnalysisContext, analysis: any): string {
    return template
      .replace(/\$\{problemType\}/g, analysis.problemType)
      .replace(/\$\{language\}/g, context.language || 'javascript')
      .replace(/\$\{style\}/g, context.style || 'procedural');
  }

  /**
   * Generate generic solution when no template matches
   */
  private generateGenericSolution(
    context: CodingAnalysisContext,
    language: string,
    style: string
  ): string {
    const templates = {
      javascript: `
function solveProblem(input) {
    // Validate input
    if (!input) {
        return null;
    }
    
    // Initialize result
    let result;
    
    // Process input
    // TODO: Implement solution logic here
    
    return result;
}`,
      python: `
def solve_problem(input_data):
    """
    Solve the given problem.
    
    Args:
        input_data: The input to process
        
    Returns:
        The solution result
    """
    if not input_data:
        return None
    
    # Initialize result
    result = None
    
    # Process input
    # TODO: Implement solution logic here
    
    return result`
    };
    
    return templates[language as keyof typeof templates] || templates.javascript;
  }

  /**
   * Get parameter template for language
   */
  private getParameterTemplate(language: string): string {
    const templates = {
      javascript: 'input',
      python: 'input_data',
      java: 'input',
      cpp: 'input',
      csharp: 'input',
      go: 'input',
      rust: 'input'
    };
    return templates[language as keyof typeof templates] || 'input';
  }

  /**
   * Generate fallback response when generation fails
   */
  private generateFallbackResponse(context: CodingAnalysisContext): CodingResponse {
    const language = context.language || 'javascript';
    
    return {
      problemStatement: context.problemStatement,
      solution: {
        language,
        code: this.generateGenericSolution(context, language, 'procedural'),
        style: 'procedural',
        comments: ['This is a generic solution template', 'Please implement the specific logic']
      },
      explanation: 'Unable to generate a specific solution. Please implement the logic based on the problem requirements.',
      timeComplexity: 'O(?)',
      spaceComplexity: 'O(?)',
      testCases: [{
        input: 'sample_input',
        expected: 'expected_output',
        description: 'Basic test case'
      }],
      alternativeApproaches: ['Consider different algorithmic approaches', 'Optimize for time or space complexity'],
      constraints: context.constraints
    };
  }

  /**
   * Validate coding response
   */
  validateResponse(response: CodingResponse): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!response.solution.code || response.solution.code.trim().length === 0) {
      errors.push('Missing code solution');
    }

    if (!response.explanation || response.explanation.length < 20) {
      errors.push('Explanation is missing or too short');
    }

    if (!response.timeComplexity || !response.spaceComplexity) {
      errors.push('Missing complexity analysis');
    }

    // Check code quality
    if (response.solution.code && !this.hasBasicStructure(response.solution.code)) {
      warnings.push('Code may be missing basic structure (functions, error handling)');
    }

    if (response.testCases.length === 0) {
      warnings.push('No test cases provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if code has basic structure
   */
  private hasBasicStructure(code: string): boolean {
    const hasFunction = /function|def|public|private/.test(code);
    const hasLogic = code.split('\n').filter(line => line.trim().length > 0).length > 5;
    return hasFunction && hasLogic;
  }
}

// Singleton instance
export const codingGenerator = new CodingResponseGenerator();