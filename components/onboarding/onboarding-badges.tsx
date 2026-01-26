"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserPlus,
  Handshake,
  GitBranch,
  Trophy,
  Lock,
} from "lucide-react";

const BADGE_ICONS = {
  first_contact: UserPlus,
  first_deal: Handshake,
  pipeline_master: GitBranch,
  onboarding_complete: Trophy,
} as const;

const BADGE_COLORS = {
  first_contact: "from-blue-500 to-cyan-500",
  first_deal: "from-green-500 to-emerald-500",
  pipeline_master: "from-purple-500 to-pink-500",
  onboarding_complete: "from-yellow-500 to-orange-500",
} as const;

interface OnboardingBadgesProps {
  showAll?: boolean;
  compact?: boolean;
}

export function OnboardingBadges({
  showAll = false,
  compact = false,
}: OnboardingBadgesProps) {
  const { badges, earnedBadges, hasBadge, isLoading } = useOnboarding();

  if (isLoading) {
    return null;
  }

  const allBadges = Object.values(badges);
  const displayBadges = showAll ? allBadges : earnedBadges;

  if (displayBadges.length === 0 && !showAll) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {displayBadges.map((badge) => {
            const Icon = BADGE_ICONS[badge.id as keyof typeof BADGE_ICONS] || Trophy;
            const earned = hasBadge(badge.id);
            const color = BADGE_COLORS[badge.id as keyof typeof BADGE_COLORS] || "from-gray-500 to-gray-600";

            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full
                      ${
                        earned
                          ? `bg-gradient-to-br ${color}`
                          : "bg-muted"
                      }
                    `}
                  >
                    {earned ? (
                      <Icon className="h-4 w-4 text-white" />
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {earned ? badge.description : "Badge bloqueado"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Conquistas
        </CardTitle>
        <CardDescription>
          {earnedBadges.length}/{allBadges.length} badges desbloqueados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(showAll ? allBadges : displayBadges).map((badge) => {
            const Icon = BADGE_ICONS[badge.id as keyof typeof BADGE_ICONS] || Trophy;
            const earned = hasBadge(badge.id);
            const color = BADGE_COLORS[badge.id as keyof typeof BADGE_COLORS] || "from-gray-500 to-gray-600";

            return (
              <div
                key={badge.id}
                className={`
                  flex flex-col items-center text-center p-4 rounded-xl border
                  transition-all duration-200
                  ${
                    earned
                      ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm"
                      : "bg-muted/50 opacity-50"
                  }
                `}
              >
                <div
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-full mb-2
                    ${
                      earned
                        ? `bg-gradient-to-br ${color} shadow-lg`
                        : "bg-muted"
                    }
                  `}
                >
                  {earned ? (
                    <Icon className="h-6 w-6 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <h4 className="text-sm font-medium">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {earned ? badge.description : "Bloqueado"}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
