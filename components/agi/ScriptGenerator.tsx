/**
 * Script Generator Modal - Sales Script Creation
 * 
 * Modal for generating different types of sales scripts using AGI
 */

'use client';

import { useState } from 'react';
import { X, Wand2, Loader2, Copy, Check } from 'lucide-react';

type ScriptType = 'cold_call' | 'cold_email' | 'follow_up' | 'demo_pitch' | 'objection_handling';

interface ScriptGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    dealId?: string;
}

const SCRIPT_TYPES: { value: ScriptType; label: string; description: string; icon: string }[] = [
    {
        value: 'cold_call',
        label: 'Cold Call',
        description: 'Script para prospecção ativa por telefone',
        icon: '📞',
    },
    {
        value: 'cold_email',
        label: 'Cold Email',
        description: 'Email de prospecção personalizado',
        icon: '📧',
    },
    {
        value: 'follow_up',
        label: 'Follow-up',
        description: 'Email de acompanhamento pós-contato',
        icon: '🔄',
    },
    {
        value: 'demo_pitch',
        label: 'Demo Pitch',
        description: 'Roteiro estruturado para demonstração',
        icon: '🎯',
    },
    {
        value: 'objection_handling',
        label: 'Objeções',
        description: 'Respostas para objeções comuns',
        icon: '💪',
    },
];

export function ScriptGenerator({ isOpen, onClose, dealId }: ScriptGeneratorProps) {
    const [scriptType, setScriptType] = useState<ScriptType>('cold_call');
    const [product, setProduct] = useState('');
    const [targetCompany, setTargetCompany] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [industry, setIndustry] = useState('');
    const [painPoint, setPainPoint] = useState('');
    const [generatedScript, setGeneratedScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedScript('');

        try {
            const res = await fetch('/api/agi/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: scriptType,
                    context: {
                        product,
                        targetCompany,
                        targetRole,
                        industry,
                        painPoint,
                        dealId,
                    },
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Erro ao gerar script');
            }

            const data = await res.json();
            setGeneratedScript(data.script);
        } catch (error) {
            console.error('Script generation error:', error);
            setGeneratedScript(
                `❌ Erro ao gerar script: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setGeneratedScript('');
        setProduct('');
        setTargetCompany('');
        setTargetRole('');
        setIndustry('');
        setPainPoint('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 rounded-lg p-2">
                                <Wand2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Gerador de Scripts</h2>
                                <p className="text-sm text-purple-100">Crie scripts de vendas com IA</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Script Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Tipo de Script
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {SCRIPT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setScriptType(type.value)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${scriptType === type.value
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{type.icon}</div>
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {type.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Produto/Serviço
                                </label>
                                <input
                                    type="text"
                                    value={product}
                                    onChange={(e) => setProduct(e.target.value)}
                                    placeholder="Ex: CRM Sirius"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Empresa Alvo
                                </label>
                                <input
                                    type="text"
                                    value={targetCompany}
                                    onChange={(e) => setTargetCompany(e.target.value)}
                                    placeholder="Ex: Acme Corp"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Cargo do Decisor
                                </label>
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    placeholder="Ex: CEO, Diretor"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Indústria
                                </label>
                                <input
                                    type="text"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder="Ex: SaaS, E-commerce"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dor / Problema Identificado
                            </label>
                            <textarea
                                value={painPoint}
                                onChange={(e) => setPainPoint(e.target.value)}
                                placeholder="Descreva a principal dor ou desafio do prospect..."
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                        </div>

                        {/* Generated Script */}
                        {(generatedScript || isGenerating) && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Script Gerado
                                    </label>
                                    {generatedScript && !isGenerating && (
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Copiado!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copiar
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[200px]">
                                    {isGenerating ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                        </div>
                                    ) : (
                                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                                            {generatedScript}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !product}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-5 w-5" />
                                    Gerar Script
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
