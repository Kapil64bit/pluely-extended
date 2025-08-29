// Unit tests for enhanced language detector

import { describe, it, beforeEach, expect } from './test-utils';
import { LanguageDetector } from '../language-detector';

describe('LanguageDetector', () => {
  let detector: LanguageDetector;

  beforeEach(() => {
    detector = new LanguageDetector();
  });

  describe('JavaScript Detection', () => {
    it('should detect modern JavaScript with high confidence', () => {
      const jsCode = `
        const fetchUserData = async (userId) => {
          try {
            const response = await fetch(\`/api/users/\${userId}\`);
            const userData = await response.json();
            return userData;
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            throw error;
          }
        };

        const users = [1, 2, 3].map(id => fetchUserData(id));
        Promise.all(users).then(results => {
          console.log('All users loaded:', results);
        });
      `;

      const result = detector.detectLanguage(jsCode);
      
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('const');
      expect(result.matchedFeatures.keywords).toContain('async');
      expect(result.matchedFeatures.keywords).toContain('await');
      expect(result.matchedFeatures.syntaxPatterns).toContain('=>');
      expect(result.matchedFeatures.uniqueFeatures).toContain('console.error');
    });

    it('should detect React JSX code', () => {
      const reactCode = `
        import React, { useState, useEffect } from 'react';

        const UserProfile = ({ userId }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
            fetchUser(userId).then(userData => {
              setUser(userData);
              setLoading(false);
            });
          }, [userId]);

          if (loading) return <div>Loading...</div>;

          return (
            <div className="user-profile">
              <h1>{user.name}</h1>
              <p>{user.email}</p>
            </div>
          );
        };

        export default UserProfile;
      `;

      const result = detector.detectLanguage(reactCode);
      
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('import'))).toBe(true);
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('export default'))).toBe(true);
    });
  });

  describe('Python Detection', () => {
    it('should detect Python with high confidence', () => {
      const pythonCode = `
        def fibonacci(n):
            """Calculate fibonacci number using dynamic programming."""
            if n <= 1:
                return n
            
            dp = [0] * (n + 1)
            dp[1] = 1
            
            for i in range(2, n + 1):
                dp[i] = dp[i-1] + dp[i-2]
            
            return dp[n]

        class MathUtils:
            @staticmethod
            def is_prime(num):
                if num < 2:
                    return False
                for i in range(2, int(num ** 0.5) + 1):
                    if num % i == 0:
                        return False
                return True

        if __name__ == "__main__":
            print(f"Fibonacci(10): {fibonacci(10)}")
            print(f"Is 17 prime? {MathUtils.is_prime(17)}")
      `;

      const result = detector.detectLanguage(pythonCode);
      
      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('def');
      expect(result.matchedFeatures.keywords).toContain('class');
      expect(result.matchedFeatures.keywords).toContain('if');
      expect(result.matchedFeatures.keywords).toContain('for');
      expect(result.matchedFeatures.uniqueFeatures).toContain('print(');
      expect(result.matchedFeatures.uniqueFeatures).toContain('__main__');
    });

    it('should detect Python with f-strings and decorators', () => {
      const pythonCode = `
        from typing import List, Optional
        import asyncio

        @dataclass
        class User:
            name: str
            email: str
            age: Optional[int] = None

        async def fetch_users() -> List[User]:
            users = []
            for i in range(10):
                user = User(
                    name=f"User {i}",
                    email=f"user{i}@example.com",
                    age=20 + i
                )
                users.append(user)
            return users

        async def main():
            users = await fetch_users()
            for user in users:
                print(f"Name: {user.name}, Email: {user.email}")

        if __name__ == "__main__":
            asyncio.run(main())
      `;

      const result = detector.detectLanguage(pythonCode);
      
      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.syntaxPatterns.some(p => p.includes('@'))).toBe(true);
    });
  });

  describe('Java Detection', () => {
    it('should detect Java with high confidence', () => {
      const javaCode = `
        package com.example.utils;

        import java.util.*;
        import java.util.stream.Collectors;

        public class StringUtils {
            private static final String DEFAULT_DELIMITER = ",";
            
            public static List<String> splitAndTrim(String input, String delimiter) {
                if (input == null || input.isEmpty()) {
                    return new ArrayList<>();
                }
                
                return Arrays.stream(input.split(delimiter))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            }
            
            public static void main(String[] args) {
                String testString = "apple, banana, cherry, date";
                List<String> fruits = splitAndTrim(testString, DEFAULT_DELIMITER);
                
                System.out.println("Fruits: " + fruits);
                fruits.forEach(System.out::println);
            }
        }
      `;

      const result = detector.detectLanguage(javaCode);
      
      expect(result.language).toBe('java');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('public');
      expect(result.matchedFeatures.keywords).toContain('class');
      expect(result.matchedFeatures.keywords).toContain('static');
      expect(result.matchedFeatures.keywords).toContain('String');
      expect(result.matchedFeatures.uniqueFeatures).toContain('System.out.println');
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('public static void main'))).toBe(true);
    });
  });

  describe('C++ Detection', () => {
    it('should detect C++ with high confidence', () => {
      const cppCode = `
        #include <iostream>
        #include <vector>
        #include <algorithm>
        #include <memory>

        using namespace std;

        class Shape {
        public:
            virtual ~Shape() = default;
            virtual double area() const = 0;
            virtual void draw() const = 0;
        };

        class Circle : public Shape {
        private:
            double radius;
            
        public:
            Circle(double r) : radius(r) {}
            
            double area() const override {
                return 3.14159 * radius * radius;
            }
            
            void draw() const override {
                cout << "Drawing circle with radius: " << radius << endl;
            }
        };

        int main() {
            vector<unique_ptr<Shape>> shapes;
            shapes.push_back(make_unique<Circle>(5.0));
            
            for (const auto& shape : shapes) {
                cout << "Area: " << shape->area() << endl;
                shape->draw();
            }
            
            return 0;
        }
      `;

      const result = detector.detectLanguage(cppCode);
      
      expect(result.language).toBe('cpp');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('class');
      expect(result.matchedFeatures.keywords).toContain('public');
      expect(result.matchedFeatures.keywords).toContain('private');
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('#include'))).toBe(true);
      expect(result.matchedFeatures.uniqueFeatures).toContain('std::');
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('cout'))).toBe(true);
    });
  });

  describe('Go Detection', () => {
    it('should detect Go with high confidence', () => {
      const goCode = `
        package main

        import (
            "fmt"
            "net/http"
            "encoding/json"
            "log"
        )

        type User struct {
            ID    int    \`json:"id"\`
            Name  string \`json:"name"\`
            Email string \`json:"email"\`
        }

        func getUserHandler(w http.ResponseWriter, r *http.Request) {
            user := User{
                ID:    1,
                Name:  "John Doe",
                Email: "john@example.com",
            }
            
            w.Header().Set("Content-Type", "application/json")
            if err := json.NewEncoder(w).Encode(user); err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
                return
            }
        }

        func main() {
            http.HandleFunc("/user", getUserHandler)
            fmt.Println("Server starting on :8080")
            log.Fatal(http.ListenAndServe(":8080", nil))
        }
      `;

      const result = detector.detectLanguage(goCode);
      
      expect(result.language).toBe('go');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('package');
      expect(result.matchedFeatures.keywords).toContain('func');
      expect(result.matchedFeatures.keywords).toContain('struct');
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('package main'))).toBe(true);
      expect(result.matchedFeatures.uniqueFeatures.some(f => f.includes('fmt.Println'))).toBe(true);
      expect(result.matchedFeatures.syntaxPatterns).toContain(':=');
    });
  });

  describe('Rust Detection', () => {
    it('should detect Rust with high confidence', () => {
      const rustCode = `
        use std::collections::HashMap;
        use std::io::{self, Write};

        #[derive(Debug, Clone)]
        struct Person {
            name: String,
            age: u32,
            email: Option<String>,
        }

        impl Person {
            fn new(name: String, age: u32) -> Self {
                Person {
                    name,
                    age,
                    email: None,
                }
            }
            
            fn set_email(&mut self, email: String) {
                self.email = Some(email);
            }
            
            fn greet(&self) -> String {
                match &self.email {
                    Some(email) => format!("Hello, I'm {} ({}) - {}", self.name, self.age, email),
                    None => format!("Hello, I'm {} ({})", self.name, self.age),
                }
            }
        }

        fn main() -> Result<(), Box<dyn std::error::Error>> {
            let mut people: HashMap<u32, Person> = HashMap::new();
            
            let mut person = Person::new("Alice".to_string(), 30);
            person.set_email("alice@example.com".to_string());
            
            people.insert(1, person);
            
            for (id, person) in &people {
                println!("ID {}: {}", id, person.greet());
            }
            
            Ok(())
        }
      `;

      const result = detector.detectLanguage(rustCode);
      
      expect(result.language).toBe('rust');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedFeatures.keywords).toContain('fn');
      expect(result.matchedFeatures.keywords).toContain('struct');
      expect(result.matchedFeatures.keywords).toContain('impl');
      expect(result.matchedFeatures.keywords).toContain('match');
      expect(result.matchedFeatures.uniqueFeatures).toContain('println!');
      expect(result.matchedFeatures.uniqueFeatures).toContain('Some(');
      expect(result.matchedFeatures.uniqueFeatures).toContain('None');
    });
  });

  describe('Context Clues Analysis', () => {
    it('should analyze context clues correctly', () => {
      const code = `
        import React from 'react';
        
        // This is a comment
        function MyComponent() {
          return <div>Hello World</div>;
        }
        
        class MyClass {
          constructor() {
            this.value = 42;
          }
        }
      `;

      const contextClues = detector.getContextClues(code);
      
      expect(contextClues.hasImports).toBe(true);
      expect(contextClues.hasFunctions).toBe(true);
      expect(contextClues.hasClasses).toBe(true);
      expect(contextClues.hasComments).toBe(true);
      expect(contextClues.codeComplexity).toBe('low');
    });

    it('should detect indentation style', () => {
      const spacesCode = `
function test() {
    if (true) {
        console.log('spaces');
    }
}`;

      const tabsCode = `
function test() {
\tif (true) {
\t\tconsole.log('tabs');
\t}
}`;

      const spacesClues = detector.getContextClues(spacesCode);
      const tabsClues = detector.getContextClues(tabsCode);
      
      expect(spacesClues.indentationStyle).toBe('spaces');
      expect(tabsClues.indentationStyle).toBe('tabs');
    });
  });

  describe('Alternative Languages', () => {
    it('should provide alternative language suggestions', () => {
      const ambiguousCode = `
        class Test {
          public void method() {
            System.out.println("Hello");
          }
        }
      `;

      const result = detector.detectLanguage(ambiguousCode);
      
      expect(result.alternativeLanguages).toBeDefined();
      expect(result.alternativeLanguages.length).toBeGreaterThan(0);
      expect(result.alternativeLanguages[0]).toHaveProperty('language');
      expect(result.alternativeLanguages[0]).toHaveProperty('confidence');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = detector.detectLanguage('');
      
      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.matchedFeatures.keywords).toEqual([]);
    });

    it('should handle non-code text', () => {
      const text = `
        This is just regular text about programming concepts.
        It mentions functions and classes but contains no actual code.
        There are no syntax patterns or programming constructs here.
      `;

      const result = detector.detectLanguage(text);
      
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should handle mixed content', () => {
      const mixedContent = `
        Here's some explanation about the following JavaScript code:
        
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        This function calculates fibonacci numbers recursively.
      `;

      const result = detector.detectLanguage(mixedContent);
      
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0.4);
    });
  });

  describe('Language Support', () => {
    it('should return list of supported languages', () => {
      const languages = detector.getSupportedLanguages();
      
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('java');
      expect(languages).toContain('cpp');
      expect(languages).toContain('csharp');
      expect(languages).toContain('go');
      expect(languages).toContain('rust');
      expect(languages.length).toBeGreaterThanOrEqual(7);
    });
  });
});