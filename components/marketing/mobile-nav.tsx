'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

export function MobileNav() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="flex flex-col gap-4 mt-8">
                    <Link
                        href="/features"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Funcionalidades
                    </Link>
                    <Link
                        href="/pricing"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Preços
                    </Link>
                    <Link
                        href="/blog"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Blog
                    </Link>
                    <div className="border-t pt-4 mt-4 flex flex-col gap-4">
                        <Button variant="outline" asChild className="w-full justify-start">
                            <Link href="/login" onClick={() => setOpen(false)}>Entrar</Link>
                        </Button>
                        <Button asChild className="w-full justify-start">
                            <Link href="/register" onClick={() => setOpen(false)}>Começar Grátis</Link>
                        </Button>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
