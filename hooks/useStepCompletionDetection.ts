/**
 * Hook para detecção automática de conclusão de steps do onboarding
 *
 * Implementa polling para verificar se o usuário completou a ação
 * necessária para avançar no onboarding.
 *
 * Pattern: Progressive Onboarding with Automatic Detection
 * https://userguiding.com/blog/progressive-onboarding
 * https://nextstepjs.com/react
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface UseStepCompletionDetectionOptions {
  stepId: string;
  enabled: boolean;
  onComplete?: (result: {
    pointsEarned: number;
    newBadges: string[];
  }) => void;
  pollingInterval?: number; // ms
}

/**
 * Hook que verifica automaticamente se um step foi concluído
 * através de polling no backend
 */
export function useStepCompletionDetection({
  stepId,
  enabled,
  onComplete,
  pollingInterval = 2000, // 2 segundos por padrão
}: UseStepCompletionDetectionOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkingRef = useRef(false); // Prevenir múltiplas chamadas simultâneas

  useEffect(() => {
    // Não ativar se disabled
    if (!enabled || !stepId) {
      return;
    }

    console.log(`[Step Detection] Started polling for step: ${stepId}`);

    // Função que verifica a conclusão
    const checkCompletion = async () => {
      // Prevenir chamadas simultâneas
      if (checkingRef.current) {
        return;
      }

      checkingRef.current = true;

      try {
        const response = await fetch('/api/onboarding/check-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stepId }),
        });

        if (!response.ok) {
          throw new Error('Erro ao verificar conclusão');
        }

        const result = await response.json();

        console.log(`[Step Detection] Check result for ${stepId}:`, result);

        // Se detectou conclusão automática
        if (result.autoCompleted) {
          console.log(`[Step Detection] ✅ Step ${stepId} auto-completed!`);

          // Parar o polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Mostrar toast de sucesso
          toast.success(`✅ Etapa concluída!`, {
            description: result.message || `Você ganhou +${result.pointsEarned} pontos!`,
            duration: 3000,
          });

          // Callback com resultado
          if (onComplete) {
            onComplete({
              pointsEarned: result.pointsEarned || 0,
              newBadges: result.newBadges || [],
            });
          }
        }
      } catch (error) {
        console.error(`[Step Detection] Error checking step ${stepId}:`, error);
        // Não mostrar erro para o usuário, apenas log
      } finally {
        checkingRef.current = false;
      }
    };

    // Iniciar polling
    intervalRef.current = setInterval(checkCompletion, pollingInterval);

    // Verificar imediatamente ao montar
    checkCompletion();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log(`[Step Detection] Stopped polling for step: ${stepId}`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      checkingRef.current = false;
    };
  }, [stepId, enabled, onComplete, pollingInterval]);
}
