import React, { useState, useCallback } from 'react'
import { X, Maximize2, Camera, Trash2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<string>
  disabled?: boolean
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

export default function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled = false,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1920
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    try {
      setUploading(true)

      // Comprimir imagen
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      const url = await onUpload(compressedFile)
      onChange(url)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }, [maxSizeMB, maxWidthOrHeight, onChange, onUpload])

  const handleRemove = useCallback(() => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange])

  return (
    <div className="space-y-3">
      {/* Preview actual */}
      {value && (
        <div className="relative group">
          <div className="aspect-video w-full overflow-hidden rounded-lg border-2 border-gray-200">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Controles sobre la imagen */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg">
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setZoomedImage(value)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                disabled={disabled}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input de archivo */}
      {!disabled && (
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
            id="image-upload"
          />
          
          <label
            htmlFor="image-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {value ? 'Cambiar imagen' : 'Subir imagen'}
              </>
            )}
          </label>
          
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Modal de zoom */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={zoomedImage}
              alt="Zoom"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}