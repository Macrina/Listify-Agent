import React, { useState } from 'react';
import { uploadImage } from '../services/api';

function ImageUploader({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadImage(file);
      setResult(response.data);
      setFile(null);
      setPreview(null);

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload and analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="uploader-container">
      <div className="upload-section">
        <h2>Upload Image</h2>
        <p className="description">
          Upload an image containing a list, tasks, or notes. Our AI will extract and structure the information.
        </p>

        <div className="file-input-wrapper">
          <input
            type="file"
            id="image-input"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <label htmlFor="image-input" className="file-input-label">
            {file ? file.name : 'Choose an image'}
          </label>
        </div>

        {preview && (
          <div className="preview-section">
            <h3>Preview:</h3>
            <img src={preview} alt="Preview" className="image-preview" />
          </div>
        )}

        <div className="button-group">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn btn-primary"
          >
            {loading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>

          {(file || result) && (
            <button onClick={handleClear} className="btn btn-secondary">
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="result-section">
          <h3>Extraction Results</h3>
          <div className="result-summary">
            <p>Successfully extracted <strong>{result.itemCount}</strong> items!</p>
          </div>

          <div className="extracted-items">
            {result.items.map((item, index) => (
              <div key={index} className="extracted-item">
                <div className="item-header">
                  <h4>{item.item_name}</h4>
                  <span className={`priority-badge priority-${item.priority}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="item-details">
                  <span className="category">{item.category}</span>
                  {item.quantity && <span className="quantity">{item.quantity}</span>}
                </div>
                {item.notes && <p className="item-notes">{item.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
