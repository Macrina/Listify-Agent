import React, { useState, useEffect } from 'react';
import { analyzeLink, getLists, saveItemsToList, createNewList } from '../services/api';

function LinkAnalyzer({ onSuccess }) {
  const [url, setUrl] = useState('');
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

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Processing URL
      setLoadingStep('Processing URL...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Fetching content
      setLoadingStep('Fetching webpage content...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: AI analysis
      setLoadingStep('Analyzing with AI...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Extracting items
      setLoadingStep('Extracting list items...');
      const response = await analyzeLink(url);
      
      // Step 5: Saving to database
      setLoadingStep('Saving to database...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setResult(response.data);
      setShowSaveOptions(true);
      setNewListName(`List from ${new URL(url).hostname}`);
      
      // Reload existing lists to get the latest
      await loadExistingLists();
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze link');
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
        await createNewList(newListName, result.items, `Items extracted from ${url}`);
      }

      // Call onSuccess to refresh the parent component
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset form
      setUrl('');
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
    setUrl('');
    setResult(null);
    setError(null);
    setShowSaveOptions(false);
    setNewListName('');
    setSelectedListId('');
    setSaveOption('new');
  };

  return (
    <div className="link-analyzer-container">
      <h2>Analyze Web Link</h2>
      <p className="description">
        Enter a website URL to extract list items, products, or structured information. Our AI will analyze the content and extract relevant items.
      </p>

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/shopping-list"
        disabled={loading}
        className="url-input"
      />

      <div className="button-group">
        <button
          onClick={handleAnalyze}
          disabled={!url.trim() || loading}
          className="btn btn-primary"
        >
          {loading ? 'Processing...' : 'Analyze Link'}
        </button>

        {(url || result) && (
          <button onClick={handleClear} className="btn btn-secondary">
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-progress">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h4>Processing Your Link</h4>
            <p>{loadingStep}</p>
          </div>
          <div className="progress-steps">
            <div className={`step ${loadingStep.includes('Processing') ? 'active' : 'completed'}`}>
              <span className="step-number">1</span>
              <span className="step-label">Process</span>
            </div>
            <div className={`step ${loadingStep.includes('Fetching') ? 'active' : loadingStep.includes('Processing') ? 'pending' : 'completed'}`}>
              <span className="step-number">2</span>
              <span className="step-label">Fetch</span>
            </div>
            <div className={`step ${loadingStep.includes('Analyzing') ? 'active' : loadingStep.includes('Fetching') || loadingStep.includes('Processing') ? 'pending' : 'completed'}`}>
              <span className="step-number">3</span>
              <span className="step-label">AI Analysis</span>
            </div>
            <div className={`step ${loadingStep.includes('Extracting') ? 'active' : loadingStep.includes('Analyzing') || loadingStep.includes('Fetching') || loadingStep.includes('Processing') ? 'pending' : 'completed'}`}>
              <span className="step-number">4</span>
              <span className="step-label">Extract</span>
            </div>
            <div className={`step ${loadingStep.includes('Saving') ? 'active' : 'pending'}`}>
              <span className="step-number">5</span>
              <span className="step-label">Save</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result-section">
          <h3>Extraction Results</h3>
          <div className="result-summary">
            <p>Successfully extracted <strong>{result.itemCount}</strong> items from <strong>{new URL(url).hostname}</strong>!</p>
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

export default LinkAnalyzer;