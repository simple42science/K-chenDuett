const INVITATION_CODE_LENGTH = 24

export function normalizeInvitationCode(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

export function isInvitationCodeValid(value: string): boolean {
  return new RegExp(`^[A-F0-9]{${INVITATION_CODE_LENGTH}}$`).test(
    normalizeInvitationCode(value),
  )
}

export function formatInvitationCode(value: string): string {
  const normalized = normalizeInvitationCode(value)
  return normalized.match(/.{1,4}/g)?.join('-') ?? normalized
}

export function createInvitationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITATION_CODE_LENGTH / 2))
  const code = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  return formatInvitationCode(code)
}

export async function hashInvitationCode(value: string): Promise<string> {
  const normalized = normalizeInvitationCode(value)
  if (!isInvitationCodeValid(normalized)) {
    throw new Error('Der Einladungscode ist ungültig.')
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
