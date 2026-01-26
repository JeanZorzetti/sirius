"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Building2,
  GitBranch,
  UserPlus,
  Handshake,
  Check,
  ChevronRight,
  Trophy,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";

const STEP_ICONS = {
  welcome: Sparkles,
  organization: Building2,
  pipeline: GitBranch,
  first_contact: UserPlus,
  first_deal: Handshake,
} as const;

interface OnboardingChecklistProps {
  onOpenWizard?: () => void;
  dismissible?: boolean;
}

export function OnboardingChecklist({
  onOpenWizard,
  dismissible = true,
}: OnboardingChecklistProps) {
  const {
    steps,
    stats,
    onboarding,
    isLoading,
    isComplete,
    isSkipped,
    skipOnboarding,
    isStepCompleted,
  } = useOnboarding();

  const [dismissed, setDismissed] = useState(false);

  if (isLoading || isComplete || isSkipped || dismissed) {
    return null;
  }

  const completedCount = stats?.completedCount ?? 0;
  const totalSteps = stats?.totalSteps ?? 5;
  const percentage = stats?.completionPercentage ?? 0;

  // Find first incomplete step
  const firstIncompleteStep = steps.find(
    (step) => !isStepCompleted(step.id)
  );

  return (
    <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={() => {
            skipOnboarding();
            setDismissed(true);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Configure sua conta</CardTitle>
            <CardDescription className="text-xs">
              {completedCount}/{totalSteps} passos • {stats?.currentPoints ?? 0} pontos
            </CardDescription>
          </div>
          {percentage > 0 && (
            <Badge variant="secondary" className="text-xs">
              {percentage}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {steps.map((step) => {
          const completed = isStepCompleted(step.id);
          const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] || Sparkles;

          return (
            <div
              key={step.id}
              className={`
                flex items-center gap-3 p-2 rounded-lg transition-colors
                ${completed ? "opacity-60" : "hover:bg-muted/50 cursor-pointer"}
              `}
              onClick={() => !completed && onOpenWizard?.()}
            >
              <div
                className={`
                flex h-8 w-8 items-center justify-center rounded-full
                ${
                  completed
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground"
                }
              `}
              >
                {completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {!completed && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-500" />
                  +{step.points}
                </div>
              )}
            </div>
          );
        })}

        {firstIncompleteStep && (
          <Button
            className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            onClick={onOpenWizard}
          >
            <span>Continuar configuração</span>
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
