export function getFriendlyHouseholdError(message: string): string {
  if (/ungültig oder abgelaufen/i.test(message)) {
    return 'Diese Einladung ist ungültig, wurde bereits verwendet oder ist abgelaufen.'
  }
  if (/bereits zwei Mitglieder/i.test(message)) {
    return 'Dieser Haushalt hat bereits zwei Mitglieder.'
  }
  if (/bereits zu einem Haushalt/i.test(message)) {
    return 'Dein Konto gehört bereits zu einem Haushalt.'
  }
  return message
}
