interface PostPermissionContext {
  userRole: string
  userId: string
  post: {
    status: string
    createdById?: string | null
    organizationId: string
  }
}

export function canEdit({ userRole, userId, post }: PostPermissionContext): boolean {
  if (post.status === 'posted') return false
  if (userRole === 'OWNER' || userRole === 'ADMIN') return true
  if (['draft', 'awaiting_approval', 'scheduled', 'failed'].includes(post.status)) {
    return post.createdById === userId
  }
  return false
}

export function canApprove({ userRole, post }: PostPermissionContext): boolean {
  return (userRole === 'OWNER' || userRole === 'ADMIN') &&
    (post.status === 'draft' || post.status === 'awaiting_approval')
}

export function canDelete({ userRole, userId, post }: PostPermissionContext): boolean {
  if (post.status === 'posted') return false
  if (userRole === 'OWNER' || userRole === 'ADMIN') return true
  return post.createdById === userId && post.status === 'draft'
}

export function canReschedule({ userRole, userId, post }: PostPermissionContext): boolean {
  if (post.status === 'posted' || post.status === 'cancelled') return false
  if (userRole === 'OWNER' || userRole === 'ADMIN') return true
  return post.createdById === userId && post.status === 'scheduled'
}

export function canPublishNow({ userRole, post }: PostPermissionContext): boolean {
  return (userRole === 'OWNER' || userRole === 'ADMIN') && post.status === 'scheduled'
}

export function canComment(_ctx: PostPermissionContext): boolean {
  return true
}
