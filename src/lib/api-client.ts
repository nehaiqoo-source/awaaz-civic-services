import type { Category, GrievanceDraft, StructureResult, Urgency } from '@/lib/grievance/schema'
import type { SaathiResponse } from '@/lib/saathi/plan'

export interface TrackingStatus {
  id: string
  status: string
  category: string
  title: string
  createdAt: string
  hasPhoto?: boolean
  hasLocation?: boolean
}

export interface PhotoDraft {
  title: string
  description: string
  category: Category
  urgency: Urgency
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new ApiError(response.status === 429 ? 'Too many requests, please wait a minute.' : 'Request failed', response.status)
  }
  return (await response.json()) as T
}

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  structure: (transcript: string, language: string) =>
    request<StructureResult>('/api/grievances/structure', jsonPost({ transcript, language })),
  submit: (draft: GrievanceDraft, transcript: string, language: string, geo?: { lat: number; lng: number; accuracyM?: number }) =>
    request<{ id: string; status: string; createdAt: string; photoToken?: string }>(
      '/api/grievances',
      jsonPost({ draft, transcript, language, ...(geo ? { geo } : {}) }),
    ),
  uploadPhoto: (id: string, token: string, photo: Blob) =>
    request<{ ok: true }>(`/api/grievances/${encodeURIComponent(id)}/photo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg', 'x-photo-token': token },
      body: photo,
    }),
  describePhoto: (image: string, language: string) =>
    request<{ draft: PhotoDraft }>('/api/grievances/describe-photo', jsonPost({ image, language })),
  saathi: (transcript: string, language: string) => request<SaathiResponse>('/api/saathi', jsonPost({ transcript, language })),
  track: (id: string) => request<TrackingStatus>(`/api/grievances/${encodeURIComponent(id)}`),
}
