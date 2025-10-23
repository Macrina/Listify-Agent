import React, { useState } from 'react';
import { analyzeText } from '../services/api';

function TextAnalyzer({ onSuccess }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeText(text);
      setResult(response.data);
      setText('');

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze text');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
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
            {loading ? 'Analyzing...' : 'Analyze Text'}
          </button>

          {(text || result) && (
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

export default TextAnalyzer;
