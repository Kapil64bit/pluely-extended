// Enhanced response renderer for different response modes
// Handles rendering of responses from the enhanced pipeline

import React from "react";
import {
  ResponseMode,
  EnhancedResponse,
  MCQResponse,
  CodingResponse,
  VerbalInterviewResponse,
  TheoreticalResponse,
} from "@/types/enhanced-response";
import { Button } from "@/components/ui/button";
import {
  CopyIcon,
  CheckIcon,
  BookOpenIcon,
  CodeIcon,
  MessageCircleIcon,
  BrainIcon,
} from "lucide-react";
import { highlightCode } from "@/lib/highlight";
import { useState, useEffect } from "react";

interface EnhancedResponseRendererProps {
  response: EnhancedResponse;
  onCopy?: (content: string, type: string) => void;
  showMetadata?: boolean;
}

export const EnhancedResponseRenderer: React.FC<
  EnhancedResponseRendererProps
> = ({ response, onCopy, showMetadata = false }) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = (
    content: string,
    type: string = "text",
    key: string = "default"
  ) => {
    navigator.clipboard.writeText(content);
    onCopy?.(content, type);

    // Show copied state
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const getModeIcon = (mode: ResponseMode) => {
    switch (mode) {
      case ResponseMode.MCQ:
        return <BookOpenIcon className="h-4 w-4" />;
      case ResponseMode.CODING:
        return <CodeIcon className="h-4 w-4" />;
      case ResponseMode.VERBAL_INTERVIEW:
        return <MessageCircleIcon className="h-4 w-4" />;
      case ResponseMode.THEORETICAL:
        return <BrainIcon className="h-4 w-4" />;
      default:
        return <BrainIcon className="h-4 w-4" />;
    }
  };

  const getModeColor = (mode: ResponseMode) => {
    switch (mode) {
      case ResponseMode.MCQ:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case ResponseMode.CODING:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case ResponseMode.VERBAL_INTERVIEW:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case ResponseMode.THEORETICAL:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const renderModeIndicator = () => (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getModeColor(
          response.mode
        )}`}
      >
        {getModeIcon(response.mode)}
        <span>{response.mode.replace("_", " ").toUpperCase()}</span>
      </div>
      {response.confidence && (
        <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {Math.round(response.confidence * 100)}% confidence
        </div>
      )}
    </div>
  );
  const renderMCQResponse = (mcq: MCQResponse) => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Question
        </h3>
        <p className="text-blue-800 dark:text-blue-200">{mcq.question}</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Options:</h4>
        {mcq.options.map((option, index) => (
          <div
            key={option.id}
            className={`p-3 rounded-lg border ${
              option.label === mcq.correctAnswer
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`font-semibold ${
                  option.label === mcq.correctAnswer
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {option.label})
              </span>
              <span
                className={
                  option.label === mcq.correctAnswer
                    ? "text-green-800 dark:text-green-200"
                    : "text-gray-700 dark:text-gray-300"
                }
              >
                {option.text}
              </span>
              {option.label === mcq.correctAnswer && (
                <CheckIcon className="h-4 w-4 text-green-600 ml-auto" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          Explanation
        </h4>
        <p className="text-green-800 dark:text-green-200">{mcq.explanation}</p>
      </div>

      {mcq.eliminationStrategy && mcq.eliminationStrategy.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Elimination Strategy
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {mcq.eliminationStrategy.map((strategy, index) => (
              <li key={index} className="text-yellow-800 dark:text-yellow-200">
                {strategy}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopy(mcq.question, "question", "mcq-question")}
          className="flex items-center gap-1"
        >
          {copiedStates["mcq-question"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Question
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleCopy(mcq.explanation, "explanation", "mcq-explanation")
          }
          className="flex items-center gap-1"
        >
          {copiedStates["mcq-explanation"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Explanation
        </Button>
      </div>
    </div>
  );

  const CodeBlock = ({
    code,
    language,
  }: {
    code: string;
    language: string;
  }) => {
    const [html, setHtml] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const highlighted = await highlightCode(
            code,
            language || "plaintext"
          );
          if (mounted) setHtml(highlighted);
        } catch (e) {
          if (mounted) setHtml(null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [code, language]);

    return (
      <div className="relative">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="rounded-md overflow-auto bg-slate-900/90 text-slate-100 p-4 font-mono text-sm">
            <code>{code}</code>
          </pre>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopy(code, "code", `code-${language}`)}
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          {copiedStates[`code-${language}`] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  };

  const renderCodingResponse = (coding: CodingResponse) => (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          Problem Statement
        </h3>
        <p className="text-green-800 dark:text-green-200">
          {coding.problemStatement}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">
          Solution ({coding.solution.language})
        </h4>
        <CodeBlock
          code={coding.solution.main}
          language={coding.solution.language}
        />

        {coding.solution.helperSnippets &&
          coding.solution.helperSnippets.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Helper Functions:</h5>
              {coding.solution.helperSnippets.map((snippet, index) => (
                <CodeBlock
                  key={index}
                  code={snippet}
                  language={coding.solution.language}
                />
              ))}
            </div>
          )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Explanation
        </h4>
        <p className="text-blue-800 dark:text-blue-200">{coding.explanation}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <h5 className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">
            Time Complexity
          </h5>
          <p className="text-purple-800 dark:text-purple-200 font-mono">
            {coding.timeComplexity}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <h5 className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">
            Space Complexity
          </h5>
          <p className="text-purple-800 dark:text-purple-200 font-mono">
            {coding.spaceComplexity}
          </p>
        </div>
      </div>

      {coding.testCases && coding.testCases.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Test Cases
          </h4>
          <div className="space-y-2">
            {coding.testCases.map((testCase, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-3 rounded border"
              >
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {testCase.description}
                  </div>
                  <div className="mt-1 font-mono text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      Input:
                    </span>{" "}
                    {JSON.stringify(testCase.input)}
                  </div>
                  <div className="font-mono text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      Expected:
                    </span>{" "}
                    {JSON.stringify(testCase.expected)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coding.alternativeApproaches &&
        coding.alternativeApproaches.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Alternative Approaches
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {coding.alternativeApproaches.map((approach, index) => (
                <li
                  key={index}
                  className="text-yellow-800 dark:text-yellow-200"
                >
                  {approach}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );

  const renderInterviewResponse = (interview: VerbalInterviewResponse) => (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
          Interview Question
        </h3>
        <p className="text-purple-800 dark:text-purple-200">
          {interview.question}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
            Your Response
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                interview.tone === "confident"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : interview.tone === "thoughtful"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              }`}
            >
              {interview.tone}
            </span>
            {interview.duration && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                ~{interview.duration}
              </span>
            )}
          </div>
        </div>
        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
          {interview.answer}
        </p>
      </div>

      {interview.keyPoints && interview.keyPoints.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            Key Points to Emphasize
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {interview.keyPoints.map((point, index) => (
              <li key={index} className="text-green-800 dark:text-green-200">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {interview.followUpPreparation &&
        interview.followUpPreparation.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Follow-up Preparation
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {interview.followUpPreparation.map((prep, index) => (
                <li
                  key={index}
                  className="text-yellow-800 dark:text-yellow-200"
                >
                  {prep}
                </li>
              ))}
            </ul>
          </div>
        )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleCopy(interview.answer, "answer", "interview-answer")
          }
          className="flex items-center gap-1"
        >
          {copiedStates["interview-answer"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Response
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleCopy(
              interview.keyPoints.join("\n• "),
              "keypoints",
              "interview-keypoints"
            )
          }
          className="flex items-center gap-1"
        >
          {copiedStates["interview-keypoints"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Key Points
        </Button>
      </div>
    </div>
  );

  const renderTheoreticalResponse = (theoretical: TheoreticalResponse) => (
    <div className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
          {theoretical.topic}
        </h3>
        <p className="text-orange-800 dark:text-orange-200 font-medium">
          {theoretical.summary}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Detailed Explanation
        </h4>
        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
          {theoretical.detailedExplanation}
        </p>
      </div>

      {theoretical.keyPoints && theoretical.keyPoints.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            Key Points
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {theoretical.keyPoints.map((point, index) => (
              <li key={index} className="text-green-800 dark:text-green-200">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {theoretical.commonMistakes && theoretical.commonMistakes.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
            Common Mistakes
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {theoretical.commonMistakes.map((mistake, index) => (
              <li key={index} className="text-red-800 dark:text-red-200">
                {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}

      {theoretical.pitfalls && theoretical.pitfalls.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Pitfalls to Avoid
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {theoretical.pitfalls.map((pitfall, index) => (
              <li key={index} className="text-yellow-800 dark:text-yellow-200">
                {pitfall}
              </li>
            ))}
          </ul>
        </div>
      )}

      {theoretical.relatedConcepts &&
        theoretical.relatedConcepts.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Related Concepts
            </h4>
            <div className="flex flex-wrap gap-2">
              {theoretical.relatedConcepts.map((concept, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleCopy(
              theoretical.detailedExplanation,
              "explanation",
              "theoretical-explanation"
            )
          }
          className="flex items-center gap-1"
        >
          {copiedStates["theoretical-explanation"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Explanation
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleCopy(
              theoretical.keyPoints.join("\n• "),
              "keypoints",
              "theoretical-keypoints"
            )
          }
          className="flex items-center gap-1"
        >
          {copiedStates["theoretical-keypoints"] ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          Copy Key Points
        </Button>
      </div>
    </div>
  );

  const renderMetadata = () => {
    if (!showMetadata || !response.metadata) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">
          Response Metadata
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Generation Time:
            </span>
            <span className="ml-1 font-mono">
              {response.metadata.generationTime}ms
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Quality Score:
            </span>
            <span className="ml-1 font-mono">
              {Math.round(response.metadata.qualityScore * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Model:</span>
            <span className="ml-1 font-mono">{response.metadata.model}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Provider:</span>
            <span className="ml-1 font-mono">{response.metadata.provider}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (response.mode) {
      case ResponseMode.MCQ:
        return renderMCQResponse(response.content as MCQResponse);
      case ResponseMode.CODING:
        return renderCodingResponse(response.content as CodingResponse);
      case ResponseMode.VERBAL_INTERVIEW:
        return renderInterviewResponse(
          response.content as VerbalInterviewResponse
        );
      case ResponseMode.THEORETICAL:
        return renderTheoreticalResponse(
          response.content as TheoreticalResponse
        );
      default:
        return (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              Unsupported response mode: {response.mode}
            </p>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(response.content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="enhanced-response-renderer">
      {renderModeIndicator()}
      {renderContent()}
      {renderMetadata()}
    </div>
  );
};
