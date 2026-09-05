export type PageType =
  | 'dashboard' | 'users' | 'documents' | 'review'
  | 'history' | 'notifications' | 'settings' | 'profile'

export interface UserRecord {
  id: string
  name: string
  email: string
  phone: string
  totalDocs: number
  verified: number
  pending: number
  rejected: number
  needsReview: number
  status: 'Active' | 'Suspended' | 'Inactive'
  joined: string
  initials: string
}

export interface DocRecord {
  id: string
  userId: string
  userName: string
  type: string
  status: 'Pending' | 'Verified' | 'Rejected' | 'Needs Review'
  submitted: string
  rejectionReason?: string
  rejectionNote?: string
  verifiedBy?: string
  verifiedAt?: string
}

export interface HistoryRecord {
  id: string
  userId: string
  userName: string
  docId: string
  docType: string
  verifiedBy: string
  dateTime: string
  result: 'Verified' | 'Rejected' | 'Needs Review'
  rejectionReason?: string
}
