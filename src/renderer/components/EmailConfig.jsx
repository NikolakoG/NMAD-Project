import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

function EmailConfig({ config, onSave, onClose }) {
  const [formData, setFormData] = useState({
    user: '',
    password: '',
    service: 'gmail',
    notifyEmail: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Remove spaces from password field while typing
    const cleanedValue = name === 'password' ? value.replace(/\s/g, '') : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanedValue
    }));
  };

  const handlePasswordPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = pastedText.replace(/\s/g, ''); // Remove all spaces
    
    setFormData(prev => ({
      ...prev,
      password: cleanedText
    }));
  };

  const handleSave = () => {
    if (!formData.user || !formData.password || !formData.notifyEmail) {
      alert('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    if (!isValidEmail(formData.user) || !isValidEmail(formData.notifyEmail)) {
      alert('Παρακαλώ εισάγετε έγκυρες διευθύνσεις email');
      return;
    }

    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (config) {
      setFormData(config);
    }
    setIsEditing(false);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };


  return (
    <div className="email-config">
      <div className="modal-header">
        <h3>Ρυθμίσεις Email Ειδοποιήσεων</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      
      {!isEditing && config ? (
        <div>
          <p style={{ marginBottom: '12px' }}><strong>Email αποστολέα (Gmail):</strong> {config.user}</p>
          <p style={{ marginBottom: '20px' }}><strong>Email Ειδοποίησης:</strong> {config.notifyEmail}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsEditing(true)}
            >
              Επεξεργασία Ρυθμίσεων
            </button>
          </div>
        </div>
      ) : (
        <div className="config-form">
          <div className="form-group">
            <label htmlFor="user">Email αποστολέα (Gmail μόνο):</label>
            <input
              type="email"
              id="user"
              name="user"
              value={formData.user}
              onChange={handleInputChange}
              placeholder="your-email@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Κωδικός Εφαρμογής Gmail:</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onPaste={handlePasswordPaste}
                placeholder="Your app-specific password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notifyEmail">Email Ειδοποίησης:</label>
            <input
              type="email"
              id="notifyEmail"
              name="notifyEmail"
              value={formData.notifyEmail}
              onChange={handleInputChange}
              placeholder="notify@example.com"
              required
            />
          </div>

          <div className="config-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Αποθήκευση Ρυθμίσεων
            </button>
            {config && (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Ακύρωση
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailConfig;