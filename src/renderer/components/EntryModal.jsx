import React, { useState, useEffect } from 'react';

function EntryModal({ entry, onSave, onClose }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    startingDate: '',
    endingDate: '',
    childAmka: '',
    parentAmka: '',
    phone: '',
    opinionCode: '',
    opinionValue: '',
    taxisUsername: '',
    taxisPassword: '',
    logo: '',
    ergo: '',
    psycho: '',
    mp: '',
    eid: '',
    comments: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        firstName: entry.firstName || '',
        lastName: entry.lastName || '',
        startingDate: entry.startingDate || '',
        endingDate: entry.endingDate || '',
        childAmka: entry.childAmka || '',
        parentAmka: entry.parentAmka || '',
        phone: entry.phone || '',
        opinionCode: entry.opinionCode || '',
        opinionValue: entry.opinionValue || '',
        taxisUsername: entry.taxisUsername || '',
        taxisPassword: entry.taxisPassword || '',
        logo: entry.logo || '',
        ergo: entry.ergo || '',
        psycho: entry.psycho || '',
        mp: entry.mp || '',
        eid: entry.eid || '',
        comments: entry.comments || ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        startingDate: '',
        endingDate: '',
        childAmka: '',
        parentAmka: '',
        phone: '',
        opinionCode: '',
        opinionValue: '',
        taxisUsername: '',
        taxisPassword: '',
        logo: '',
        ergo: '',
        psycho: '',
        mp: '',
        eid: '',
        comments: ''
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

  const calculateSum = () => {
    const logo = parseInt(formData.logo) || 0;
    const ergo = parseInt(formData.ergo) || 0;
    const psycho = parseInt(formData.psycho) || 0;
    const mp = parseInt(formData.mp) || 0;
    const eid = parseInt(formData.eid) || 0;

    const sum = logo + ergo + psycho + mp + eid;
    return sum > 0 ? sum : '-';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Παρακαλώ εισάγετε όνομα και επώνυμο');
      return;
    }

    if (!formData.startingDate || !formData.endingDate) {
      alert('Παρακαλώ εισάγετε και τις δύο ημερομηνίες έναρξης και λήξης');
      return;
    }

    if (!formData.phone.trim()) {
      alert('Παρακαλώ εισάγετε αριθμό τηλεφώνου');
      return;
    }

    if (!formData.logo.trim() || !formData.ergo.trim() || !formData.psycho.trim() || !formData.mp.trim() || !formData.eid.trim()) {
      alert('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία (ΛΟΓΟ, ΕΡΓΟ, ΨΥΧΟ, ΜΠ, ΕΙΔ)');
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
        <div className="modal-header">
          <h3>{entry ? 'Επεξεργασία Εγγραφής' : 'Προσθήκη Νέας Εγγραφής'}</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
          <div className="form-columns">
            <div className="form-column">
              <div className="form-section">
                <h4>Πληροφορίες Μαθητή</h4>

                <div className="form-group">
                  <div className="small-fields-row">
                    <div className="small-field">
                      <label htmlFor="firstName">Όνομα: *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Εισάγετε όνομα"
                        required
                      />
                    </div>
                    <div className="small-field">
                      <label htmlFor="lastName">Επώνυμο: *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Εισάγετε επώνυμο"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Τηλέφωνο: *</label>
                  <input
                    type="number"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε αριθμό τηλεφώνου"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="childAmka">ΑΜΚΑ Μαθητή:</label>
                  <input
                    type="number"
                    id="childAmka"
                    name="childAmka"
                    value={formData.childAmka}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε ΑΜΚΑ μαθητή"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="parentAmka">ΑΜΚΑ Γονέα:</label>
                  <input
                    type="number"
                    id="parentAmka"
                    name="parentAmka"
                    value={formData.parentAmka}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε ΑΜΚΑ γονέα"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taxisUsername">Username (TaxisNet):</label>
                  <input
                    type="text"
                    id="taxisUsername"
                    name="taxisUsername"
                    value={formData.taxisUsername}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taxisPassword">Password (TaxisNet):</label>
                  <input
                    type="password"
                    id="taxisPassword"
                    name="taxisPassword"
                    value={formData.taxisPassword}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε password"
                  />
                </div>
              </div>
            </div>

            <div className="form-column">
              <div className="form-section">
                <h4>Πληροφορίες Γνωμάτευσης</h4>

                <div className="form-group">
                  <label htmlFor="startingDate">Ημερομηνία Έναρξης: *</label>
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
                  <label htmlFor="endingDate">Ημερομηνία Λήξης: *</label>
                  <input
                    type="date"
                    id="endingDate"
                    name="endingDate"
                    value={formData.endingDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="opinionCode">Κωδικός Γνωμάτευσης:</label>
                  <input
                    type="text"
                    id="opinionCode"
                    name="opinionCode"
                    value={formData.opinionCode}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε κωδικό γνωμάτευσης"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="opinionValue">Αξία Γνωμάτευσης:</label>
                  <input
                    type="number"
                    id="opinionValue"
                    name="opinionValue"
                    value={formData.opinionValue}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε αξία γνωμάτευσης"
                  />
                </div>

                <div className="sum-display">
                  <span>Άθροισμα συνεδριάσεων: {calculateSum()}</span>
                </div>

                <div className="form-group">
                  <div className="small-fields-row">
                    <div className="small-field">
                      <label htmlFor="logo">ΛΟΓΟ: *</label>
                      <input
                        type="number"
                        id="logo"
                        name="logo"
                        value={formData.logo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="small-field">
                      <label htmlFor="ergo">ΕΡΓΟ: *</label>
                      <input
                        type="number"
                        id="ergo"
                        name="ergo"
                        value={formData.ergo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="small-field">
                      <label htmlFor="psycho">ΨΥΧΟ: *</label>
                      <input
                        type="number"
                        id="psycho"
                        name="psycho"
                        value={formData.psycho}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="small-field">
                      <label htmlFor="mp">ΜΠ: *</label>
                      <input
                        type="number"
                        id="mp"
                        name="mp"
                        value={formData.mp}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="small-field">
                      <label htmlFor="eid">ΕΙΔ: *</label>
                      <input
                        type="number"
                        id="eid"
                        name="eid"
                        value={formData.eid}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comments">Σχόλια:</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Εισάγετε σχόλια (προαιρετικό)"
              rows="3"
            />
          </div>
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