import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { encryptFile, isImageFile, decryptFile } from '../utils/fileEncryption';
import { uploadPhoto, listPhotos, downloadPhoto } from '../services/photoService';

function Dashboard() {
  const navigate = useNavigate();
  const { user, masterKey, token, logout } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, photo: null, imageUrl: null });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  if (!user || !masterKey || !token) {
    navigate('/signin');
    return null;
  }

  // Fetch photos on mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const photoList = await listPhotos(token);
      setPhotos(photoList || []);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      // Don't show error for empty list
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setError('');
    setSuccess('');
    setUploadProgress(0);

    // Validate file type
    if (!isImageFile(file)) {
      setError('Please upload an image file (JPEG, PNG, GIF, WebP, SVG)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Encrypt file with master key
      console.log('Encrypting file...');
      const { encryptedBlob, iv, filename } = await encryptFile(file, masterKey);
      console.log('File encrypted successfully');

      // Step 2: Upload encrypted file
      console.log('Uploading encrypted file...');
      await uploadPhoto(
        encryptedBlob,
        filename,
        user,
        token,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      console.log('Upload successful!');
      setSuccess(`${filename} uploaded successfully!`);
      setUploadProgress(100);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh photo list
      fetchPhotos();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleDownload = async (filename) => {
    setDownloadingFile(filename);
    setError('');

    try {
      // Step 1: Fetch encrypted file from server
      console.log('Downloading encrypted file:', filename);
      const encryptedData = await downloadPhoto(filename, token);
      console.log('Encrypted file downloaded, size:', encryptedData.byteLength, 'bytes');

      // Step 2: Decrypt file with master key
      console.log('Decrypting file with master key...');
      const decryptedData = await decryptFile(encryptedData, masterKey);
      console.log('File decrypted successfully, size:', decryptedData.byteLength, 'bytes');
      
      // Step 3: Determine file type from filename extension
      const extension = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      
      // Step 4: Create blob from decrypted data
      const blob = new Blob([decryptedData], { type: mimeType });
      
      // Step 5: Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('File downloaded successfully');
      setSuccess(`${filename} downloaded and decrypted successfully!`);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download file. Please try again.');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePreview = async (photo) => {
    setLoadingPreview(true);
    setPreviewModal({ isOpen: true, photo, imageUrl: null });
    setError('');

    try {
      // Fetch encrypted file from server
      console.log('Fetching encrypted file for preview:', photo.filename);
      const encryptedData = await downloadPhoto(photo.filename, token);

      // Decrypt file with master key
      console.log('Decrypting file...');
      const decryptedData = await decryptFile(encryptedData, masterKey);

      // Determine file type
      const extension = photo.filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      const mimeType = mimeTypes[extension] || 'image/jpeg';

      // Create blob and URL
      const blob = new Blob([decryptedData], { type: mimeType });
      const imageUrl = window.URL.createObjectURL(blob);

      setPreviewModal({ isOpen: true, photo, imageUrl });
      console.log('Preview ready');
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message || 'Failed to load preview. Please try again.');
      setPreviewModal({ isOpen: false, photo: null, imageUrl: null });
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewModal.imageUrl) {
      window.URL.revokeObjectURL(previewModal.imageUrl);
    }
    setPreviewModal({ isOpen: false, photo: null, imageUrl: null });
  };

  const downloadFromPreview = () => {
    if (previewModal.imageUrl && previewModal.photo) {
      const link = document.createElement('a');
      link.href = previewModal.imageUrl;
      link.download = previewModal.photo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess(`${previewModal.photo.filename} downloaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-logo gradient-text">🔒 Protected Pixels</h1>
          
          <div className="dashboard-user-info">
            <span className="dashboard-username">👤 {user}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Upload Section */}
          <section className="upload-section">
            <h2 className="upload-title">Upload Encrypted Photos</h2>
            <p className="upload-subtitle">
              🔐 Files are encrypted on your device before upload
            </p>

            {/* Drop Zone */}
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={uploading}
              />

              <div className="upload-icon">☁️</div>
              
              {uploading ? (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar">
                    <div 
                      className="upload-progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="upload-progress-text">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : (
                <>
                  <p className="upload-text">Drag and drop to upload</p>
                  <button type="button" className="btn btn-primary upload-button">
                    Upload
                  </button>
                  <p className="upload-hint">
                    PNG, JPG, GIF, WebP (max. 10MB)
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message upload-error">
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="success-message">
                ✓ {success}
              </div>
            )}
          </section>

          {/* Uploaded Files Section */}
          <section className="files-section">
            <h2 className="files-title">Uploaded Files</h2>
            
            {loadingPhotos ? (
              <div className="files-loading">
                <div className="spinner-large"></div>
                <p>Loading files...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="files-empty-state">
                <div className="files-empty-icon">📁</div>
                <p className="files-empty-text">No files yet</p>
                <p className="files-empty-hint">
                  Upload your first encrypted photo to get started
                </p>
              </div>
            ) : (
              <div className="files-table-container">
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>File Name</th>
                      <th>Uploaded By</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {photos.map((photo) => (
                      <tr key={photo.id} className="file-row">
                        <td className="file-date">{formatDate(photo.createdAt)}</td>
                        <td className="file-name">
                          <span className="file-icon">📄</span>
                          {photo.filename}
                        </td>
                        <td className="file-owner">
                          <span className="file-avatar">👤</span>
                          {photo.ownerUsername}
                        </td>
                        <td className="file-size">{formatFileSize(photo.fileSize)}</td>
                        <td className="file-actions">
                          <button
                            onClick={() => handlePreview(photo)}
                            className="btn-preview"
                            title="Preview file"
                          >
                            👁️ Preview
                          </button>
                          <button
                            onClick={() => handleDownload(photo.filename)}
                            disabled={downloadingFile === photo.filename}
                            className="btn-download"
                            title="Download file"
                          >
                            {downloadingFile === photo.filename ? (
                              <>
                                <span className="spinner-small"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                ⬇️ Download
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewModal.photo?.filename}</h3>
              <button onClick={closePreview} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              {loadingPreview ? (
                <div className="modal-loading">
                  <div className="spinner-large"></div>
                  <p>Decrypting image...</p>
                </div>
              ) : previewModal.imageUrl ? (
                <img 
                  src={previewModal.imageUrl} 
                  alt={previewModal.photo?.filename}
                  className="preview-image"
                />
              ) : null}
            </div>
            <div className="modal-footer">
              <button onClick={downloadFromPreview} className="btn btn-primary">
                ⬇️ Download
              </button>
              <button onClick={closePreview} className="btn btn-ghost">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
