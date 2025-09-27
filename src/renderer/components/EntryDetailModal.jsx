import React, { useState } from 'react';

function EntryDetailModal({ entry, onClose, onEdit }) {
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    switch (section) {
      case 'amka':
        setEditData({
          childAmka: entry.childAmka || '',
          parentAmka: entry.parentAmka || ''
        });
        break;
      case 'contact':
        setEditData({
          phone: entry.phone || ''
        });
        break;
      case 'opinion':
        setEditData({
          opinionCode: entry.opinionCode || '',
          opinionValue: entry.opinionValue || ''
        });
        break;
      case 'taxis':
        setEditData({
          taxisUsername: entry.taxisUsername || '',
          taxisPassword: entry.taxisPassword || ''
        });
        break;
      case 'sessions':
        setEditData({
          logo: entry.logo || '',
          ergo: entry.ergo || '',
          psycho: entry.psycho || '',
          mp: entry.mp || '',
          eid: entry.eid || ''
        });
        break;
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handleSaveEdit = () => {
    const updatedEntry = { ...entry, ...editData };
    onEdit(updatedEntry);
    setEditingSection(null);
    setEditData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateSum = (entryData = entry) => {
    const logo = parseInt(entryData.logo) || 0;
    const ergo = parseInt(entryData.ergo) || 0;
    const psycho = parseInt(entryData.psycho) || 0;
    const mp = parseInt(entryData.mp) || 0;
    const eid = parseInt(entryData.eid) || 0;

    const sum = logo + ergo + psycho + mp + eid;
    return sum > 0 ? sum : '-';
  };

  const renderEditableSection = (title, fields, sectionKey) => {
    const isEditing = editingSection === sectionKey;

    return (
      <div className="detail-section">
        <div className="section-header">
          <h4>{title}</h4>
          {!isEditing ? (
            <button
              className="btn btn-secondary btn-sm edit-section-btn"
              onClick={() => handleEditSection(sectionKey)}
            >
              ✎
            </button>
          ) : (
            <div className="edit-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveEdit}
              >
                ✓
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCancelEdit}
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <div className="section-content">
          {fields.map(field => (
            <div key={field.key} className="detail-field">
              <label>{field.label}:</label>
              {isEditing ? (
                <input
                  type={field.type || 'text'}
                  name={field.key}
                  value={editData[field.key] || ''}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                />
              ) : (
                <span>{field.formatter ? field.formatter(entry[field.key]) : (entry[field.key] || '-')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!entry) return null;

  return (
    <div className="modal-overlay">
      <div className="modal detail-modal">
        <div className="modal-header">
          <h3>Λεπτομέρειες Εγγραφής - {entry.name}</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-columns">
            <div className="form-column">
              <div className="form-section">
                <h4>Πληροφορίες Μαθητή</h4>
                
                {renderEditableSection(
                  'Στοιχεία Επικοινωνίας',
                  [
                    { key: 'phone', label: 'Τηλέφωνο', placeholder: 'Εισάγετε αριθμό τηλεφώνου' }
                  ],
                  'contact'
                )}

                {renderEditableSection(
                  'Στοιχεία ΑΜΚΑ',
                  [
                    { key: 'childAmka', label: 'ΑΜΚΑ Μαθητή', placeholder: 'Εισάγετε ΑΜΚΑ Μαθητή' },
                    { key: 'parentAmka', label: 'ΑΜΚΑ Γονέα', placeholder: 'Εισάγετε ΑΜΚΑ γονέα' }
                  ],
                  'amka'
                )}

                {renderEditableSection(
                  'Στοιχεία Taxis net',
                  [
                    { key: 'taxisUsername', label: 'Username', placeholder: 'Εισάγετε username' },
                    { key: 'taxisPassword', label: 'Password', type: 'password', placeholder: 'Εισάγετε password' }
                  ],
                  'taxis'
                )}
              </div>
            </div>

            <div className="form-column">
              <div className="form-section">
                <h4>Πληροφορίες Γνωμάτευσης</h4>
                
                {renderEditableSection(
                  'Στοιχεία Γνωμάτευσης',
                  [
                    { key: 'opinionCode', label: 'Κωδικός Γνωμάτευσης', placeholder: 'Εισάγετε κωδικό γνωμάτευσης' },
                    { 
                      key: 'opinionValue', 
                      label: 'Αξία Γνωμάτευσης', 
                      placeholder: 'Εισάγετε αξία γνωμάτευσης',
                      formatter: (value) => value ? `${value} €` : '- €'
                    }
                  ],
                  'opinion'
                )}

                <div className="detail-section">
                  <div className="section-header">
                    <h4>Συνεδριάσεις</h4>
                    {editingSection !== 'sessions' ? (
                      <button
                        className="btn btn-secondary btn-sm edit-section-btn"
                        onClick={() => handleEditSection('sessions')}
                      >
                        ✎
                      </button>
                    ) : (
                      <div className="edit-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveEdit}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleCancelEdit}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="section-content">
                    <div className="sessions-sum">
                      <span>Άθροισμα συνεδριάσεων: {calculateSum()}</span>
                    </div>
                    <div className="sessions-table">
                      <table>
                        <thead>
                          <tr>
                            <th>ΛΟΓΟ</th>
                            <th>ΕΡΓΟ</th>
                            <th>ΨΥΧΟ</th>
                            <th>ΜΠ</th>
                            <th>ΕΙΔ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              {editingSection === 'sessions' ? (
                                <input
                                  type="number"
                                  name="logo"
                                  value={editData.logo || ''}
                                  onChange={handleInputChange}
                                  placeholder="0"
                                />
                              ) : (
                                entry.logo || '-'
                              )}
                            </td>
                            <td>
                              {editingSection === 'sessions' ? (
                                <input
                                  type="number"
                                  name="ergo"
                                  value={editData.ergo || ''}
                                  onChange={handleInputChange}
                                  placeholder="0"
                                />
                              ) : (
                                entry.ergo || '-'
                              )}
                            </td>
                            <td>
                              {editingSection === 'sessions' ? (
                                <input
                                  type="number"
                                  name="psycho"
                                  value={editData.psycho || ''}
                                  onChange={handleInputChange}
                                  placeholder="0"
                                />
                              ) : (
                                entry.psycho || '-'
                              )}
                            </td>
                            <td>
                              {editingSection === 'sessions' ? (
                                <input
                                  type="number"
                                  name="mp"
                                  value={editData.mp || ''}
                                  onChange={handleInputChange}
                                  placeholder="0"
                                />
                              ) : (
                                entry.mp || '-'
                              )}
                            </td>
                            <td>
                              {editingSection === 'sessions' ? (
                                <input
                                  type="number"
                                  name="eid"
                                  value={editData.eid || ''}
                                  onChange={handleInputChange}
                                  placeholder="0"
                                />
                              ) : (
                                entry.eid || '-'
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntryDetailModal;