import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { addEvent, updateEvent } from '../../hooks/useHealthData'
import { uploadImage } from '../../utils/cloudinary'

const CATEGORIES = [
  { value: 'medical', label: '診療',  color: '#2563EB' },
  { value: 'rehab',   label: 'リハ',  color: '#16A34A' },
  { value: 'other',   label: 'その他', color: '#EA580C' },
]

export default function EventForm({ dateStr, initialData, onSave, onClose }) {
  const [category, setCategory] = useState(initialData?.category || 'medical')
  const [location, setLocation] = useState(initialData?.location || '')
  const [content, setContent]   = useState(initialData?.content || '')
  const [memo, setMemo]         = useState(initialData?.memo || '')
  const [existingUrls]          = useState(initialData?.imageUrls || [])
  const [images, setImages]     = useState([])     // {file, previewUrl} — new images only
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleFiles = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setImages(imgs => [...imgs, { file, previewUrl: ev.target.result }])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx) => setImages(imgs => imgs.filter((_, i) => i !== idx))

  const handleSave = async () => {
    setSaving(true)
    try {
      let newUrls = []
      if (images.length > 0) {
        setUploading(true)
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        if (cloudName && cloudName !== 'your_cloud_name') {
          newUrls = await Promise.all(images.map(img => uploadImage(img.file)))
        } else {
          newUrls = images.map(img => img.previewUrl)
        }
        setUploading(false)
      }
      const record = {
        category,
        location: location.trim(),
        content: content.trim(),
        memo: memo.trim(),
        imageUrls: [...existingUrls, ...newUrls],
      }
      if (initialData) {
        await updateEvent(dateStr, initialData.id, record)
      } else {
        await addEvent(dateStr, record)
      }
      onSave()
    } catch (e) {
      setError('保存に失敗しました: ' + e.message)
      setUploading(false)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 イベントを{initialData ? '編集' : '記録'}</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}

          <div className="form-group">
            <label>カテゴリ</label>
            <div className="chip-group">
              {CATEGORIES.map(({ value, label, color }) => (
                <button key={value} onClick={() => setCategory(value)} style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', border: `2px solid ${category === value ? color : 'var(--border)'}`,
                  background: category === value ? color + '15' : '#fff',
                  color: category === value ? color : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>場所</label>
            <input className="form-control" type="text" placeholder="病院名、施設名など"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label>内容</label>
            <input className="form-control" type="text" placeholder="診察・PT・OTなど"
              value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div className="form-group">
            <label>メモ（詳細）</label>
            <textarea className="form-control" placeholder="詳細な内容、医師からの指示、次回予約など..."
              rows={5} value={memo} onChange={e => setMemo(e.target.value)} />
          </div>

          <div className="form-group">
            <label>画像</label>
            {existingUrls.length > 0 && (
              <div className="image-previews" style={{ marginBottom: 8 }}>
                {existingUrls.map((url, i) => (
                  <div key={i} className="image-preview-item">
                    <img src={url} alt="" />
                  </div>
                ))}
              </div>
            )}
            <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
              <div>タップして画像を追加</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }} onChange={handleFiles} />
            {images.length > 0 && (
              <div className="image-previews">
                {images.map((img, i) => (
                  <div key={i} className="image-preview-item">
                    <img src={img.previewUrl} alt="" />
                    <button className="image-remove-btn" onClick={() => removeImage(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}
            disabled={saving || uploading}>
            {uploading ? '画像アップロード中...' : saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const errStyle = { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
