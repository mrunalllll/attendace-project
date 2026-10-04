// ─────────────────────────────────────────────
//  AdminEventPhotos — manage photos for one event
//  Route: /admin/events/:id/photos
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { adminEventsAPI } from '../../services/api'

export default function AdminEventPhotos() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [photos, setPhotos]       = useState([])
  const [eventName, setEventName] = useState('')
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [alert, setAlert]         = useState({ type: '', message: '' })

  // Upload area
  const [previews, setPreviews]   = useState([])   // { file, url, title }
  const fileRef = useRef()

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await adminEventsAPI.getPhotos(id)
      setPhotos(res.data.photos || [])
    } catch {
      showAlert('error', 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  // Fetch event name from photos endpoint response
  useEffect(() => {
    // Try to get event name via URL state or just show "Event #id"
    setEventName(`Event #${id}`)
    load()
  }, [id])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const newPrevs = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      title: '',
    }))
    setPreviews(prev => [...prev, ...newPrevs])
    // reset input so same files can be added again
    e.target.value = ''
  }

  const removePreview = (idx) => {
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const updateTitle = (idx, title) => {
    setPreviews(prev => prev.map((p, i) => i === idx ? { ...p, title } : p))
  }

  const handleUpload = async () => {
    if (!previews.length) return showAlert('error', 'Please select at least one photo')
    setUploading(true)
    try {
      const fd = new FormData()
      previews.forEach(p => fd.append('photos', p.file))
      previews.forEach(p => fd.append('titles', p.title))
      await adminEventsAPI.uploadPhotos(id, fd)
      showAlert('success', `${previews.length} photo(s) uploaded successfully!`)
      setPreviews([])
      load()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId, photoFile) => {
    if (!window.confirm('Delete this photo?')) return
    try {
      await adminEventsAPI.deletePhoto(photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      showAlert('success', 'Photo deleted')
    } catch {
      showAlert('error', 'Delete failed')
    }
  }

  const handleTitleEdit = async (photoId, currentTitle) => {
    const newTitle = window.prompt('Enter new title:', currentTitle || '')
    if (newTitle === null) return
    try {
      await adminEventsAPI.updatePhotoTitle(photoId, newTitle)
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, title: newTitle } : p))
    } catch {
      showAlert('error', 'Failed to update title')
    }
  }

  if (loading) return <AdminLayout breadcrumb="Event Photos"><Spinner message="Loading photos..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb={`Events / Photos`}>
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn-glass px-3 py-1 rounded-2 mb-2" style={{ fontSize: '0.82rem' }} onClick={() => navigate('/admin/events')}>
            <i className="bi bi-arrow-left me-2"></i>Back to Events
          </button>
          <h4 className="text-gradient fw-bold mb-1">Event Photos</h4>
          <p style={{ opacity: 0.6, fontSize: '0.88rem' }}>{eventName} — {photos.length} photo(s) uploaded</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-card p-4 mb-4">
        <h6 className="fw-semibold mb-3"><i className="bi bi-cloud-upload-fill me-2" style={{ color: 'var(--primary)' }}></i>Upload Photos</h6>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current.click()}
          style={{
            border: '2px dashed var(--primary)', borderRadius: 16, padding: 32,
            textAlign: 'center', cursor: 'pointer', background: 'rgba(79,70,229,0.04)',
            transition: 'background 0.2s',
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
            const newPrevs = files.map(file => ({ file, url: URL.createObjectURL(file), title: '' }))
            setPreviews(prev => [...prev, ...newPrevs])
          }}
        >
          <i className="bi bi-images fs-1 d-block mb-2" style={{ color: 'var(--primary)', opacity: 0.6 }}></i>
          <p className="fw-semibold mb-1" style={{ color: 'var(--primary)' }}>Click or drag & drop photos here</p>
          <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Supports JPEG, PNG, WebP — up to 5MB each — multiple files allowed</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Preview grid */}
        {previews.length > 0 && (
          <>
            <div className="row g-3 mt-3">
              {previews.map((p, idx) => (
                <div className="col-6 col-md-3 col-lg-2" key={idx}>
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => removePreview(idx)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                  <input className="form-control-glass mt-1" style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    placeholder="Photo title (optional)"
                    value={p.title} onChange={e => updateTitle(idx, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="d-flex gap-3 mt-3 align-items-center">
              <button className="btn-gradient px-5 py-2 rounded-3" onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? <><i className="bi bi-hourglass-split me-2"></i>Uploading {previews.length} photo(s)...</>
                  : <><i className="bi bi-cloud-upload-fill me-2"></i>Upload {previews.length} Photo(s)</>}
              </button>
              <button className="btn-glass px-4 py-2 rounded-3" onClick={() => setPreviews([])}>Clear All</button>
              <span style={{ opacity: 0.5, fontSize: '0.82rem' }}>{previews.length} file(s) selected</span>
            </div>
          </>
        )}
      </div>

      {/* Existing Photos */}
      <div className="glass-card p-4">
        <h6 className="fw-semibold mb-3"><i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: 'var(--primary)' }}></i>Uploaded Photos ({photos.length})</h6>

        {photos.length === 0 ? (
          <div className="text-center py-5" style={{ opacity: 0.4 }}>
            <i className="bi bi-camera fs-1 d-block mb-2"></i>
            <p>No photos yet. Upload some above.</p>
          </div>
        ) : (
          <div className="row g-3">
            {photos.map(photo => (
              <div className="col-6 col-md-3 col-lg-2" key={photo.id}>
                <div className="glass-card p-0 overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={`/uploads/${photo.photo}`}
                      alt={photo.title || ''}
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                    />
                    {/* Action overlay */}
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                      display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                      className="photo-actions-overlay"
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <button onClick={() => handleTitleEdit(photo.id, photo.title)}
                        style={{ background: 'rgba(79,70,229,0.9)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button onClick={() => handleDelete(photo.id, photo.photo)}
                        style={{ background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontSize: '0.72rem', margin: 0, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {photo.title || <em style={{ opacity: 0.4 }}>No title</em>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
