// Enhanced programming language detection with advanced algorithms

export interface LanguageSignature {
  keywords: string[];
  syntaxPatterns: RegExp[];
  fileExtensions: string[];
  uniqueFeatures: RegExp[];
  commentPatterns: RegExp[];
  stringPatterns: RegExp[];
  importPatterns: RegExp[];
  functionPatterns: RegExp[];
  variablePatterns: RegExp[];
  classPatterns: RegExp[];
  weightMultipliers: {
    keywords: number;
    syntax: number;
    unique: number;
    structure: number;
  };
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  matchedFeatures: {
    keywords: string[];
    syntaxPatterns: string[];
    uniqueFeatures: string[];
    structuralElements: string[];
  };
  alternativeLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

export class LanguageDetector {
  private languageSignatures: Record<string, LanguageSignature> = {
    javascript: {
      keywords: [
        'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
        'class', 'extends', 'import', 'export', 'async', 'await', 'promise',
        'console', 'document', 'window', 'addEventListener', 'setTimeout', 'setInterval',
        'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'undefined', 'null',
        'typeof', 'instanceof', 'new', 'this', 'super', 'static', 'get', 'set'
      ],
      syntaxPatterns: [
        /=>/g, // Arrow functions
        /===|!==/g, // Strict equality
        /\$\{[^}]+\}/g, // Template literals
        /\.then\(/g, // Promises
        /\.catch\(/g, // Promise catch
        /\.map\(/g, // Array methods
        /\.filter\(/g,
        /\.reduce\(/g
      ],
      fileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs'],
      uniqueFeatures: [
        /console\.log\(/gi,
        /document\.getElementById/gi,
        /window\./gi,
        /addEventListener/gi,
        /require\(/gi,
        /module\.exports/gi,
        /export\s+default/gi,
        /import\s+.*\s+from/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm, // Single line
        /\/\*[\s\S]*?\*\//g // Multi line
      ],
      stringPatterns: [
        /"[^"]*"/g, // Double quotes
        /'[^']*'/g, // Single quotes
        /`[^`]*`/g // Template literals
      ],
      importPatterns: [
        /import\s+.*\s+from\s+['"][^'"]+['"]/gi,
        /require\(['"][^'"]+['"]\)/gi,
        /import\(['"][^'"]+['"]\)/gi
      ],
      functionPatterns: [
        /function\s+\w+\s*\(/gi,
        /\w+\s*=\s*function\s*\(/gi,
        /\w+\s*=\s*\([^)]*\)\s*=>/gi,
        /\w+\s*:\s*function\s*\(/gi
      ],
      variablePatterns: [
        /(?:let|const|var)\s+\w+/gi
      ],
      classPatterns: [
        /class\s+\w+/gi,
        /extends\s+\w+/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.5,
        unique: 2.0,
        structure: 1.2
      }
    },

    python: {
      keywords: [
        'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while',
        'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'print', 'input',
        '__init__', '__main__', '__name__', 'self', 'True', 'False', 'None', 'and', 'or', 'not',
        'in', 'is', 'pass', 'break', 'continue', 'global', 'nonlocal', 'assert', 'del'
      ],
      syntaxPatterns: [
        /:\s*$/gm, // Colon at end of line
        /^\s+/gm, // Indentation
        /\*\*\w+/g, // Keyword arguments
        /\*args/g, // Variable arguments
        /\*\*kwargs/g, // Keyword arguments
        /@\w+/g, // Decorators
        /f["'][^"']*\{[^}]+\}[^"']*["']/g // f-strings
      ],
      fileExtensions: ['py', 'pyw', 'pyx', 'pyi'],
      uniqueFeatures: [
        /print\(/gi,
        /input\(/gi,
        /len\(/gi,
        /range\(/gi,
        /enumerate\(/gi,
        /zip\(/gi,
        /isinstance\(/gi,
        /hasattr\(/gi,
        /__init__/gi,
        /__str__/gi,
        /__repr__/gi
      ],
      commentPatterns: [
        /#.*$/gm, // Single line
        /"""[\s\S]*?"""/g, // Triple quotes
        /'''[\s\S]*?'''/g
      ],
      stringPatterns: [
        /"[^"]*"/g,
        /'[^']*'/g,
        /"""[\s\S]*?"""/g,
        /'''[\s\S]*?'''/g,
        /f["'][^"']*["']/g, // f-strings
        /r["'][^"']*["']/g // raw strings
      ],
      importPatterns: [
        /import\s+\w+/gi,
        /from\s+\w+\s+import/gi,
        /import\s+\w+\s+as\s+\w+/gi
      ],
      functionPatterns: [
        /def\s+\w+\s*\(/gi,
        /lambda\s+[^:]*:/gi
      ],
      variablePatterns: [
        /\w+\s*=\s*[^=]/g
      ],
      classPatterns: [
        /class\s+\w+/gi,
        /class\s+\w+\([^)]*\)/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.8,
        unique: 2.0,
        structure: 1.3
      }
    },

    java: {
      keywords: [
        'public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface',
        'extends', 'implements', 'import', 'package', 'return', 'if', 'else', 'for', 'while',
        'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'instanceof',
        'String', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void',
        'ArrayList', 'HashMap', 'List', 'Map', 'Set', 'Collection'
      ],
      syntaxPatterns: [
        /\w+\s+\w+\s*\([^)]*\)\s*\{/g, // Method definitions
        /\w+\[\]/g, // Array declarations
        /\w+<\w+>/g, // Generics
        /@\w+/g, // Annotations
        /\w+::\w+/g, // Method references
        /\.\w+\(/g // Method calls
      ],
      fileExtensions: ['java', 'class'],
      uniqueFeatures: [
        /System\.out\.println/gi,
        /System\.out\.print/gi,
        /Scanner/gi,
        /ArrayList/gi,
        /HashMap/gi,
        /public\s+static\s+void\s+main/gi,
        /String\[\]\s+args/gi,
        /\.length\(\)/gi,
        /\.size\(\)/gi,
        /\.equals\(/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm,
        /\/\*[\s\S]*?\*\//g,
        /\/\*\*[\s\S]*?\*\//g // Javadoc
      ],
      stringPatterns: [
        /"[^"]*"/g
      ],
      importPatterns: [
        /import\s+[\w.]+\*?;/gi,
        /package\s+[\w.]+;/gi
      ],
      functionPatterns: [
        /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\(/gi
      ],
      variablePatterns: [
        /(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*\w+\s+\w+/gi
      ],
      classPatterns: [
        /(?:public|private|protected)?\s*(?:abstract)?\s*class\s+\w+/gi,
        /(?:public|private|protected)?\s*interface\s+\w+/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.3,
        unique: 2.0,
        structure: 1.5
      }
    },

    cpp: {
      keywords: [
        '#include', 'using', 'namespace', 'std', 'int', 'char', 'float', 'double', 'long',
        'bool', 'void', 'class', 'struct', 'union', 'enum', 'public', 'private', 'protected',
        'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
        'cout', 'cin', 'endl', 'vector', 'string', 'map', 'set', 'pair', 'auto',
        'const', 'static', 'extern', 'inline', 'virtual', 'override', 'final'
      ],
      syntaxPatterns: [
        /::/g, // Scope resolution
        /->/g, // Pointer access
        /\w+<\w+>/g, // Templates
        /&\w+/g, // References
        /\*\w+/g, // Pointers
        /\w+\[\w*\]/g, // Arrays
        /#\w+/g // Preprocessor directives
      ],
      fileExtensions: ['cpp', 'cc', 'cxx', 'c++', 'h', 'hpp', 'hxx'],
      uniqueFeatures: [
        /#include\s*<[^>]+>/gi,
        /std::/gi,
        /cout\s*<</gi,
        /cin\s*>>/gi,
        /endl/gi,
        /vector<\w+>/gi,
        /string/gi,
        /nullptr/gi,
        /delete\s+/gi,
        /new\s+\w+/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm,
        /\/\*[\s\S]*?\*\//g
      ],
      stringPatterns: [
        /"[^"]*"/g,
        /'[^']*'/g
      ],
      importPatterns: [
        /#include\s*[<"][^>"]+[>"]/gi,
        /using\s+namespace\s+\w+/gi
      ],
      functionPatterns: [
        /\w+\s+\w+\s*\([^)]*\)\s*\{/gi,
        /\w+\s*::\s*\w+\s*\(/gi
      ],
      variablePatterns: [
        /(?:int|char|float|double|bool|auto)\s+\w+/gi
      ],
      classPatterns: [
        /class\s+\w+/gi,
        /struct\s+\w+/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.4,
        unique: 2.0,
        structure: 1.3
      }
    },

    csharp: {
      keywords: [
        'using', 'namespace', 'class', 'interface', 'struct', 'enum', 'delegate',
        'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const',
        'var', 'string', 'int', 'long', 'double', 'float', 'bool', 'char', 'byte',
        'void', 'object', 'return', 'if', 'else', 'for', 'while', 'foreach', 'in',
        'try', 'catch', 'finally', 'throw', 'new', 'this', 'base', 'override',
        'virtual', 'abstract', 'sealed', 'partial', 'async', 'await', 'yield'
      ],
      syntaxPatterns: [
        /\w+<\w+>/g, // Generics
        /@\w+/g, // Attributes
        /\?\w+/g, // Nullable types
        /=>/g, // Lambda expressions
        /\w+\?\./g, // Null conditional
        /\$"[^"]*\{[^}]+\}[^"]*"/g, // String interpolation
        /\w+\[\]/g // Arrays
      ],
      fileExtensions: ['cs', 'csx'],
      uniqueFeatures: [
        /Console\.WriteLine/gi,
        /Console\.Write/gi,
        /Console\.ReadLine/gi,
        /string\.Empty/gi,
        /\.ToString\(\)/gi,
        /\.Length/gi,
        /\.Count/gi,
        /List<\w+>/gi,
        /Dictionary<\w+,\s*\w+>/gi,
        /var\s+\w+\s*=/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm,
        /\/\*[\s\S]*?\*\//g,
        /\/\/\/.*$/gm // XML documentation
      ],
      stringPatterns: [
        /"[^"]*"/g,
        /'[^']*'/g,
        /@"[^"]*"/g, // Verbatim strings
        /\$"[^"]*"/g // Interpolated strings
      ],
      importPatterns: [
        /using\s+[\w.]+;/gi,
        /using\s+\w+\s*=\s*[\w.]+;/gi
      ],
      functionPatterns: [
        /(?:public|private|protected|internal)?\s*(?:static)?\s*\w+\s+\w+\s*\(/gi
      ],
      variablePatterns: [
        /(?:public|private|protected|internal)?\s*(?:static)?\s*(?:readonly)?\s*\w+\s+\w+/gi,
        /var\s+\w+/gi
      ],
      classPatterns: [
        /(?:public|private|protected|internal)?\s*(?:abstract|sealed|partial)?\s*class\s+\w+/gi,
        /(?:public|private|protected|internal)?\s*interface\s+\w+/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.3,
        unique: 2.0,
        structure: 1.4
      }
    },

    go: {
      keywords: [
        'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
        'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default',
        'go', 'defer', 'chan', 'select', 'map', 'slice', 'string', 'int', 'int64',
        'float64', 'bool', 'byte', 'rune', 'error', 'nil', 'make', 'new', 'len', 'cap'
      ],
      syntaxPatterns: [
        /:=/g, // Short variable declaration
        /<-/g, // Channel operations
        /\.\.\./g, // Variadic
        /\w+\.\w+/g, // Package.Function
        /make\(/g, // Make function
        /len\(/g, // Length function
        /range\s+\w+/g // Range loops
      ],
      fileExtensions: ['go'],
      uniqueFeatures: [
        /fmt\.Println/gi,
        /fmt\.Printf/gi,
        /fmt\.Sprintf/gi,
        /package\s+main/gi,
        /func\s+main\(\)/gi,
        /make\(/gi,
        /len\(/gi,
        /cap\(/gi,
        /append\(/gi,
        /go\s+\w+\(/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm,
        /\/\*[\s\S]*?\*\//g
      ],
      stringPatterns: [
        /"[^"]*"/g,
        /'[^']*'/g,
        /`[^`]*`/g // Raw strings
      ],
      importPatterns: [
        /import\s+"[^"]+"/gi,
        /import\s+\(\s*[\s\S]*?\s*\)/gi
      ],
      functionPatterns: [
        /func\s+\w+\s*\(/gi,
        /func\s*\([^)]*\)\s*\w+\s*\(/gi // Method receivers
      ],
      variablePatterns: [
        /var\s+\w+/gi,
        /\w+\s*:=/gi
      ],
      classPatterns: [
        /type\s+\w+\s+struct/gi,
        /type\s+\w+\s+interface/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.6,
        unique: 2.0,
        structure: 1.2
      }
    },

    rust: {
      keywords: [
        'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait',
        'use', 'mod', 'pub', 'crate', 'super', 'self', 'return', 'if', 'else',
        'match', 'for', 'while', 'loop', 'break', 'continue', 'where', 'as',
        'Some', 'None', 'Ok', 'Err', 'Result', 'Option', 'Vec', 'String', 'str',
        'i32', 'i64', 'u32', 'u64', 'f32', 'f64', 'bool', 'char', 'usize', 'isize'
      ],
      syntaxPatterns: [
        /&\w+/g, // References
        /&mut\s+\w+/g, // Mutable references
        /::\w+/g, // Path separator
        /\|[^|]*\|/g, // Closures
        /->/g, // Return type
        /\w+!/g, // Macros
        /<\w+>/g, // Generics
        /\w+\?\./g // Optional chaining
      ],
      fileExtensions: ['rs'],
      uniqueFeatures: [
        /println!/gi,
        /print!/gi,
        /vec!/gi,
        /format!/gi,
        /panic!/gi,
        /assert!/gi,
        /Some\(/gi,
        /None/gi,
        /Ok\(/gi,
        /Err\(/gi,
        /\.unwrap\(\)/gi,
        /\.expect\(/gi
      ],
      commentPatterns: [
        /\/\/.*$/gm,
        /\/\*[\s\S]*?\*\//g,
        /\/\/\/.*$/gm, // Documentation comments
        /\/\*![\s\S]*?\*\//g
      ],
      stringPatterns: [
        /"[^"]*"/g,
        /'[^']*'/g,
        /r"[^"]*"/g, // Raw strings
        /r#"[^"]*"#/g
      ],
      importPatterns: [
        /use\s+[\w:]+/gi,
        /extern\s+crate\s+\w+/gi
      ],
      functionPatterns: [
        /fn\s+\w+\s*\(/gi,
        /impl\s+\w+/gi
      ],
      variablePatterns: [
        /let\s+(?:mut\s+)?\w+/gi,
        /const\s+\w+/gi,
        /static\s+\w+/gi
      ],
      classPatterns: [
        /struct\s+\w+/gi,
        /enum\s+\w+/gi,
        /trait\s+\w+/gi
      ],
      weightMultipliers: {
        keywords: 1.0,
        syntax: 1.7,
        unique: 2.0,
        structure: 1.3
      }
    }
  };

  /**
   * Detect programming language with enhanced algorithms
   */
  detectLanguage(content: string): LanguageDetectionResult {
    if (!content || content.trim().length === 0) {
      return {
        language: 'unknown',
        confidence: 0,
        matchedFeatures: {
          keywords: [],
          syntaxPatterns: [],
          uniqueFeatures: [],
          structuralElements: []
        },
        alternativeLanguages: []
      };
    }

    const results: Array<{
      language: string;
      score: number;
      matchedFeatures: {
        keywords: string[];
        syntaxPatterns: string[];
        uniqueFeatures: string[];
        structuralElements: string[];
      };
    }> = [];

    // Analyze each language
    for (const [language, signature] of Object.entries(this.languageSignatures)) {
      const analysis = this.analyzeLanguageMatch(content, signature);
      const score = this.calculateLanguageScore(analysis, signature);
      
      results.push({
        language,
        score,
        matchedFeatures: analysis
      });
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    const bestMatch = results[0];
    const confidence = this.normalizeConfidence(bestMatch.score, content.length);

    return {
      language: confidence > 0.3 ? bestMatch.language : 'unknown',
      confidence,
      matchedFeatures: bestMatch.matchedFeatures,
      alternativeLanguages: results.slice(1, 4).map(r => ({
        language: r.language,
        confidence: this.normalizeConfidence(r.score, content.length)
      }))
    };
  }

  /**
   * Analyze how well content matches a language signature
   */
  private analyzeLanguageMatch(content: string, signature: LanguageSignature) {
    const contentLower = content.toLowerCase();
    const matchedFeatures = {
      keywords: [] as string[],
      syntaxPatterns: [] as string[],
      uniqueFeatures: [] as string[],
      structuralElements: [] as string[]
    };

    // Check keywords
    for (const keyword of signature.keywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchedFeatures.keywords.push(keyword);
      }
    }

    // Check syntax patterns
    for (const pattern of signature.syntaxPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matchedFeatures.syntaxPatterns.push(...matches.slice(0, 3));
      }
    }

    // Check unique features
    for (const pattern of signature.uniqueFeatures) {
      const matches = content.match(pattern);
      if (matches) {
        matchedFeatures.uniqueFeatures.push(...matches.slice(0, 2));
      }
    }

    // Check structural elements
    const structuralPatterns = [
      ...signature.functionPatterns,
      ...signature.classPatterns,
      ...signature.importPatterns
    ];

    for (const pattern of structuralPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matchedFeatures.structuralElements.push(...matches.slice(0, 2));
      }
    }

    return matchedFeatures;
  }

  /**
   * Calculate weighted score for language match
   */
  private calculateLanguageScore(
    matchedFeatures: {
      keywords: string[];
      syntaxPatterns: string[];
      uniqueFeatures: string[];
      structuralElements: string[];
    },
    signature: LanguageSignature
  ): number {
    const weights = signature.weightMultipliers;
    
    const keywordScore = matchedFeatures.keywords.length * weights.keywords;
    const syntaxScore = matchedFeatures.syntaxPatterns.length * weights.syntax;
    const uniqueScore = matchedFeatures.uniqueFeatures.length * weights.unique;
    const structuralScore = matchedFeatures.structuralElements.length * weights.structure;

    return keywordScore + syntaxScore + uniqueScore + structuralScore;
  }

  /**
   * Normalize score to confidence (0-1)
   */
  private normalizeConfidence(score: number, contentLength: number): number {
    // Adjust score based on content length
    const lengthFactor = Math.min(contentLength / 200, 1);
    const adjustedScore = score * lengthFactor;
    
    // Normalize to 0-1 range
    const maxPossibleScore = 50; // Estimated maximum score
    return Math.min(adjustedScore / maxPossibleScore, 1);
  }

  /**
   * Get context clues for better detection
   */
  getContextClues(content: string): {
    hasImports: boolean;
    hasFunctions: boolean;
    hasClasses: boolean;
    hasComments: boolean;
    indentationStyle: 'spaces' | 'tabs' | 'mixed' | 'none';
    averageLineLength: number;
    codeComplexity: 'low' | 'medium' | 'high';
  } {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Check for imports
    const hasImports = /(?:import|#include|using|from|require)\s/gi.test(content);
    
    // Check for functions
    const hasFunctions = /(?:function|def|func|fn)\s+\w+/gi.test(content);
    
    // Check for classes
    const hasClasses = /(?:class|struct|interface)\s+\w+/gi.test(content);
    
    // Check for comments
    const hasComments = /(?:\/\/|#|\/\*|\*\/|"""|''')/g.test(content);
    
    // Analyze indentation
    let spaceIndents = 0;
    let tabIndents = 0;
    
    for (const line of lines) {
      if (line.startsWith('    ')) spaceIndents++;
      if (line.startsWith('\t')) tabIndents++;
    }
    
    let indentationStyle: 'spaces' | 'tabs' | 'mixed' | 'none';
    if (spaceIndents > 0 && tabIndents > 0) {
      indentationStyle = 'mixed';
    } else if (spaceIndents > tabIndents) {
      indentationStyle = 'spaces';
    } else if (tabIndents > 0) {
      indentationStyle = 'tabs';
    } else {
      indentationStyle = 'none';
    }
    
    // Calculate average line length
    const averageLineLength = nonEmptyLines.length > 0 
      ? nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length
      : 0;
    
    // Estimate code complexity
    const complexityIndicators = [
      /(?:if|for|while|switch|try|catch)/gi,
      /(?:class|function|def|func)/gi,
      /[{}()[\]]/g
    ];
    
    let complexityScore = 0;
    for (const pattern of complexityIndicators) {
      const matches = content.match(pattern);
      if (matches) complexityScore += matches.length;
    }
    
    const codeComplexity = complexityScore > 20 ? 'high' : 
                          complexityScore > 10 ? 'medium' : 'low';
    
    return {
      hasImports,
      hasFunctions,
      hasClasses,
      hasComments,
      indentationStyle,
      averageLineLength,
      codeComplexity
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return Object.keys(this.languageSignatures);
  }

  /**
   * Add custom language signature
   */
  addLanguageSignature(language: string, signature: LanguageSignature): void {
    this.languageSignatures[language] = signature;
  }
}

// Singleton instance
export const languageDetector = new LanguageDetector();