'use server'

import { revalidatePath } from 'next/cache'

/**
 * Server Action para forçar refresh do cache do funnel
 */
export async function forceRefreshFunnel() {
  // Revalidar o cache do funnel
  revalidatePath('/admin/funnel')

  return { success: true }
}
