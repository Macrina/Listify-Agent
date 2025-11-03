import React, { useState, useEffect } from 'react';
import { analyzeText, getLists, saveItemsToList, createNewList } from '../services/api';

function TextAnalyzer({ onSuccess }) {
  const [text, setText] = useState('');
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
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Processing text
      setLoadingStep('Processing text...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: AI analysis
      setLoadingStep('Analyzing with AI...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Extracting items
      setLoadingStep('Extracting list items...');
      const response = await analyzeText(text);
      
      // analyzeText returns response.data, which is: { success, data: { items, itemCount }, message }
      // Check if response is successful but has no items
      if (response.success && response.data && response.data.itemCount === 0) {
        setResult(response.data);
        setShowSaveOptions(false); // Don't show save options for empty results
        setError(null); // Clear any previous errors
        return; // Exit early - no items to save
      }
      
      // Step 4: Saving to database
      setLoadingStep('Saving to database...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // response.data contains { items, itemCount, listId, etc. }
      setResult(response.data);
      setShowSaveOptions(true);
      setNewListName('Text Analysis List');
      
      // Reload existing lists to get the latest
      await loadExistingLists();
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze text');
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
        await createNewList(newListName, result.items, `Items extracted from text`);
      }

      // Call onSuccess to refresh the parent component
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset form
      setText('');
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
    setText('');
    setResult(null);
    setError(null);
    setShowSaveOptions(false);
    setNewListName('');
    setSelectedListId('');
    setSaveOption('new');
  };

  return (
    <div className="text-analyzer-container">
      <div className="analyzer-section">
        <h2>Analyze Text</h2>
        <p className="description">
          Paste or type text containing lists, tasks, or notes. Our AI will extract and structure the information.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here...&#10;&#10;Example:&#10;- Buy groceries&#10;- Call dentist&#10;- Finish project report by Friday"
          disabled={loading}
          rows={10}
          className="text-input"
        />

        <div className="button-group">
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || loading}
            className="btn btn-primary"
          >
            {loading ? 'Processing...' : 'Analyze Text'}
          </button>

          {(text || result) && (
            <button onClick={handleClear} className="btn btn-secondary">
              Clear
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-progress">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <h4>Processing Your Text</h4>
              <p>{loadingStep}</p>
            </div>
            <div className="progress-steps">
              <div className={`step ${loadingStep.includes('Processing') ? 'active' : 'completed'}`}>
                <span className="step-number">1</span>
                <span className="step-label">Process</span>
              </div>
              <div className={`step ${loadingStep.includes('Analyzing') ? 'active' : loadingStep.includes('Processing') ? 'pending' : 'completed'}`}>
                <span className="step-number">2</span>
                <span className="step-label">AI Analysis</span>
              </div>
              <div className={`step ${loadingStep.includes('Extracting') ? 'active' : loadingStep.includes('Analyzing') || loadingStep.includes('Processing') ? 'pending' : 'completed'}`}>
                <span className="step-number">3</span>
                <span className="step-label">Extract</span>
              </div>
              <div className={`step ${loadingStep.includes('Saving') ? 'active' : 'pending'}`}>
                <span className="step-number">4</span>
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
      </div>

      {result && (
        <div className="result-section">
          <h3>Extraction Results</h3>
          {result.itemCount === 0 ? (
            <div className="result-summary">
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                {result.message || 'No list items were found in the text. Try providing more structured text or a clearer list format.'}
              </p>
              <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
                💡 Tip: Try using bullet points, numbered lists, or clear item descriptions.
              </p>
            </div>
          ) : (
            <>
              <div className="result-summary">
                <p>Successfully extracted <strong>{result.itemCount}</strong> items!</p>
              </div>

              <div className="extracted-items">
                {result.items && result.items.map((item, index) => (
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
            </>
          )}
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

export default TextAnalyzer;
