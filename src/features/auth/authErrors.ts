const knownMessages: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-Mail-Adresse oder Passwort ist nicht korrekt.'],
  [/email not confirmed/i, 'Bitte bestätige zuerst deine E-Mail-Adresse.'],
  [/user already registered/i, 'Für diese E-Mail-Adresse besteht bereits ein Konto.'],
  [/signup.*disabled/i, 'Neue Registrierungen sind momentan deaktiviert.'],
  [/password.*(weak|short|characters)/i, 'Das Passwort erfüllt die Sicherheitsanforderungen nicht.'],
  [/rate limit|too many requests/i, 'Zu viele Versuche. Bitte warte kurz und probiere es erneut.'],
]

export function getFriendlyAuthError(message: string): string {
  return knownMessages.find(([pattern]) => pattern.test(message))?.[1] ?? message
}
