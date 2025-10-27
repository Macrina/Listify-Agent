import React, { useState, useEffect } from 'react';
import { getList, updateItem, deleteItem, deleteList } from '../services/api';
import { Trash2, ChevronDown, ChevronRight, CheckCircle, Circle } from 'lucide-react';

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
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

      await updateItem(itemId, {
        status: newStatus,
      });

      // Update local state
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, status: newStatus }
          : item
      ));

      // Don't call onUpdate here to prevent parent re-render and list collapse
      // The local state update is sufficient for the UI
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

  const handleDeleteList = async () => {
    if (!confirm(`Are you sure you want to delete the entire list "${list.list_name || `List #${list.id}`}"? This will delete all items in the list and cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting list:', list.id);
      const result = await deleteList(list.id);
      console.log('Delete result:', result);
      
      if (onUpdate) {
        console.log('Calling onUpdate to refresh lists');
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="list-card">
      <div className="list-header">
        <div className="list-info" onClick={(e) => {
          // Don't toggle if the click originated from a checkbox or any interactive element
          if (e.target.type === 'checkbox' || 
              e.target.closest('.item-checkbox') || 
              e.target.closest('.list-item') ||
              e.target.closest('.items-list')) {
            return;
          }
          setExpanded(!expanded);
        }}>
          <h3>{list.list_name || `List #${list.id}`}</h3>
          <div className="list-meta">
            <span className="source-badge">{list.source_type || 'manual'}</span>
            <span className="item-count">{list.item_count || 0} items</span>
            <span className="date">{formatDate(list.created_at)}</span>
          </div>
        </div>
        <div className="list-actions">
          <button 
            onClick={handleDeleteList}
            className="btn-delete-list"
            title="Delete entire list"
          >
            <Trash2 size={16} />
          </button>
          <button className="expand-btn" onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setExpanded(!expanded);
          }}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div 
          className="list-content"
          onClick={(e) => {
            // Prevent all clicks in the list content from bubbling up to the list header
            e.stopPropagation();
            e.preventDefault();
          }}
        >
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
                  onClick={(e) => {
                    // Prevent all clicks in the list item from bubbling up to the list header
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <div 
                    className="item-checkbox"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling on container
                      e.preventDefault(); // Prevent default behavior
                      handleToggleStatus(item.id, item.status);
                    }}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle size={20} className="checkbox-icon completed" />
                    ) : (
                      <Circle size={20} className="checkbox-icon" />
                    )}
                  </div>

                  <div className="item-content">
                    <div className="item-header">
                      <h4>{item.item_name}</h4>
                    </div>

                    <div className="item-details">
                      <span className="category">{item.category}</span>
                      {item.quantity && <span className="quantity">{item.quantity}</span>}
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </div>

                    {item.notes && <p className="item-notes">Note: {item.notes.endsWith('.') ? item.notes : item.notes + '.'}</p>}
                    {item.explanation && <p className="item-explanation">{item.explanation}</p>}
                  </div>

                  <div className="item-actions">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-delete"
                      title="Delete item"
                    >
                      <Trash2 size={16} />
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
