import {
  createInvitationCode,
  formatInvitationCode,
  hashInvitationCode,
  isInvitationCodeValid,
  normalizeInvitationCode,
} from './invitationCode'

describe('Einladungscodes', () => {
  it('erzeugt gut lesbare, zufällige Codes mit 96 Bit', () => {
    const first = createInvitationCode()
    const second = createInvitationCode()

    expect(first).toMatch(/^[A-F0-9]{4}(?:-[A-F0-9]{4}){5}$/)
    expect(isInvitationCodeValid(first)).toBe(true)
    expect(first).not.toBe(second)
  })

  it('normalisiert Leerzeichen und Bindestriche', () => {
    expect(normalizeInvitationCode('ab12-cd34 ef56-7890-ab12-cd34')).toBe(
      'AB12CD34EF567890AB12CD34',
    )
    expect(formatInvitationCode('ab12cd34ef567890ab12cd34')).toBe(
      'AB12-CD34-EF56-7890-AB12-CD34',
    )
  })

  it('hasht denselben Code unabhängig von der Darstellung', async () => {
    await expect(hashInvitationCode('AB12-CD34-EF56-7890-AB12-CD34')).resolves.toBe(
      await hashInvitationCode('ab12cd34ef567890ab12cd34'),
    )
  })

  it('lehnt zu kurze oder nicht-hexadezimale Codes ab', async () => {
    await expect(hashInvitationCode('zu-kurz')).rejects.toThrow('ungültig')
    await expect(hashInvitationCode('ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ')).rejects.toThrow('ungültig')
  })
})
