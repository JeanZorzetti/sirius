"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  ChevronRight,
  ChevronLeft,
  X,
  Trophy,
  Check,
  Star,
} from "lucide-react";

const STEP_ICONS = {
  welcome: Sparkles,
  organization: Building2,
  pipeline: GitBranch,
  first_contact: UserPlus,
  first_deal: Handshake,
} as const;

interface OnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const router = useRouter();
  const {
    data,
    steps,
    stats,
    onboarding,
    isLoading,
    isComplete,
    isSkipped,
    completeStep,
    goToStep,
    skipOnboarding,
    minimizeWizard,
    isStepCompleted,
  } = useOnboarding();

  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadgeEarned, setNewBadgeEarned] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const currentStepIndex = onboarding?.currentStep ?? 0;
  const currentStep = steps[currentStepIndex];

  // Auto-scroll to top when wizard appears via #onboarding hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#onboarding') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Remove hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Handle step completion with celebration
  const handleCompleteStep = async () => {
    if (!currentStep) return;

    const result = await completeStep(currentStep.id);

    if (result?.newBadges && result.newBadges.length > 0) {
      setNewBadgeEarned(result.newBadges[0]);
      setTimeout(() => setNewBadgeEarned(null), 3000);
    }

    // Check if this was the last step
    if (currentStepIndex === steps.length - 1) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    await skipOnboarding();
    onSkip?.();
  };

  // Handle minimize (fechar temporariamente)
  const handleMinimize = () => {
    minimizeWizard();
  };

  // Auto-complete steps when user returns from onboarding action
  useEffect(() => {
    if (!data || !currentStep || isLoading) return;

    const checkAndCompleteStep = async () => {
      // Se o step já está completo, não fazer nada
      if (isStepCompleted(currentStep.id)) return;

      // Welcome step completa automaticamente ao aparecer (após 500ms)
      if (currentStep.id === "welcome" && currentStepIndex === 0) {
        // Não completar automaticamente, deixar usuário clicar "Começar"
        return;
      }

      // Check if user returned from completing onboarding action
      const urlParams = new URLSearchParams(window.location.search);
      const isReturningFromOnboarding = urlParams.get('onboarding') === 'true';

      if (isReturningFromOnboarding) {
        // Remove the onboarding param from URL (clean URL)
        urlParams.delete('onboarding');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);

        // Mark current step as complete and advance
        await completeStep(currentStep.id);
      }
    };

    checkAndCompleteStep();
  }, [currentStep, data, isLoading, currentStepIndex, isStepCompleted, completeStep]);

  // Navigate to relevant page based on step
  const handleStepAction = async () => {
    if (!currentStep) return;

    // Se o step já está completo, apenas avançar para o próximo
    if (isStepCompleted(currentStep.id)) {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      await goToStep(nextIndex);
      return;
    }

    setIsNavigating(true);

    switch (currentStep?.id) {
      case "welcome":
        await handleCompleteStep();
        setIsNavigating(false);
        break;
      case "organization":
        // Navegar SEM marcar como completo ainda
        // O wizard detectará automaticamente quando voltar
        router.push("/dashboard/settings?tab=organization&onboarding=true");
        break;
      case "pipeline":
        // Navegar SEM marcar como completo ainda
        router.push("/dashboard?showPipelineSettings=true&onboarding=true");
        break;
      case "first_contact":
        // Navegar SEM marcar como completo ainda
        router.push("/dashboard/contacts?showNewContact=true&onboarding=true");
        break;
      case "first_deal":
        // Navegar SEM marcar como completo ainda
        router.push("/dashboard?showNewDeal=true&onboarding=true");
        break;
      default:
        await handleCompleteStep();
        setIsNavigating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete || isSkipped || isNavigating) {
    return null;
  }

  const StepIcon = currentStep ? STEP_ICONS[currentStep.id as keyof typeof STEP_ICONS] : Sparkles;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-60">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        </div>
      )}

      {/* Badge earned notification */}
      {newBadgeEarned && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 animate-in slide-in-from-top-4">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Badge desbloqueado!</span>
              <Badge variant="secondary">{data?.badges[newBadgeEarned]?.name}</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-2xl mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${stats?.completionPercentage ?? 0}%` }}
          />
        </div>

        <CardHeader className="relative border-b">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleMinimize}
            title="Minimizar (pode continuar depois)"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <StepIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentStep?.title}</CardTitle>
              <CardDescription className="mt-1">
                {currentStep?.description}
              </CardDescription>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${
                    isStepCompleted(step.id)
                      ? "bg-green-500 text-white"
                      : index === currentStepIndex
                        ? "bg-indigo-500 text-white ring-2 ring-indigo-500/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }
                `}
              >
                {isStepCompleted(step.id) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="py-8">
          {/* Step-specific content */}
          {currentStep?.id === "welcome" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Star className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold">
                Bem-vindo ao Sirius CRM! 🚀
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Vamos configurar sua conta em menos de 5 minutos. Ao final, você
                terá tudo pronto para começar a fechar mais negócios!
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Ganhe badges</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-indigo-500" />
                  <span>Acumule {stats?.maxPoints} pontos</span>
                </div>
              </div>
            </div>
          )}

          {currentStep?.id === "organization" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Configure o nome e informações básicas da sua empresa para
                personalizar sua experiência no Sirius CRM.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">O que você vai configurar:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Nome da organização
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    URL personalizada (slug)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep?.id === "pipeline" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                O pipeline é o coração do seu CRM. Configure os estágios que
                representam a jornada das suas vendas.
              </p>
              <div className="flex items-center justify-center gap-2 py-4">
                {["Lead", "Proposta", "Negociação", "Fechamento"].map(
                  (stage, i) => (
                    <div key={stage} className="flex items-center">
                      <div className="px-3 py-2 bg-muted rounded-lg text-sm">
                        {stage}
                      </div>
                      {i < 3 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                      )}
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Já criamos um pipeline padrão para você. Personalize conforme
                seu processo de vendas!
              </p>
            </div>
          )}

          {currentStep?.id === "first_contact" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Adicione seu primeiro contato para começar a construir sua base
                de leads e clientes.
              </p>
              <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                    <UserPlus className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Dica PRO</h4>
                    <p className="text-sm text-muted-foreground">
                      Você pode importar contatos em massa via CSV depois!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep?.id === "first_deal" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Crie sua primeira oportunidade de venda e comece a acompanhar o
                progresso no seu pipeline.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <Handshake className="w-6 h-6 text-indigo-500 mb-2" />
                  <h4 className="font-medium text-sm">Negociação</h4>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe o valor e status
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <GitBranch className="w-6 h-6 text-purple-500 mb-2" />
                  <h4 className="font-medium text-sm">Pipeline</h4>
                  <p className="text-xs text-muted-foreground">
                    Arraste entre estágios
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Points earned */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">
              Complete esta etapa e ganhe{" "}
              <span className="font-semibold text-foreground">
                +{currentStep?.points} pontos
              </span>
            </span>
          </div>
        </CardContent>

        <CardFooter className="border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => goToStep(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {stats?.currentPoints ?? 0} / {stats?.maxPoints ?? 0} pontos
            </span>
          </div>

          <Button onClick={handleStepAction} disabled={isNavigating}>
            {currentStep?.id === "welcome" ? (
              <>
                Começar
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : currentStepIndex === steps.length - 1 ? (
              <>
                Concluir
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                {isStepCompleted(currentStep?.id ?? "") ? "Próximo" : "Ir para Configuração"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
