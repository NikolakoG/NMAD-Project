import React, { useState, useMemo } from 'react';
import formatName from '../../utils/formatName.mjs';

function EntryTable({ entries, onEdit, onDelete, onView }) {
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRowClass = (endingDate) => {
    const today = new Date();
    const endDate = new Date(endingDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 5) {
      return 'expiring-critical';
    } else if (diffDays <= 10) {
      return 'expiring-soon';
    }
    return '';
  };

  const getDaysUntilExpiry = (endingDate) => {
    const today = new Date();
    const endDate = new Date(endingDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Έληξε πριν ${Math.abs(diffDays)} ημέρες`;
    } else if (diffDays === 0) {
      return 'Λήγει σήμερα';
    } else if (diffDays === 1) {
      return 'Λήγει αύριο';
    } else {
      return `${diffDays} ημέρες απομένουν`;
    }
  };

  const sortedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return entries;
    
    const sortableEntries = [...entries];
    sortableEntries.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = formatName(a).toLowerCase();
          bValue = formatName(b).toLowerCase();
          break;
        case 'startingDate':
          aValue = new Date(a.startingDate);
          bValue = new Date(b.startingDate);
          break;
        case 'endingDate':
          aValue = new Date(a.endingDate);
          bValue = new Date(b.endingDate);
          break;
        case 'status':
          // Sort by days until expiry (numeric)
          const todayForSort = new Date();
          aValue = Math.ceil((new Date(a.endingDate) - todayForSort) / (1000 * 60 * 60 * 24));
          bValue = Math.ceil((new Date(b.endingDate) - todayForSort) / (1000 * 60 * 60 * 24));
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortableEntries;
  }, [entries, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortChevron = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th className="sortable" onClick={() => handleSort('name')}>
            Ονοματεπώνυμο{getSortChevron('name')}
          </th>
          <th className="sortable" onClick={() => handleSort('startingDate')}>
            Ημερομηνία Έναρξης{getSortChevron('startingDate')}
          </th>
          <th className="sortable" onClick={() => handleSort('endingDate')}>
            Ημερομηνία Λήξης{getSortChevron('endingDate')}
          </th>
          <th className="sortable" onClick={() => handleSort('status')}>
            Κατάσταση{getSortChevron('status')}
          </th>
          <th>Ενέργειες</th>
        </tr>
      </thead>
      <tbody>
        {sortedEntries.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
              Δεν βρέθηκαν καταχωρήσεις. Κάντε κλικ στο "+" για να ξεκινήσετε.
            </td>
          </tr>
        ) : (
          sortedEntries.map(entry => (
            <tr key={entry.id} className={getRowClass(entry.endingDate)}>
              <td>
                <span
                  className="clickable-name"
                  onClick={() => onView(entry)}
                  title="Κάντε κλικ για περισσότερες πληροφορίες"
                >
                  {formatName(entry)}
                </span>
              </td>
              <td>{formatDate(entry.startingDate)}</td>
              <td>{formatDate(entry.endingDate)}</td>
              <td>{getDaysUntilExpiry(entry.endingDate)}</td>
              <td className="actions">
                <button 
                  className="btn btn-secondary btn-icon"
                  onClick={() => onEdit(entry)}
                  title="Επεξεργασία"
                >
                  ✎
                </button>
                <button 
                  className="btn btn-danger btn-icon"
                  onClick={() => {
                    if (window.confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή την καταχώρηση;')) {
                      onDelete(entry.id);
                    }
                  }}
                  title="Διαγραφή"
                >
                  ×
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default EntryTable;