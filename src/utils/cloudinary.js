const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const uploadImage = async (file) => {
  if (!CLOUD_NAME || CLOUD_NAME === 'your_cloud_name') {
    throw new Error('Cloudinary cloud name が設定されていません。.env ファイルを確認してください。')
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'my-health-diary')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('画像のアップロードに失敗しました')
  const data = await res.json()
  return data.secure_url
}

export const uploadImages = async (files) => {
  return Promise.all(Array.from(files).map(uploadImage))
}
