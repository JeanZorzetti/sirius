'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2, Zap, Brain, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

const DEMO_PROMPTS = [
    {
        icon: Target,
        textKey: "p1_text",
        categoryKey: "p1_cat"
    },
    {
        icon: Zap,
        textKey: "p2_text",
        categoryKey: "p2_cat"
    },
    {
        icon: Brain,
        textKey: "p3_text",
        categoryKey: "p3_cat"
    },
];

export function AgiPreview() {
    const t = useTranslations('marketing.agiPreview');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (text: string) => {
        const messageText = text || input;
        if (!messageText.trim() || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/agi/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: messageText }),
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('loginMsg')
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        <Sparkles className="h-8 w-8 text-white" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                        </span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">AGI Sirius</h3>
                        <p className="text-purple-100 text-sm">{t('specialist')}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl mb-4">
                            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {t('trySirius')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {t('subtitle')}
                        </p>

                        {/* Quick Prompts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                            {DEMO_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(t(`prompts.${prompt.textKey}` as any))}
                                    className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-purple-500"
                                >
                                    <div className="flex items-start gap-3 text-left">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <prompt.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                                {t(`prompts.${prompt.categoryKey}` as any)}
                                            </span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                                                {t(`prompts.${prompt.textKey}` as any)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                        placeholder={t('inputPlaceholder')}
                        className="flex-1 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-6 py-3 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {t('hint')}
                </p>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    ONLINE
                </div>
            </div>
        </div>
    );
}
