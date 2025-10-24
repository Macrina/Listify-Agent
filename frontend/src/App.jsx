import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import TextAnalyzer from './components/TextAnalyzer';
import LinkAnalyzer from './components/LinkAnalyzer';
import ListDisplay from './components/ListDisplay';
import Statistics from './components/Statistics';
import { getLists, getStatistics } from './services/api';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [lists, setLists] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load lists and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading data...');
    setLoading(true);
    try {
      const [listsData, statsData] = await Promise.all([
        getLists(),
        getStatistics(),
      ]);
      console.log('Loaded lists:', listsData);
      setLists(listsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleListCreated = () => {
    // Reload data when a new list is created
    loadData();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Listify Agent</h1>
        <p className="subtitle">AI-Powered List Extraction from Images & Text</p>
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          Upload Image
        </button>
        <button
          className={activeTab === 'text' ? 'active' : ''}
          onClick={() => setActiveTab('text')}
        >
          Analyze Text
        </button>
        <button
          className={activeTab === 'link' ? 'active' : ''}
          onClick={() => setActiveTab('link')}
        >
          Analyze Link
        </button>
        <button
          className={activeTab === 'lists' ? 'active' : ''}
          onClick={() => setActiveTab('lists')}
        >
          My Lists ({lists.length})
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'upload' && (
          <ImageUploader onSuccess={handleListCreated} />
        )}

        {activeTab === 'text' && (
          <TextAnalyzer onSuccess={handleListCreated} />
        )}

        {activeTab === 'link' && (
          <LinkAnalyzer onSuccess={handleListCreated} />
        )}

        {activeTab === 'lists' && (
          <div className="lists-container">
            {loading ? (
              <div className="loading">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="empty-state">
                <p>No lists yet. Upload an image or analyze some text to get started!</p>
              </div>
            ) : (
              lists.map((list) => (
                <ListDisplay key={list.id} list={list} onUpdate={loadData} />
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <Statistics stats={stats} loading={loading} />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI GPT-4 Vision & AgentDB</p>
      </footer>
    </div>
  );
}

export default App;
