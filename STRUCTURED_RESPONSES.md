# Structured Interview JSON Responses

This application can parse and render rich, interview‑style structured answers returned as a single JSON object. Use the provided system prompt (auto‑filled by default) to instruct the model to follow the contract.

## Envelope Shape
Top level fields:
version, responseId, responseType (theoretical|coding|mcq), questionEcho, interviewTone, meta{confidence,difficulty,tags[]}, answer (variant), followUps[].

## Answer Variants (Required Keys)
theoretical: summary, detailed, keyPoints[], pitfalls[]
coding: solutionOverview, approachSteps[], timeComplexity, spaceComplexity, constraints{inputSizes,valueRanges?,edgeCases[],assumptions[]}, variants?, code{language,style,main,helperSnippets?[]}, tests?[], explanationNotes?[]
mcq: question, options[{id,text}], correctOptionId, justification, eliminations?[], quickRecallHook?

See `src/types/structured.schema.json` for machine validation.

## Parsing Strategy
1. Collect full streamed text.
2. Trim; attempt direct JSON.parse if it starts with '{' and ends with '}'.
3. If fenced (```json ... ```), extract inner block.
4. Otherwise, locate largest balanced braces span and attempt parse.
5. On success, normalize (coerce interviewTone boolean, clean complexity labels, flatten tests).
6. Store parsed object on `ChatMessage.structured` while keeping raw JSON in `content` for debug.
7. On failure, fall back to legacy markdown rendering.

## Rendering Summary
Theoretical: summary (bold), detailed paragraphs, key points & pitfalls lists.
Coding: overview + ordered steps, constraint chips/table, complexity chips, variants list, code block with copy button, tests, notes.
MCQ: question, options with correct highlighted, justification, eliminations, mnemonic.

## TypeScript Interfaces
Defined in `src/types/structured.ts` and exported via `src/types/index.ts`.

## JSON Examples
Located in `src/types/examples/` (coding, theoretical, mcq). Useful for tests or fixtures.

## Future Extension Ideas
- Add rubric scoring for user submitted answers.
- Support follow-up chaining (auto-inject chosen followUp.prompt as next user question).
- Optional diff patch responses for code modification requests.

## Validation
If you want to validate responses at runtime you can import the JSON Schema (`structured.schema.json`) and use a library like Ajv.

## Notes
- The system prompt enforces strict no-markdown JSON output to simplify parsing.
- If the model needs clarification, it still returns a valid "theoretical" responseType asking for specifics, preserving machine readability.

---
Generated: This file documents the structured interview response feature.