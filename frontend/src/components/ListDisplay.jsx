import React, { useState, useEffect } from 'react';
import { getList, updateItem, deleteItem } from '../services/api';

function ListDisplay({ list, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadItems();
    }
  }, [expanded, list.id]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getList(list.id);
      setItems(data.items);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (itemId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'completed' : 'active';
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

      await updateItem(itemId, {
        status: newStatus,
        completed_at: completedAt,
      });

      // Update local state
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, status: newStatus, completed_at: completedAt }
          : item
      ));

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item status');
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteItem(itemId);
      setItems(items.filter(item => item.id !== itemId));

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="list-card">
      <div className="list-header" onClick={() => setExpanded(!expanded)}>
        <div className="list-info">
          <h3>List #{list.id}</h3>
          <div className="list-meta">
            <span className="source-badge">{list.source_type}</span>
            <span className="item-count">{list.item_count} items</span>
            <span className="date">{formatDate(list.created_at)}</span>
          </div>
        </div>
        <button className="expand-btn">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="list-content">
          {loading ? (
            <div className="loading">Loading items...</div>
          ) : items.length === 0 ? (
            <p>No items found</p>
          ) : (
            <div className="items-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`list-item ${item.status === 'completed' ? 'completed' : ''}`}
                >
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={item.status === 'completed'}
                      onChange={() => handleToggleStatus(item.id, item.status)}
                    />
                  </div>

                  <div className="item-content">
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

                    {item.completed_at && (
                      <p className="completion-date">
                        Completed: {formatDate(item.completed_at)}
                      </p>
                    )}
                  </div>

                  <div className="item-actions">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-delete"
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ListDisplay;
