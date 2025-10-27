import React from 'react';

function Statistics({ stats, loading }) {
  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="empty-state">No statistics available</div>;
  }

  return (
    <div className="statistics-container">
      <h2>Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Lists</h3>
          <div className="stat-value">{stats.total_lists || 0}</div>
        </div>

        <div className="stat-card">
          <h3>Total Items</h3>
          <div className="stat-value">{stats.total_items || 0}</div>
        </div>

        <div className="stat-card">
          <h3>Active Items</h3>
          <div className="stat-value">{stats.active_items || 0}</div>
        </div>

        <div className="stat-card">
          <h3>Completed Items</h3>
          <div className="stat-value">{stats.completed_items || 0}</div>
        </div>
      </div>

      {stats.categories && stats.categories.length > 0 && (
        <div className="categories-section">
          <h3>Items by Category</h3>
          <div className="categories-list">
            {stats.categories.map((cat) => (
              <div key={cat.category} className="category-item">
                <span className="category-name">{cat.category}</span>
                <span className="category-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;
