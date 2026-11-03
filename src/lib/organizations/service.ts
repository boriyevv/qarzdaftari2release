// src/lib/organizations/service.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface StoreOrganization {
  id: string
  name: string
  slug: string
  owner_id: string | null
  plan_type: string
  settings: Record<string, any>
  created_at?: string
  updated_at?: string
}

/**
 * Ensures a store owner has a valid organization in the organizations table.
 * If the owner already has an organization, returns it.
 * Otherwise, creates one and links it to the owner.
 */
export async function getOrCreateStoreOrganization(
  supabase: SupabaseClient,
  owner: { id: string; store_name?: string | null; full_name?: string | null; organization_id?: string | null; plan_type?: string | null }
): Promise<StoreOrganization> {
  // 1. If owner already has an organization_id, check it
  if (owner.organization_id) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', owner.organization_id)
      .maybeSingle()

    if (existingOrg) {
      return existingOrg as StoreOrganization
    }
  }

  // 2. Check if an organization exists where owner_id = owner.id
  const { data: existingByOwner } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', owner.id)
    .maybeSingle()

  if (existingByOwner) {
    // Update owner's organization_id to keep in sync
    await supabase
      .from('users')
      .update({ organization_id: existingByOwner.id })
      .eq('id', owner.id)

    return existingByOwner as StoreOrganization
  }

  // 3. Create a new organization for this store owner
  const baseName = owner.store_name || owner.full_name || "Mening Do'konim"
  const slug = `store-${owner.id.slice(0, 8)}`

  const { data: newOrg, error } = await supabase
    .from('organizations')
    .insert({
      name: baseName,
      slug,
      owner_id: owner.id,
      plan_type: (owner.plan_type || 'FREE').toUpperCase(),
      settings: {
        multi_user_enabled: true,
      },
    })
    .select('*')
    .single()

  if (error || !newOrg) {
    console.error('Failed to create store organization:', error)
    throw new Error('Do\'kon tashkilotini yaratishda xatolik yuz berdi')
  }

  // Link owner to the new org
  await supabase
    .from('users')
    .update({ organization_id: newOrg.id })
    .eq('id', owner.id)

  return newOrg as StoreOrganization
}
