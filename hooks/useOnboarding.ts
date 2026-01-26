"use client";

import { useState, useEffect, useCallback } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  points: number;
  badge?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface OnboardingProgress {
  id: string;
  currentStep: number;
  completedSteps: string[];
  status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  completedAt: string | null;
  skippedAt: string | null;
  stepData: Record<string, unknown>;
  badges: string[];
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingStats {
  totalSteps: number;
  completedCount: number;
  completionPercentage: number;
  maxPoints: number;
  currentPoints: number;
}

interface OnboardingData {
  onboarding: OnboardingProgress;
  steps: OnboardingStep[];
  badges: Record<string, Badge>;
  stats: OnboardingStats;
}

interface UpdateResult {
  onboarding: OnboardingProgress;
  newBadges: string[];
  pointsEarned: number;
}

export function useOnboarding() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch onboarding data
  const fetchOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/onboarding");

      if (!response.ok) {
        throw new Error("Erro ao carregar onboarding");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update progress
  const updateProgress = useCallback(
    async (updates: {
      currentStep?: number;
      completedSteps?: string[];
      stepData?: Record<string, unknown>;
    }): Promise<UpdateResult | null> => {
      try {
        const response = await fetch("/api/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar progresso");
        }

        const result: UpdateResult = await response.json();

        // Update local state
        setData((prev) =>
          prev
            ? {
                ...prev,
                onboarding: result.onboarding,
                stats: {
                  ...prev.stats,
                  completedCount: result.onboarding.completedSteps.length,
                  completionPercentage: Math.round(
                    (result.onboarding.completedSteps.length / prev.stats.totalSteps) * 100
                  ),
                  currentPoints: result.onboarding.totalPoints,
                },
              }
            : null
        );

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        return null;
      }
    },
    []
  );

  // Complete a step
  const completeStep = useCallback(
    async (stepId: string, stepData?: Record<string, unknown>) => {
      if (!data) return null;

      const newCompletedSteps = [...data.onboarding.completedSteps];
      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId);
      }

      const currentIndex = data.steps.findIndex((s) => s.id === stepId);
      const nextStep = Math.min(currentIndex + 1, data.steps.length - 1);

      return updateProgress({
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
        stepData: stepData ? { [stepId]: stepData } : undefined,
      });
    },
    [data, updateProgress]
  );

  // Go to specific step
  const goToStep = useCallback(
    async (stepIndex: number) => {
      return updateProgress({ currentStep: stepIndex });
    },
    [updateProgress]
  );

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    try {
      const response = await fetch("/api/onboarding/skip", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erro ao pular onboarding");
      }

      const result = await response.json();

      // Update local state
      setData((prev) =>
        prev
          ? {
              ...prev,
              onboarding: result.onboarding,
            }
          : null
      );

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      return null;
    }
  }, []);

  // Check if step is completed
  const isStepCompleted = useCallback(
    (stepId: string) => {
      return data?.onboarding.completedSteps.includes(stepId) ?? false;
    },
    [data]
  );

  // Check if user has badge
  const hasBadge = useCallback(
    (badgeId: string) => {
      return data?.onboarding.badges.includes(badgeId) ?? false;
    },
    [data]
  );

  // Get earned badges with details
  const earnedBadges = data
    ? data.onboarding.badges
        .map((id) => data.badges[id])
        .filter(Boolean)
    : [];

  // Get current step details
  const currentStep = data
    ? data.steps[data.onboarding.currentStep]
    : null;

  // Check if onboarding is complete or skipped
  const isComplete = data?.onboarding.status === "COMPLETED";
  const isSkipped = data?.onboarding.status === "SKIPPED";
  const shouldShowOnboarding =
    data?.onboarding.status === "IN_PROGRESS" &&
    data.onboarding.completedSteps.length < data.stats.totalSteps;

  // Initial fetch
  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  return {
    // Data
    data,
    steps: data?.steps ?? [],
    badges: data?.badges ?? {},
    stats: data?.stats,
    onboarding: data?.onboarding,

    // State
    isLoading,
    error,
    isComplete,
    isSkipped,
    shouldShowOnboarding,
    currentStep,
    earnedBadges,

    // Actions
    fetchOnboarding,
    updateProgress,
    completeStep,
    goToStep,
    skipOnboarding,
    isStepCompleted,
    hasBadge,
  };
}
