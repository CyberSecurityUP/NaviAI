'use client';

import { useMemo } from 'react';

interface StepByStepProps {
  content: string;
}

interface ParsedStep {
  number: number;
  text: string;
}

function parseSteps(content: string): ParsedStep[] {
  const lines = content.split('\n');
  const steps: ParsedStep[] = [];
  let currentStep: ParsedStep | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match "Passo X:" or "Passo X -" patterns (Portuguese)
    const passoMatch = trimmed.match(/^Passo\s+(\d+)\s*[:\-]\s*(.*)/i);
    // Match "Step X:" or "Step X -" patterns (English)
    const stepMatch = trimmed.match(/^Step\s+(\d+)\s*[:\-]\s*(.*)/i);
    // Match numbered lists: "1." or "1)" or "1 -"
    const numberedMatch = trimmed.match(/^(\d+)\s*[.):\-]\s*(.*)/);

    const match = passoMatch || stepMatch || numberedMatch;

    if (match) {
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        number: parseInt(match[1], 10),
        text: match[2],
      };
    } else if (currentStep) {
      // Continuation of the current step
      currentStep.text += ' ' + trimmed;
    }
  }

  if (currentStep) {
    steps.push(currentStep);
  }

  // If no steps were parsed, treat the entire content as a single step
  if (steps.length === 0) {
    steps.push({ number: 1, text: content });
  }

  return steps;
}

export function StepByStep({ content }: StepByStepProps) {
  const steps = useMemo(() => parseSteps(content), [content]);

  return (
    <div className="flex flex-col gap-4">
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex gap-4 items-start bg-navi-surface rounded-navi p-4 border border-navi-surface-hover"
        >
          {/* Step number badge */}
          <div
            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full
                        bg-navi-primary text-white flex items-center justify-center
                        text-navi-xl font-bold"
            aria-hidden="true"
          >
            {step.number}
          </div>

          {/* Step content */}
          <p className="flex-1 text-navi-lg text-navi-text leading-relaxed pt-1">
            {step.text}
          </p>
        </div>
      ))}
    </div>
  );
}
