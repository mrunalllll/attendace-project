// ─────────────────────────────────────────────
//  src/services/api.js
//  Central place for ALL API calls.
//  Import what you need in any page/component.
//
//  Usage example:
//    import { authAPI } from '../services/api'
//    const data = await authAPI.login(mob, pass, role)
// ─────────────────────────────────────────────
import axios from '../api/axios'

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

// ── Auth ─────────────────────────────────────
export const authAPI = {
  me:               ()                   => axios.get('/auth/me'),
  login:            (mob, pass, role)    => axios.post('/auth/login', { mob, pass, role }),
  register:         (formData)           => axios.post('/auth/register', formData, multipart),
  logout:           ()                   => axios.post('/auth/logout'),
  updateDepartment: (department_id)      => axios.patch('/auth/update-department', { department_id }),
}

// ── Voter ────────────────────────────────────
export const voterAPI = {
  dashboard: ()            => axios.get('/voter/dashboard'),
  vote:      (candidateId) => axios.post('/voter/vote', { candidate_id: candidateId }),
}

// ── Results (public) ─────────────────────────
export const resultsAPI = {
  get: () => axios.get('/results'),
}

// ── Admin — core voting ───────────────────────
export const adminAPI = {
  dashboard: () => axios.get('/admin/dashboard'),

  // Candidates
  getCandidates:    ()        => axios.get('/admin/candidates'),
  addCandidate:     (fd)      => axios.post('/admin/candidates', fd, multipart),
  updateCandidate:  (id, fd)  => axios.put(`/admin/candidates/${id}`, fd, multipart),
  deleteCandidate:  (id)      => axios.delete(`/admin/candidates/${id}`),
  toggleCandidate:  (id)      => axios.patch(`/admin/candidates/${id}/toggle`),

  // Users
  getUsers:   (params) => axios.get('/admin/users', { params }),
  blockUser:  (id)     => axios.patch(`/admin/users/${id}/block`),
  unblockUser:(id)     => axios.patch(`/admin/users/${id}/unblock`),
  deleteUser: (id)     => axios.delete(`/admin/users/${id}`),

  // Election
  getElection:    ()       => axios.get('/admin/election'),
  electionAction: (payload)=> axios.post('/admin/election/action', payload),

  // Analytics
  getAnalytics: () => axios.get('/admin/analytics'),

  // Logs
  getLogs:   (params) => axios.get('/admin/logs', { params }),
  clearLogs: ()       => axios.delete('/admin/logs'),
}

// ── Departments (public) ──────────────────────
export const departmentsAPI = {
  getAll:      ()       => axios.get('/departments'),
  getBySlug:   (slug)   => axios.get(`/departments/${slug}`),
}

// ── Departments (admin) ───────────────────────
export const adminDepartmentsAPI = {
  getAll:      ()         => axios.get('/admin/departments/admin/all'),
  create:      (fd)       => axios.post('/admin/departments/admin', fd, multipart),
  update:      (id, fd)   => axios.put(`/admin/departments/admin/${id}`, fd, multipart),
  delete:      (id)       => axios.delete(`/admin/departments/admin/${id}`),
  // Faculty
  getFaculty:  (id)       => axios.get(`/admin/departments/admin/${id}/faculty`),
  addFaculty:  (id, fd)   => axios.post(`/admin/departments/admin/${id}/faculty`, fd, multipart),
  deleteFaculty:(fid)     => axios.delete(`/admin/departments/admin/faculty/${fid}`),
}

// ── Events (public) ───────────────────────────
export const eventsAPI = {
  getAll:      (params) => axios.get('/events', { params }),
  getUpcoming: ()       => axios.get('/events/upcoming'),
  getRecent:   ()       => axios.get('/events/recent'),
  getBySlug:   (slug)   => axios.get(`/events/${slug}`),
}

// ── Events (admin) ────────────────────────────
export const adminEventsAPI = {
  getAll:          (params) => axios.get('/admin/events/admin/all', { params }),
  create:          (fd)     => axios.post('/admin/events/admin', fd, multipart),
  update:          (id, fd) => axios.put(`/admin/events/admin/${id}`, fd, multipart),
  delete:          (id)     => axios.delete(`/admin/events/admin/${id}`),
  togglePublish:   (id)     => axios.patch(`/admin/events/admin/${id}/toggle-publish`),
  // Photos
  getPhotos:       (id)     => axios.get(`/admin/events/admin/${id}/photos`),
  uploadPhotos:    (id, fd) => axios.post(`/admin/events/admin/${id}/photos`, fd, multipart),
  deletePhoto:     (pid)    => axios.delete(`/admin/events/admin/photos/${pid}`),
  updatePhotoTitle:(pid, t) => axios.patch(`/admin/events/admin/photos/${pid}`, { title: t }),
}

// ── Gallery (public) ──────────────────────────
export const galleryAPI = {
  getAll:      (params) => axios.get('/gallery', { params }),
  getFeatured: ()       => axios.get('/gallery/featured'),
}

// ── Gallery (admin) ───────────────────────────
export const adminGalleryAPI = {
  getAll:   (params)       => axios.get('/admin/gallery/admin/all', { params }),
  upload:   (fd)           => axios.post('/admin/gallery/admin', fd, multipart),
  update:   (id, payload)  => axios.put(`/admin/gallery/admin/${id}`, payload),
  delete:   (id)           => axios.delete(`/admin/gallery/admin/${id}`),
  bulkDelete:(ids)         => axios.delete('/admin/gallery/admin/bulk', { data: { ids } }),
}

// ── Announcements (public) ────────────────────
export const announcementsAPI = {
  getAll:    (params) => axios.get('/announcements', { params }),
  getLatest: ()       => axios.get('/announcements/latest'),
}

// ── Announcements (admin) ─────────────────────
export const adminAnnouncementsAPI = {
  getAll:        (params)       => axios.get('/admin/announcements/admin/all', { params }),
  create:        (payload)      => axios.post('/admin/announcements/admin', payload),
  update:        (id, payload)  => axios.put(`/admin/announcements/admin/${id}`, payload),
  delete:        (id)           => axios.delete(`/admin/announcements/admin/${id}`),
  togglePublish: (id)           => axios.patch(`/admin/announcements/admin/${id}/toggle-publish`),
  togglePin:     (id)           => axios.patch(`/admin/announcements/admin/${id}/toggle-pin`),
}

// ── Search (combined) ─────────────────────────
export const searchAPI = {
  search: (q, type) => {
    const params = { search: q }
    if (type === 'events')        return eventsAPI.getAll(params)
    if (type === 'departments')   return departmentsAPI.getAll()
    if (type === 'gallery')       return galleryAPI.getAll(params)
    if (type === 'announcements') return announcementsAPI.getAll(params)
    // combined: fire all three
    return Promise.all([
      eventsAPI.getAll(params),
      galleryAPI.getAll(params),
      announcementsAPI.getAll(params),
    ])
  },
}
