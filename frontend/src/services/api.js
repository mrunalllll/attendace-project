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

// ── Auth ─────────────────────────────────────
export const authAPI = {
  me:       ()             => axios.get('/auth/me'),
  login:    (mob,pass,role)=> axios.post('/auth/login', { mob, pass, role }),
  register: (formData)     => axios.post('/auth/register', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              }),
  logout:   ()             => axios.post('/auth/logout'),
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

// ── Admin — Dashboard ────────────────────────
export const adminAPI = {
  dashboard: () => axios.get('/admin/dashboard'),

  // Candidates
  getCandidates:    ()        => axios.get('/admin/candidates'),
  addCandidate:     (fd)      => axios.post('/admin/candidates', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCandidate:  (id, fd)  => axios.put(`/admin/candidates/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
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
