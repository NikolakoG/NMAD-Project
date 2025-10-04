import React, { useState } from 'react';

function TherapistSchedule({ onBack, therapists, onUpdateTherapists, schedule, onUpdateSchedule }) {
  const weekdays = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
  const therapyTypes = ['Λογοθεραπεία', 'Εργοθεραπεία', 'Θεραπεία Συμπεριφοράς'];
  const [showManageModal, setShowManageModal] = useState(false);
  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistType, setNewTherapistType] = useState('');

  const handleAddTherapist = (day, therapist) => {
    const updatedSchedule = {
      ...schedule,
      [day]: [...schedule[day], therapist]
    };
    onUpdateSchedule(updatedSchedule);
  };

  const handleRemoveTherapist = (day, index) => {
    const updatedSchedule = {
      ...schedule,
      [day]: schedule[day].filter((_, i) => i !== index)
    };
    onUpdateSchedule(updatedSchedule);
  };

  const handleDeleteTherapist = (therapistToDelete) => {
    // Get the name to delete
    const deleteTherapistName = typeof therapistToDelete === 'string' ? therapistToDelete : therapistToDelete.name;

    // Remove from therapists list
    const updatedTherapists = therapists.filter(t => {
      const therapistName = typeof t === 'string' ? t : t.name;
      return therapistName !== deleteTherapistName;
    });
    onUpdateTherapists(updatedTherapists);

    // Remove from all days in the schedule
    const updatedSchedule = {};
    weekdays.forEach(day => {
      updatedSchedule[day] = schedule[day].filter(t => {
        const tName = typeof t === 'string' ? t : t.name;
        return tName !== deleteTherapistName;
      });
    });
    onUpdateSchedule(updatedSchedule);
  };

  const handleAddNewTherapist = () => {
    if (!newTherapistName.trim()) {
      alert('Παρακαλώ εισάγετε όνομα θεραπευτή');
      return;
    }

    if (!newTherapistType) {
      alert('Παρακαλώ επιλέξτε τύπο θεραπείας');
      return;
    }

    const therapistExists = therapists.some(t =>
      (typeof t === 'string' ? t : t.name) === newTherapistName.trim()
    );

    if (therapistExists) {
      alert('Ο θεραπευτής υπάρχει ήδη');
      return;
    }

    const newTherapist = {
      name: newTherapistName.trim(),
      type: newTherapistType
    };

    const updatedTherapists = [...therapists, newTherapist];
    onUpdateTherapists(updatedTherapists);
    setNewTherapistName('');
    setNewTherapistType('');
  };

  return (
    <div className="therapist-schedule">
      <button className="back-button" onClick={onBack}>
        <span className="back-arrow">←</span> Επιστροφή
      </button>

      <h2 className="schedule-title">Πρόγραμμα Θεραπευτών</h2>

      <div className="schedule-grid">
        {weekdays.map(day => (
          <div key={day} className="schedule-day-column">
            <h3 className="day-header">{day}</h3>

            <div className="therapist-list">
              {schedule[day].map((therapist, index) => {
                const therapistName = typeof therapist === 'string' ? therapist : therapist.name;
                const therapistObj = therapists.find(t => (typeof t === 'string' ? t : t.name) === therapistName);
                const therapistType = therapistObj && typeof therapistObj === 'object' ? therapistObj.type : '';

                // Get background color based on therapy type
                let bgColor = '#f8f9fa'; // Default gray
                if (therapistType === 'Λογοθεραπεία') {
                  bgColor = '#e8d5f2'; // Purple
                } else if (therapistType === 'Εργοθεραπεία') {
                  bgColor = '#fff9c4'; // Yellow
                } else if (therapistType === 'Θεραπεία Συμπεριφοράς') {
                  bgColor = '#bbdefb'; // Blue
                }

                return (
                  <div
                    key={index}
                    className="assigned-therapist"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="therapist-name">{therapistName}</span>
                    <button
                      className="remove-therapist-btn"
                      onClick={() => handleRemoveTherapist(day, index)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="add-therapist-section">
              <select
                className="therapist-select"
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedTherapist = therapists.find(t =>
                      (typeof t === 'string' ? t : t.name) === e.target.value
                    );
                    handleAddTherapist(day, selectedTherapist || e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">+ Προσθήκη θεραπευτή</option>
                {therapists.map((therapist, idx) => {
                  const name = typeof therapist === 'string' ? therapist : therapist.name;
                  const type = typeof therapist === 'object' ? therapist.type : '';
                  return (
                    <option key={idx} value={name}>
                      {name} {type && `(${type})`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-secondary manage-therapists-btn"
        onClick={() => setShowManageModal(true)}
      >
        Διαχείριση Θεραπευτών
      </button>

      {showManageModal && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal therapist-manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Διαχείριση Θεραπευτών</h3>
              <button className="close-button" onClick={() => setShowManageModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="therapist-manage-list">
                {therapists.map((therapist, idx) => {
                  const name = typeof therapist === 'string' ? therapist : therapist.name;
                  const type = typeof therapist === 'object' ? therapist.type : '';

                  return (
                    <div key={idx} className="therapist-manage-item">
                      <div className="therapist-manage-info">
                        <span className="therapist-name">{name}</span>
                        {type && <span className="therapist-type-badge">{type}</span>}
                      </div>
                      <button
                        className="btn btn-danger delete-therapist-btn"
                        onClick={() => {
                          if (window.confirm(`Είστε σίγουρος ότι θέλετε να διαγράψετε τον/την ${name}; Θα αφαιρεθεί από όλες τις ημέρες του προγράμματος.`)) {
                            handleDeleteTherapist(therapist);
                          }
                        }}
                      >
                        Διαγραφή
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="add-therapist-form">
                <h4>Προσθήκη Νέου Θεραπευτή</h4>
                <div className="add-therapist-input-group">
                  <input
                    type="text"
                    placeholder="Όνομα θεραπευτή..."
                    value={newTherapistName}
                    onChange={(e) => setNewTherapistName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewTherapist();
                      }
                    }}
                  />
                  <select
                    value={newTherapistType}
                    onChange={(e) => setNewTherapistType(e.target.value)}
                    className="therapy-type-select"
                  >
                    <option value="">Επιλέξτε τύπο θεραπείας...</option>
                    {therapyTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddNewTherapist}
                  >
                    Προσθήκη
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TherapistSchedule;
