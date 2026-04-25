'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Share, MoreVertical, Smartphone, Monitor, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export function DownloadInstructions() {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) {
      setDeviceType('ios')
    } else if (/Android/.test(ua)) {
      setDeviceType('android')
    } else {
      setDeviceType('desktop')
    }
  }, [])

  const appUrl = 'https://siriuscrm.com.br'

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sirius CRM',
          text: 'Baixe o Sirius CRM - O CRM inteligente para vendas',
          url: appUrl,
        })
      } catch (err) {
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 shadow-2xl">
            <Image src="/logo.png" alt="Sirius Logo" fill className="object-contain p-2" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Sirius CRM
        </h1>
        <p className="text-xl text-zinc-400 mb-6">
          Instale o app no seu {deviceType === 'ios' ? 'iPhone' : deviceType === 'android' ? 'Android' : 'dispositivo'}
        </p>

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center mb-8">
          <Button
            onClick={shareApp}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2"
          >
            <Share className="h-5 w-5" />
            Compartilhar
          </Button>
          <Button
            onClick={copyLink}
            size="lg"
            variant="outline"
            className="border-white/20 hover:bg-white/10 gap-2"
          >
            {showCopied ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Copiar Link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Installation Instructions */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          {deviceType === 'ios' && <Smartphone className="h-6 w-6 text-indigo-400" />}
          {deviceType === 'android' && <Smartphone className="h-6 w-6 text-indigo-400" />}
          {deviceType === 'desktop' && <Monitor className="h-6 w-6 text-indigo-400" />}
          <h2 className="text-2xl font-bold text-white">
            Como instalar
          </h2>
        </div>

        {deviceType === 'ios' && (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                1
              </div>
              <div>
                <p className="text-zinc-300 mb-2">
                  Abra <strong className="text-white">siriuscrm.com.br</strong> no Safari
                </p>
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
                  <code className="text-sm text-indigo-400">https://siriuscrm.com.br</code>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                2
              </div>
              <div>
                <p className="text-zinc-300">
                  Toque no botão <Share className="inline h-4 w-4 mx-1" /> <strong className="text-white">Compartilhar</strong> na barra inferior
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                3
              </div>
              <div>
                <p className="text-zinc-300">
                  Role para baixo e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                4
              </div>
              <div>
                <p className="text-zinc-300">
                  Toque em <strong className="text-white">"Adicionar"</strong> no canto superior direito
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Check className="h-4 w-4" />
                Pronto! O ícone do Sirius aparecerá na sua tela inicial
              </p>
            </div>
          </div>
        )}

        {deviceType === 'android' && (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                1
              </div>
              <div>
                <p className="text-zinc-300 mb-2">
                  Abra <strong className="text-white">siriuscrm.com.br</strong> no Chrome
                </p>
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
                  <code className="text-sm text-indigo-400">https://siriuscrm.com.br</code>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                2
              </div>
              <div>
                <p className="text-zinc-300">
                  Um banner aparecerá automaticamente pedindo para <strong className="text-white">"Instalar app"</strong>
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Caso não apareça, toque em <MoreVertical className="inline h-4 w-4 mx-1" /> no canto superior
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                3
              </div>
              <div>
                <p className="text-zinc-300">
                  Toque em <strong className="text-white">"Instalar"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Check className="h-4 w-4" />
                Pronto! O Sirius CRM está instalado como app nativo
              </p>
            </div>
          </div>
        )}

        {deviceType === 'desktop' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Smartphone className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400 mb-4">
                Para a melhor experiência, acesse este link no seu celular
              </p>
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700 max-w-md mx-auto">
                <code className="text-sm text-indigo-400 break-all">https://siriuscrm.com.br/download</code>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
              <p className="text-zinc-400 text-sm text-center mb-4">
                Ou escaneie o QR Code com seu celular
              </p>
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-2xl">
                  <QRCodeSVG
                    value="https://siriuscrm.com.br/download"
                    size={192}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/logo.png",
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
              <p className="text-zinc-500 text-xs text-center mt-3">
                Aponte a câmera do celular para o QR Code
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
            <Download className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Acesso Offline</h3>
          <p className="text-sm text-zinc-400">
            Use mesmo sem internet
          </p>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">App Nativo</h3>
          <p className="text-sm text-zinc-400">
            Ícone na tela inicial
          </p>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Sempre Atualizado</h3>
          <p className="text-sm text-zinc-400">
            Updates automáticos
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link href="/register">
          <Button size="lg" className="bg-white text-indigo-600 hover:bg-zinc-100 font-semibold">
            Criar Conta Grátis
          </Button>
        </Link>
        <p className="text-sm text-zinc-500 mt-4">
          Já tem conta? <Link href="/login" className="text-indigo-400 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  )
}
