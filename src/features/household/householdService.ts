import type { AppSupabaseClient } from '../../lib/supabase/client'
import { createInvitationCode, hashInvitationCode } from './invitationCode'

export type HouseholdMember = {
  userId: string
  displayName: string
  joinedAt: string
}

export type HouseholdSnapshot = {
  id: string
  name: string
  createdAt: string
  members: HouseholdMember[]
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export async function loadHouseholdSnapshot(
  client: AppSupabaseClient,
  userId: string,
): Promise<HouseholdSnapshot | null> {
  const { data: membership, error: membershipError } = await client
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  throwIfError(membershipError)

  if (!membership) return null

  const [{ data: household, error: householdError }, { data: memberships, error: membersError }] =
    await Promise.all([
      client
        .from('households')
        .select('id, name, created_at')
        .eq('id', membership.household_id)
        .single(),
      client
        .from('household_members')
        .select('user_id, joined_at')
        .eq('household_id', membership.household_id)
        .order('joined_at'),
    ])

  throwIfError(householdError)
  throwIfError(membersError)
  if (!household) throw new Error('Der Haushalt wurde nicht gefunden.')

  const userIds = memberships?.map((member) => member.user_id) ?? []
  const { data: profiles, error: profilesError } = userIds.length
    ? await client.from('profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: [], error: null }
  throwIfError(profilesError)

  const names = new Map(profiles?.map((profile) => [profile.user_id, profile.display_name]))

  return {
    id: household.id,
    name: household.name,
    createdAt: household.created_at,
    members: (memberships ?? []).map((member) => ({
      userId: member.user_id,
      displayName: names.get(member.user_id) ?? 'Mitglied',
      joinedAt: member.joined_at,
    })),
  }
}

export async function createHousehold(client: AppSupabaseClient, name: string): Promise<string> {
  const { data, error } = await client.rpc('create_household', { household_name: name.trim() })
  throwIfError(error)
  if (!data) throw new Error('Der Haushalt konnte nicht erstellt werden.')
  return data
}

export async function joinHousehold(client: AppSupabaseClient, code: string): Promise<string> {
  const invitationTokenHash = await hashInvitationCode(code)
  const { data, error } = await client.rpc('accept_household_invitation', {
    invitation_token_hash: invitationTokenHash,
  })
  throwIfError(error)
  if (!data) throw new Error('Die Einladung konnte nicht angenommen werden.')
  return data
}

export type CreatedInvitation = {
  code: string
  expiresAt: string
}

export async function createInvitation(
  client: AppSupabaseClient,
  householdId: string,
): Promise<CreatedInvitation> {
  const code = createInvitationCode()
  const invitationTokenHash = await hashInvitationCode(code)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error } = await client.rpc('create_household_invitation', {
    target_household_id: householdId,
    invitation_token_hash: invitationTokenHash,
    invitation_expires_at: expiresAt,
  })
  throwIfError(error)
  return { code, expiresAt }
}

export async function updateDisplayName(
  client: AppSupabaseClient,
  userId: string,
  displayName: string,
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('user_id', userId)
  throwIfError(error)
}
