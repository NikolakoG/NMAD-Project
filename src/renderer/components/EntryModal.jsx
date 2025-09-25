import React, { useState, useEffect } from 'react';

function EntryModal({ entry, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    startingDate: '',
    endingDate: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        name: entry.name,
        startingDate: entry.startingDate,
        endingDate: entry.endingDate
      });
    } else {
      setFormData({
        name: '',
        startingDate: '',
        endingDate: ''
      });
    }
  }, [entry]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Παρακαλώ εισάγετε ένα όνομα');
      return;
    }
    
    if (!formData.startingDate || !formData.endingDate) {
      alert('Παρακαλώ εισάγετε και τις δύο ημερομηνίες έναρξης και λήξης');
      return;
    }
    
    if (new Date(formData.startingDate) > new Date(formData.endingDate)) {
      alert('Η ημερομηνία έναρξης δεν μπορεί να είναι μετά την ημερομηνία λήξης');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{entry ? 'Επεξεργασία Εγγραφής' : 'Προσθήκη Νέας Εγγραφής'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Όνομα:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Εισάγετε όνομα εγγραφής"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startingDate">Ημερομηνία Έναρξης:</label>
            <input
              type="date"
              id="startingDate"
              name="startingDate"
              value={formData.startingDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endingDate">Ημερομηνία Λήξης:</label>
            <input
              type="date"
              id="endingDate"
              name="endingDate"
              value={formData.endingDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Ακύρωση
            </button>
            <button type="submit" className="btn btn-primary">
              {entry ? 'Ενημέρωση' : 'Προσθήκη'} Εγγραφής
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EntryModal;