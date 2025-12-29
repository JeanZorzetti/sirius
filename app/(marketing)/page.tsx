import { Hero } from "@/components/marketing/hero"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { Logos } from "@/components/marketing/logos"

export default function LandingPage() {
  return (
    // Force dark mode aesthetic for the landing page
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">

      {/* Background Noise/Gradient Wrapper */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10">
        <Hero />
        <Logos />
        <BentoGrid />

        {/* Footer CTA */}
        <section className="py-24 px-6 text-center">
          <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.02] rounded-3xl p-12 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-white mb-6">Pronto para escalar?</h2>
            <p className="text-zinc-400 mb-8">Junte-se a centenas de empresas que já modernizaram suas vendas.</p>
            <div className="flex justify-center gap-4">
              {/* Re-using button styles effectively */}
              <a href="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-8 text-sm font-medium text-black hover:bg-zinc-200 transition-colors">
                Criar conta grátis
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
