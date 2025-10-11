import React, { useState } from 'react';
import { getPublicHolidays as getHolidaysUtil } from '../utils/holidays';

function NonWorkingDays({ customNonWorkingDays, onUpdateCustomNonWorkingDays }) {
  const [newDate, setNewDate] = useState('');
  const currentYear = new Date().getFullYear();

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getGreekWeekday = (date) => {
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[date.getDay()];
  };

  const handleAddCustomDate = () => {
    if (!newDate) {
      alert('Παρακαλώ επιλέξτε ημερομηνία');
      return;
    }

    // Check if date already exists
    if (customNonWorkingDays.includes(newDate)) {
      alert('Η ημερομηνία υπάρχει ήδη');
      return;
    }

    const updatedDays = [...customNonWorkingDays, newDate].sort();
    onUpdateCustomNonWorkingDays(updatedDays);
    setNewDate('');
  };

  const handleRemoveCustomDate = (dateToRemove) => {
    const updatedDays = customNonWorkingDays.filter(d => d !== dateToRemove);
    onUpdateCustomNonWorkingDays(updatedDays);
  };

  // Get all public holidays (fixed and moving)
  const publicHolidays = getHolidaysUtil(currentYear).map(h => ({
    ...h,
    dateString: formatDate(h.date)
  }));

  return (
    <div className="non-working-days">
      <h2 className="non-working-title">Μέρες μη λειτουργίας</h2>

      <div className="non-working-columns">
        {/* Public Holidays Column */}
        <div className="non-working-column">
          <h3 className="column-title">Δημόσιες Αργίες {currentYear}</h3>
          <p className="column-subtitle">Αυτές οι ημέρες εξαιρούνται αυτόματα</p>

          <div className="holidays-list">
            {publicHolidays.map((holiday, index) => (
              <div key={index} className="holiday-item">
                <div className="holiday-info">
                  <span className="holiday-name">{holiday.name}</span>
                  <span className="holiday-date">
                    {holiday.dateString} ({getGreekWeekday(holiday.date)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Non-Working Days Column */}
        <div className="non-working-column">
          <h3 className="column-title">Επιπλέον Μέρες Μη Λειτουργίας</h3>
          <p className="column-subtitle">Προσθέστε ημέρες που το κέντρο δεν λειτουργεί</p>

          <div className="add-date-section">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="date-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleAddCustomDate}
            >
              Προσθήκη
            </button>
          </div>

          <div className="custom-days-list">
            {customNonWorkingDays.length === 0 ? (
              <p className="no-custom-days">Δεν έχουν προστεθεί επιπλέον ημέρες</p>
            ) : (
              customNonWorkingDays.map((dateStr, index) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return (
                  <div key={index} className="custom-day-item">
                    <div className="custom-day-info">
                      <span className="custom-day-date">
                        {formatDate(date)} ({getGreekWeekday(date)})
                      </span>
                    </div>
                    <button
                      className="remove-day-btn"
                      onClick={() => handleRemoveCustomDate(dateStr)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NonWorkingDays;
