'use client'

import { useFormStatus } from "react-dom"
import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SubmitButtonProps extends ButtonProps {
    text: string
    loadingText?: string
}

export function SubmitButton({ text, loadingText = "Aguarde...", className, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button disabled={pending} type="submit" className={className} {...props}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                text
            )}
        </Button>
    )
}
