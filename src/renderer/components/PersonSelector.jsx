import React, { useState } from 'react';

function PersonSelector({ entries, onSelectPerson }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(entry => {
    const fullName = `${entry.lastName} ${entry.firstName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="person-selector">
      <div className="selector-header">
        <div>
          <h2 className="selector-title">Δημιουργία Βεβαιώσεων</h2>
          <p className="selector-subtitle">Διαλέξτε ένα άτομο για να δημιουργήσετε απόδειξη/βεβαίωση.</p>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Αναζήτηση ατόμου..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="person-list">
        {filteredEntries.map(entry => (
          <div
            key={entry.id}
            className="person-item"
            onClick={() => onSelectPerson(entry)}
          >
            <div className="person-name">{entry.lastName} {entry.firstName}</div>
            <div className="person-info">
              <span>ΑΜΚΑ: {entry.childAmka || 'Δεν έχει καταχωρηθεί'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonSelector;
