/**
 * AGI Chat Sidebar - Floating AI Assistant
 * 
 * A collapsible sidebar that provides access to AGI Sirius
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageSquare, Send, Loader2, Sparkles, Mic } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { VoiceRecorder, isWebSpeechSupported, isMediaRecorderSupported } from '@/lib/mobile/voice';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface AgiChatSidebarProps {
    dealId?: string;
    pipelineId?: string;
    context?: string;
}

/** Atalhos rápidos contextuais para mobile */
const QUICK_SHORTCUTS = [
    { label: 'Minhas tarefas de hoje', icon: '📋' },
    { label: 'Deals parados esta semana', icon: '⏸️' },
    { label: 'Clientes próximos', icon: '📍' },
    { label: 'Próximos follow-ups', icon: '🔔' },
] as const

export function AgiChatSidebar({ dealId, pipelineId, context }: AgiChatSidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
    const hasVoice = typeof window !== 'undefined'
        ? isWebSpeechSupported() || isMediaRecorderSupported()
        : false;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usage, setUsage] = useState<{
        remaining: number;
        monthlyLimit: number;
        plan: string;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load usage on mount
    useEffect(() => {
        if (isOpen) {
            fetchUsage();
        }
    }, [isOpen]);

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/agi/usage', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUsage(data);
            }
        } catch (error) {
            console.error('Failed to fetch usage:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/agi/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: input,
                    context: {
                        dealId,
                        pipelineId,
                        type: context,
                    },
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Erro ao enviar mensagem');
            }

            const data = await res.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.message, // Changed from data.response to data.message
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Update usage
            fetchUsage();
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    function handleVoiceStart() {
        if (isVoiceRecording) return;
        setIsVoiceRecording(true);
        const recorder = new VoiceRecorder({
            lang: 'pt-BR',
            onResult: (r) => {
                setInput(r.transcript);
                if (r.isFinal) {
                    setIsVoiceRecording(false);
                    voiceRecorderRef.current = null;
                }
            },
            onEnd: () => setIsVoiceRecording(false),
            onError: () => setIsVoiceRecording(false),
        });
        voiceRecorderRef.current = recorder;
        recorder.start();
    }

    function handleVoiceStop() {
        voiceRecorderRef.current?.stop();
        voiceRecorderRef.current = null;
        setIsVoiceRecording(false);
    }

    // Hide on the chat page — the widget overlaps the mic button
    if (pathname?.includes('/dashboard/chat')) return null;

    // ── Blocos reutilizáveis ────────────────────────────────────────────────

    const headerBlock = (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Sparkles className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                </div>
                <div>
                    <h2 className="font-bold text-lg">AGI Sirius</h2>
                    <p className="text-xs text-purple-100">Especialista em Vendas</p>
                </div>
            </div>
            <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                aria-label="Fechar"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );

    const usageBlock = usage && (
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Plano {usage.plan}</span>
                <span className="text-gray-600 dark:text-gray-400">
                    {usage.remaining.toLocaleString('pt-BR')} / {usage.monthlyLimit.toLocaleString('pt-BR')} tokens
                </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${(usage.remaining / usage.monthlyLimit) > 0.5
                        ? 'bg-green-500'
                        : (usage.remaining / usage.monthlyLimit) > 0.2
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                    style={{ width: `${(usage.remaining / usage.monthlyLimit) * 100}%` }}
                />
            </div>
        </div>
    );

    const emptyStateBlock = (
        <div className="text-center py-10">
            <Sparkles className="h-10 w-10 mx-auto text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Olá! Sou a Sirius 👋
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-6">
                Especialista em vendas B2B. Como posso te ajudar a vender mais hoje?
            </p>
            {/* Atalhos rápidos mobile */}
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {isMobile
                    ? QUICK_SHORTCUTS.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => setInput(s.label)}
                            className="flex items-center gap-2 text-xs text-left px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium"
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                        </button>
                    ))
                    : (
                        <>
                            <button
                                onClick={() => setInput('Como qualificar um lead usando BANT?')}
                                className="text-sm text-left px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                                💡 Como qualificar leads com BANT?
                            </button>
                            <button
                                onClick={() => setInput('Crie um script de cold call para SaaS B2B')}
                                className="text-sm text-left px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                📞 Gerar script de cold call
                            </button>
                            <button
                                onClick={() => setInput('Dicas para quebrar objeção de preço')}
                                className="text-sm text-left px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            >
                                💰 Como lidar com objeções?
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    );

    const messagesBlock = (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && emptyStateBlock}

            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className={`text-xs mt-1 block ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );

    const inputBlock = (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Atalhos rápidos acima do input (mobile only, quando há mensagens) */}
            {isMobile && messages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
                    {QUICK_SHORTCUTS.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => setInput(s.label)}
                            className="flex-shrink-0 text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 transition-colors font-medium"
                        >
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-2 items-end">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isVoiceRecording ? 'Ouvindo...' : 'Digite sua mensagem...'}
                    rows={isMobile ? 1 : 2}
                    className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-400 min-h-[44px]"
                    disabled={isLoading}
                />
                {/* Botão de voz — mobile, quando suportado */}
                {isMobile && hasVoice && (
                    <button
                        type="button"
                        aria-label={isVoiceRecording ? 'Parar gravação' : 'Ditar mensagem'}
                        onPointerDown={handleVoiceStart}
                        onPointerUp={handleVoiceStop}
                        onPointerLeave={handleVoiceStop}
                        className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isVoiceRecording
                            ? 'bg-red-500 text-white ring-2 ring-red-300'
                            : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Mic className="h-5 w-5" />
                    </button>
                )}
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="flex-shrink-0 flex h-11 w-11 items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
            {!isMobile && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Shift+Enter para nova linha • Enter para enviar
                </p>
            )}
        </div>
    );

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`fixed z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group
                        ${isMobile
                            ? 'bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] left-4 p-3'
                            : 'bottom-6 right-6 p-4'
                        }`}
                    aria-label="Abrir AGI Sirius"
                >
                    <Sparkles className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} group-hover:rotate-12 transition-transform`} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </button>
            )}

            {/* Desktop Sidebar */}
            {isOpen && !isMobile && (
                <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col">
                    {headerBlock}
                    {usageBlock}
                    {messagesBlock}
                    {inputBlock}
                </div>
            )}

            {/* Mobile Bottom Sheet fullscreen */}
            {isOpen && isMobile && (
                <div className="fixed inset-0 z-50 flex flex-col">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    {/* Sheet */}
                    <div className="relative mt-auto flex max-h-[92vh] flex-col rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        {/* Drag handle */}
                        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                        {headerBlock}
                        {usageBlock}
                        {messagesBlock}
                        {inputBlock}
                    </div>
                </div>
            )}
        </>
    );
}
