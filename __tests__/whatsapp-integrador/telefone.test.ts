// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { chaveTelefone, jidIgnorado, numeroEnvio, telefoneDoJid } from '@/lib/whatsapp/telefone'

describe('chave do telefone', () => {
  it('com e sem +55, com e sem nono dígito, com máscara: a mesma chave', () => {
    const chaves = ['+55 11 98765-4321', '5511987654321', '551187654321', '11987654321', '(11) 98765-4321'].map(chaveTelefone)
    expect(new Set(chaves).size).toBe(1)
    expect(chaves[0]).toBe('551187654321')
  })

  it('o mesmo final com DDD diferente dá outra chave', () => {
    expect(chaveTelefone('5521987654321')).not.toBe(chaveTelefone('5511987654321'))
  })

  it('número estrangeiro fica com os dígitos, e vazio dá null', () => {
    expect(chaveTelefone('+1 (415) 555-2671')).toBe('14155552671')
    expect(chaveTelefone('')).toBeNull()
    expect(chaveTelefone(null)).toBeNull()
  })
})

describe('JID', () => {
  it('grupo, status, canal e lista de transmissão são ignorados', () => {
    for (const jid of ['120363025@g.us', 'status@broadcast', '1203630@newsletter', '12345@broadcast']) {
      expect(jidIgnorado(jid), jid).toBe(true)
    }
    expect(jidIgnorado('5511987654321@s.whatsapp.net')).toBe(false)
    expect(jidIgnorado('123456789012345@lid')).toBe(false)
  })

  it('telefone sai do JID de usuário, com ou sem o sufixo do aparelho; @lid não vira telefone', () => {
    expect(telefoneDoJid('5511987654321@s.whatsapp.net')).toBe('5511987654321')
    expect(telefoneDoJid('5511987654321:12@s.whatsapp.net')).toBe('5511987654321')
    expect(telefoneDoJid('5511987654321@c.us')).toBe('5511987654321')
    expect(telefoneDoJid('123456789012345@lid')).toBeNull()
    expect(telefoneDoJid('120363025@g.us')).toBeNull()
  })

  it('o número de envio leva o 55 quando falta', () => {
    expect(numeroEnvio('(11) 98765-4321')).toBe('5511987654321')
    expect(numeroEnvio('+55 11 98765-4321')).toBe('5511987654321')
  })
})
