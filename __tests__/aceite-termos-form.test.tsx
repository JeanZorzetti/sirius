/**
 * The signup form's first wall: the terms box starts unchecked, is required, and gates the Google button
 * (which is not a form submit, so `required` alone would not stop it).
 */
import { vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...a: unknown[]) => signIn(...a) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/app/auth/actions', () => ({ registerAction: vi.fn() }))

import { RegisterForm } from '@/app/[locale]/(marketing)/register/register-form'

describe('caixa de aceite no cadastro', () => {
  beforeEach(() => { document.cookie = 'aceite_termos=; max-age=0; path=/' })

  it('começa desmarcada, é obrigatória e aponta para os dois textos', () => {
    render(<RegisterForm inviteData={null} />)
    const caixa = screen.getByRole('checkbox', { name: /Li e aceito/ }) as HTMLInputElement
    expect(caixa.checked).toBe(false)
    expect(caixa.required).toBe(true)
    expect(screen.getByRole('link', { name: /Termos de Uso/ }).getAttribute('href')).toBe('/terms')
    expect(screen.getByRole('link', { name: /Política de Privacidade/ }).getAttribute('href')).toBe('/privacy')
  })

  it('Google sem aceite não sai da página; com aceite, grava o cookie e segue', () => {
    render(<RegisterForm inviteData={null} />)
    const google = screen.getByRole('button', { name: /Continuar com Google/ })

    fireEvent.click(google)
    expect(signIn).not.toHaveBeenCalled()
    expect(document.cookie).not.toContain('aceite_termos=1')

    fireEvent.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    fireEvent.click(google)
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    expect(document.cookie).toContain('aceite_termos=1')
  })

  it('mostra o motivo quando o Google voltou sem conta', () => {
    render(<RegisterForm inviteData={null} erroInicial="Ainda não há conta com esse Google." />)
    expect(screen.getByRole('alert').textContent).toContain('Ainda não há conta')
  })
})
