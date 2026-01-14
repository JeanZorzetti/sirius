/**
 * Deal Insights Panel - BANT/MEDDIC Analysis Component
 * 
 * Shows AI-generated insights for a specific deal
 */

'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';

interface Insight {
    id: string;
    type: string;
    title: string;
    data: any;
}

interface DealInsightsPanelProps {
    dealId: string;
}

export function DealInsightsPanel({ dealId }: DealInsightsPanelProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<'bant' | 'meddic' | 'all'>('bant');

    useEffect(() => {
        loadInsights();
    }, [dealId]);

    const loadInsights = async () => {
        try {
            const res = await fetch(`/api/agi/insights?dealId=${dealId}`, {
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setInsights(data.insights || []);
            }
        } catch (err) {
            console.error('Failed to load insights:', err);
        }
    };

    const analyzeNow = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/agi/analyze-deal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    dealId,
                    analysisType: selectedAnalysis,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao analisar deal');
            }

            const data = await res.json();
            setInsights(data.insights || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    const dismissInsight = async (insightId: string) => {
        try {
            await fetch('/api/agi/insights', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    insightId,
                    action: 'dismiss',
                }),
            });

            setInsights(prev => prev.filter(i => i.id !== insightId));
        } catch (err) {
            console.error('Failed to dismiss insight:', err);
        }
    };

    const applyInsight = async (insightId: string) => {
        try {
            await fetch('/api/agi/insights', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    insightId,
                    action: 'apply',
                }),
            });

            setInsights(prev => prev.filter(i => i.id !== insightId));
        } catch (err) {
            console.error('Failed to apply insight:', err);
        }
    };

    const renderBANTInsight = (insight: Insight) => {
        const bant = insight.data;
        const score = bant.score || 0;
        const isQualified = bant.qualificado || score >= 75;

        return (
            <div className="space-y-4">
                {/* Score Circle */}
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                        <svg className="transform -rotate-90 w-20 h-20">
                            <circle
                                cx="40"
                                cy="40"
                                r="32"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="32"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${(score / 100) * 201} 201`}
                                className={`${score >= 75
                                        ? 'text-green-500'
                                        : score >= 50
                                            ? 'text-yellow-500'
                                            : 'text-red-500'
                                    } transition-all duration-1000`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {score}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {isQualified ? '✅ Lead Qualificado!' : '⚠️ Lead Precisa Atenção'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Análise BANT completa
                        </p>
                    </div>
                </div>

                {/* Criteria Grid */}
                {bant.criterios && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${bant.criterios.budget === 'OK' ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Budget
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bant.criterios.budget}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${bant.criterios.authority === 'Alta' ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Authority
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bant.criterios.authority}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${bant.criterios.need === 'Identificada' ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Need
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bant.criterios.need}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${bant.criterios.timeline?.includes('dias') ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Timeline
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bant.criterios.timeline}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderGeneralInsight = (insight: Insight) => {
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {insight.data.content}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            Insights AGI
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Análise inteligente do deal
                        </p>
                    </div>
                </div>

                <button
                    onClick={analyzeNow}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                        {isLoading ? 'Analisando...' : 'Analisar Agora'}
                    </span>
                </button>
            </div>

            {/* Analysis Type Selector */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSelectedAnalysis('bant')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAnalysis === 'bant'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    BANT
                </button>
                <button
                    onClick={() => setSelectedAnalysis('meddic')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAnalysis === 'meddic'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    MEDDIC
                </button>
                <button
                    onClick={() => setSelectedAnalysis('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAnalysis === 'all'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    Completa
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Erro ao analisar
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Insights List */}
            {insights.length === 0 && !isLoading && !error && (
                <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhuma análise ainda. Clique em "Analisar Agora" para começar.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                {insight.title}
                            </h4>
                            <button
                                onClick={() => dismissInsight(insight.id)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {insight.type === 'QUALIFICATION_BANT' ? (
                            renderBANTInsight(insight)
                        ) : (
                            renderGeneralInsight(insight)
                        )}

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => applyInsight(insight.id)}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Aplicar
                            </button>
                            <button
                                onClick={() => dismissInsight(insight.id)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Dispensar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
