import React, { useState, useEffect } from 'react';
import { uploadImage, getLists, saveItemsToList, createNewList } from '../services/api';

function ImageUploader({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveOption, setSaveOption] = useState('new'); // 'new' or 'existing'
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [existingLists, setExistingLists] = useState([]);

  // Load existing lists when component mounts
  useEffect(() => {
    loadExistingLists();
  }, []);

  const loadExistingLists = async () => {
    try {
      const lists = await getLists();
      setExistingLists(lists);
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

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
      // Step 1: Uploading image
      setLoadingStep('Uploading image...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
      
      // Step 2: Processing with AI
      setLoadingStep('Analyzing image with AI...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for UX
      
      // Step 3: Extracting list items
      setLoadingStep('Extracting list items...');
      const response = await uploadImage(file);
      
      // Step 4: Finalizing
      setLoadingStep('Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX
      
      setResult(response.data);
      setShowSaveOptions(true);
      setNewListName(`List from ${file.name}`);
      
      // Reload existing lists to get the latest
      await loadExistingLists();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload and analyze image');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleSave = async () => {
    try {
      if (saveOption === 'new' && !newListName.trim()) {
        setError('Please enter a name for the new list');
        return;
      }
      
      if (saveOption === 'existing' && !selectedListId) {
        setError('Please select an existing list');
        return;
      }

      setLoading(true);
      setError(null);

      if (saveOption === 'existing') {
        // Save to existing list
        await saveItemsToList(selectedListId, result.items);
      } else {
        // Create new list with custom name
        await createNewList(newListName, result.items, `Items extracted from image`);
      }

      // Call onSuccess to refresh the parent component
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset form
      setFile(null);
      setPreview(null);
      setResult(null);
      setShowSaveOptions(false);
      setNewListName('');
      setSelectedListId('');
      setSaveOption('new');
      
    } catch (error) {
      console.error('Error saving items:', error);
      setError('Failed to save items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowSaveOptions(false);
    setNewListName('');
    setSelectedListId('');
    setSaveOption('new');
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
            {loading ? 'Processing...' : 'Upload & Analyze'}
          </button>

          {(file || result) && (
            <button onClick={handleClear} className="btn btn-secondary">
              Clear
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-progress">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <h4>Processing Your Image</h4>
              <p>{loadingStep}</p>
            </div>
            <div className="progress-steps">
              <div className={`step ${loadingStep.includes('Uploading') ? 'active' : 'completed'}`}>
                <span className="step-number">1</span>
                <span className="step-label">Upload</span>
              </div>
              <div className={`step ${loadingStep.includes('Analyzing') ? 'active' : loadingStep.includes('Uploading') ? 'pending' : 'completed'}`}>
                <span className="step-number">2</span>
                <span className="step-label">AI Analysis</span>
              </div>
              <div className={`step ${loadingStep.includes('Extracting') ? 'active' : loadingStep.includes('Analyzing') || loadingStep.includes('Uploading') ? 'pending' : 'completed'}`}>
                <span className="step-number">3</span>
                <span className="step-label">Extract</span>
              </div>
              <div className={`step ${loadingStep.includes('Saving') ? 'active' : loadingStep.includes('Extracting') || loadingStep.includes('Analyzing') || loadingStep.includes('Uploading') ? 'pending' : 'completed'}`}>
                <span className="step-number">4</span>
                <span className="step-label">Save</span>
              </div>
              <div className={`step ${loadingStep.includes('Finalizing') ? 'active' : 'pending'}`}>
                <span className="step-number">5</span>
                <span className="step-label">Done</span>
              </div>
            </div>
          </div>
        )}

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
                </div>
                <div className="item-details">
                  <span className="category">{item.category}</span>
                  {item.quantity && <span className="quantity">{item.quantity}</span>}
                </div>
                {item.notes && <p className="item-notes">Note: {item.notes.endsWith('.') ? item.notes : item.notes + '.'}</p>}
                {item.explanation && <p className="item-explanation">{item.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaveOptions && result && (
        <div className="save-options-section">
          <h3>Save Items</h3>
          <p>Choose how you'd like to save these {result.itemCount} items:</p>
          
          <div className="save-options">
            <div className="save-option">
              <label>
                <input
                  type="radio"
                  name="saveOption"
                  value="new"
                  checked={saveOption === 'new'}
                  onChange={(e) => setSaveOption(e.target.value)}
                />
                <span>Create a new list</span>
              </label>
              {saveOption === 'new' && (
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  className="list-name-input"
                />
              )}
            </div>
            
            <div className="save-option">
              <label>
                <input
                  type="radio"
                  name="saveOption"
                  value="existing"
                  checked={saveOption === 'existing'}
                  onChange={(e) => setSaveOption(e.target.value)}
                />
                <span>Add to existing list</span>
              </label>
              {saveOption === 'existing' && (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="list-select"
                >
                  <option value="">Select a list...</option>
                  {existingLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.list_name} ({list.item_count || 0} items)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="save-actions">
            <button onClick={handleSave} className="btn btn-primary">
              Save Items
            </button>
            <button onClick={handleClear} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
