import React, { useState, useEffect } from 'react';
import EntryTable from './components/EntryTable';
import EntryModal from './components/EntryModal';
import EntryDetailModal from './components/EntryDetailModal';
import EmailConfig from './components/EmailConfig';
import PersonSelector from './components/PersonSelector';
import FileUploader from './components/FileUploader';
import TherapistSchedule from './components/TherapistSchedule';
import NonWorkingDays from './components/NonWorkingDays';

const { ipcRenderer } = window.require('electron');

function formatName(entry) {
  return `${entry.lastName} ${entry.firstName}`;
}

function App() {
  const [activeTab, setActiveTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [showAlertConfirm, setShowAlertConfirm] = useState(false);
  const [pendingAlertEntries, setPendingAlertEntries] = useState([]);
  const [emailTracking, setEmailTracking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New tab state
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [extractedPdfData, setExtractedPdfData] = useState(null);
  const [showTherapistSchedule, setShowTherapistSchedule] = useState(false);
  const [showNonWorkingDays, setShowNonWorkingDays] = useState(false);

  // Therapists state shared between TherapistSchedule and FileUploader
  const [therapists, setTherapists] = useState([
    { name: 'Γκάβαλη Κωνσταντίνα', type: 'Λογοθεραπεία' },
    { name: 'Τάρλα Αντωνία', type: 'Εργοθεραπεία' }
  ]);
  const [therapistSchedule, setTherapistSchedule] = useState({
    'Δευτέρα': [],
    'Τρίτη': [],
    'Τετάρτη': [],
    'Πέμπτη': [],
    'Παρασκευή': []
  });
  const [customNonWorkingDays, setCustomNonWorkingDays] = useState([]);

  useEffect(() => {
    loadEntries();
    loadEmailConfig();
    loadEmailTracking();
    loadTherapistSchedule();
    loadCustomNonWorkingDays();
    
    // Listen for IPC messages from main process
    ipcRenderer.on('show-catchup-alert', handleCatchupAlert);
    ipcRenderer.on('automatic-email-results', handleAutomaticEmailResults);
    
    // Test IPC listener
    console.log('Frontend: IPC listeners registered');
    
    // Cleanup listeners on component unmount
    return () => {
      ipcRenderer.removeListener('show-catchup-alert', handleCatchupAlert);
      ipcRenderer.removeListener('automatic-email-results', handleAutomaticEmailResults);
    };
  }, []);

  const loadEntries = async () => {
    try {
      const data = await ipcRenderer.invoke('load-entries');
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadEmailConfig = async () => {
    try {
      const config = await ipcRenderer.invoke('get-email-config');
      setEmailConfig(config);
    } catch (error) {
      console.error('Σφάλμα φόρτωσης ρυθμίσεων email:', error);
    }
  };

  const loadEmailTracking = async () => {
    try {
      const tracking = await ipcRenderer.invoke('get-email-tracking');
      setEmailTracking(tracking);
    } catch (error) {
      console.error('Σφάλμα φόρτωσης παρακολούθησης email:', error);
    }
  };

  const loadTherapistSchedule = async () => {
    try {
      const data = await ipcRenderer.invoke('load-therapist-schedule');
      if (data.therapists) {
        setTherapists(data.therapists);
      }
      if (data.schedule) {
        setTherapistSchedule(data.schedule);
      }
    } catch (error) {
      console.error('Σφάλμα φόρτωσης προγράμματος θεραπευτών:', error);
    }
  };

  const saveTherapistSchedule = async (schedule) => {
    try {
      const scheduleData = {
        therapists,
        schedule
      };
      await ipcRenderer.invoke('save-therapist-schedule', scheduleData);
      setTherapistSchedule(schedule);
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης προγράμματος θεραπευτών:', error);
    }
  };

  const updateTherapists = async (newTherapists) => {
    setTherapists(newTherapists);
    try {
      const scheduleData = {
        therapists: newTherapists,
        schedule: therapistSchedule
      };
      await ipcRenderer.invoke('save-therapist-schedule', scheduleData);
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης θεραπευτών:', error);
    }
  };

  const loadCustomNonWorkingDays = async () => {
    try {
      const data = await ipcRenderer.invoke('load-custom-non-working-days');
      setCustomNonWorkingDays(data || []);
    } catch (error) {
      console.error('Σφάλμα φόρτωσης μη εργάσιμων ημερών:', error);
    }
  };

  const saveCustomNonWorkingDays = async (days) => {
    try {
      await ipcRenderer.invoke('save-custom-non-working-days', days);
      setCustomNonWorkingDays(days);
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης μη εργάσιμων ημερών:', error);
    }
  };

  const handleCatchupAlert = (event, daysMissed) => {
    alert(`Το σύστημα εντόπισε ότι δεν στάλθηκαν αυτόματα emails για ${daysMissed} ημέρες. Θα σταλούν τώρα αυτόματα emails για όλες τις γνωματεύσεις που λήγουν σε 10 ημέρες.`);
  };

  const handleAutomaticEmailResults = (event, results) => {
    const { mode, successCount, failedCount, totalCount, isCatchUp } = results;
    const modeText = isCatchUp ? 'αναπλήρωσης' : 'κανονικά';

    if (failedCount > 0) {
      alert(`Αυτόματα emails ${modeText}: Επιτυχής αποστολή ${successCount} από ${totalCount} emails. ${failedCount} αποτυχίες.`);
    } else {
      alert(`Αυτόματα emails ${modeText}: Επιτυχής αποστολή όλων των ${successCount} emails!`);
    }

    // Reload email tracking to update the display
    loadEmailTracking();
  };


  const saveEntries = async (newEntries) => {
    try {
      await ipcRenderer.invoke('save-entries', newEntries);
      setEntries(newEntries);
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης καταχωρήσεων:', error);
    }
  };

  const saveEmailConfig = async (config) => {
    try {
      const result = await ipcRenderer.invoke('save-email-config', config);
      if (result.success) {
        setEmailConfig(config);
      }
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης ρυθμίσεων email:', error);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleViewEntry = (entry) => {
    setViewingEntry(entry);
    setShowDetailModal(true);
  };

  const handleDeleteEntry = (entryId) => {
    const newEntries = entries.filter(entry => entry.id !== entryId);
    saveEntries(newEntries);
  };

  const handleSaveEntry = (entryData) => {
    // Add the formatted name for backward compatibility and display
    const entryWithName = {
      ...entryData,
      name: formatName(entryData)
    };
    
    let newEntries;
    
    if (editingEntry) {
      // Edit existing entry
      newEntries = entries.map(entry =>
        entry.id === editingEntry.id ? { ...entryWithName, id: editingEntry.id } : entry
      );
    } else {
      // Add new entry
      const newEntry = {
        ...entryWithName,
        id: Date.now().toString()
      };
      newEntries = [...entries, newEntry];
    }
    
    saveEntries(newEntries);
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setViewingEntry(null);
  };

  const handleUpdateFromDetailModal = (updatedEntry) => {
    const newEntries = entries.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    saveEntries(newEntries);
    setViewingEntry(updatedEntry);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleSaveSettings = (config) => {
    saveEmailConfig(config);
    setShowSettings(false);
  };

  const handleSendAlert = () => {
    if (!emailConfig) {
      alert('Παρακαλώ ρυθμίστε πρώτα τις ρυθμίσεις email.');
      return;
    }

    // Filter entries expiring within 10 days and expired entries
    const today = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);

    const alertEntries = entries.filter(entry => {
      const endDate = new Date(entry.endingDate);
      return endDate <= tenDaysFromNow; // This includes expired entries (endDate < today) and expiring entries
    });

    if (alertEntries.length === 0) {
      alert('Δεν βρέθηκαν καταχωρήσεις για το περιληπτικό email');
      return;
    }

    // Show confirmation modal
    setPendingAlertEntries(alertEntries);
    setShowAlertConfirm(true);
  };

  const handleConfirmSendAlert = async () => {
    setShowAlertConfirm(false);
    setSendingAlert(true);
    
    try {
      const result = await ipcRenderer.invoke('send-alert-email', emailConfig, pendingAlertEntries);
      if (result.success) {
        alert(`Το περιληπτικό email εστάλη επιτυχώς! Βρέθηκαν ${pendingAlertEntries.length} καταχωρήσεις που λήγουν σε 10 ημέρες ή έχουν ήδη λήξει.`);
      } else {
        alert(`Αποτυχία αποστολής περιληπτικού email: ${result.error}`);
      }
    } catch (error) {
      alert(`Αποτυχία αποστολής περιληπτικού email: ${error.message}`);
    } finally {
      setSendingAlert(false);
      setPendingAlertEntries([]);
    }
  };

  const handleCancelSendAlert = () => {
    setShowAlertConfirm(false);
    setPendingAlertEntries([]);
  };

  // Handlers for new tab
  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
  };

  const handleBackToPersonList = () => {
    setSelectedPerson(null);
    setExtractedPdfData(null);
  };

  const handleFileSelected = (file, pdfData) => {
    console.log('PDF data extracted:', pdfData);
    setExtractedPdfData(pdfData);
  };

  const handleShowTherapistSchedule = () => {
    setShowTherapistSchedule(true);
  };

  const handleBackFromSchedule = () => {
    setShowTherapistSchedule(false);
  };

  const handleShowNonWorkingDays = () => {
    setShowNonWorkingDays(true);
  };

  const handleBackFromNonWorkingDays = () => {
    setShowNonWorkingDays(false);
  };

  const handleUpdatePersonAmka = async (personId, newAmka) => {
    // Update entries state
    const updatedEntries = entries.map(entry =>
      entry.id === personId
        ? { ...entry, childAmka: newAmka }
        : entry
    );
    setEntries(updatedEntries);

    // Also update selectedPerson if it's the one being modified
    if (selectedPerson && selectedPerson.id === personId) {
      setSelectedPerson({ ...selectedPerson, childAmka: newAmka });
    }

    // Save to database
    await saveEntries(updatedEntries);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Μενού</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('entries');
            }}
          >
            Καταχωρήσεις
          </button>
          <button
            className={`nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('receipts');
              // Reset receipts tab to first screen
              setSelectedPerson(null);
              setExtractedPdfData(null);
              setShowTherapistSchedule(false);
              setShowNonWorkingDays(false);
            }}
          >
            Βεβαιώσεις
          </button>
        </nav>
      </div>

      <div className="main-content">
        {activeTab === 'entries' && (
          <div className="app">
            <div className="header">
              <h1>Διαχείριση Καταχωρήσεων</h1>
            </div>

            <div className="table-section">
        {emailTracking && emailTracking.lastEmailDate && (
          <div className="email-status-info">
            <p>
              <strong>Τελευταία αυτόματη αποστολή emails:</strong>{' '}
              {new Date(emailTracking.lastEmailDate).toLocaleDateString('el-GR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} στις {new Date(emailTracking.lastEmailDate).toLocaleTimeString('el-GR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p><em>Αυτόματα emails στέλνονται καθημερινά στις 13:00 για γνωματεύσεις που λήγουν σε 10 ημέρες</em></p>
          </div>
        )}
        
        <div className="table-header">
          <div className="left-buttons">
            <button className="btn btn-primary add-button" onClick={handleAddEntry}>
              ✕
            </button>
            <span className="entries-count">
              Σύνολο: {entries.length} καταχωρήσεις
            </span>
          </div>
          <button className="btn btn-secondary summary-email-button" onClick={handleSendAlert} disabled={sendingAlert}>
            {sendingAlert ? 'Αποστολή...' : 'Αποστολή περιληπτικού email'}
          </button>
          <button className="btn btn-secondary settings-button" onClick={handleSettings}>
            ⚙
          </button>
        </div>
        
        <div className="search-section">
          <input
            type="text"
            placeholder="Αναζήτηση καταχωρήσεων..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="table-container">
          <EntryTable
            entries={entries}
            searchTerm={searchTerm}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onView={handleViewEntry}
          />
        </div>
      </div>

      {showModal && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={handleCloseModal}
        />
      )}

      {showDetailModal && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={handleCloseDetailModal}
          onEdit={handleUpdateFromDetailModal}
        />
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={handleCloseSettings}>
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            <EmailConfig
              config={emailConfig}
              onSave={handleSaveSettings}
              onClose={handleCloseSettings}
            />
          </div>
        </div>
      )}

            {showAlertConfirm && (
              <div className="modal-overlay" onClick={handleCancelSendAlert}>
                <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header confirm-modal-header">
                    <h3>Επιβεβαίωση Περιληπτικού Email</h3>
                    <button className="close-button" onClick={handleCancelSendAlert}>
                      ✕
                    </button>
                  </div>
                  <p style={{ marginBottom: '16px', textAlign: 'center' }}>Είστε σίγουρος ότι θέλετε να στείλετε περιληπτικό email με την αναφορά;</p>
                  <p style={{ marginBottom: '20px', textAlign: 'center' }}><strong>{pendingAlertEntries.length} καταχωρήσεις</strong> θα συμπεριληφθούν (ληγμένες ή που λήγουν σε 10 ημέρες).</p>
                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleConfirmSendAlert}>
                      Ναι, Στείλε Email
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancelSendAlert}>
                      Όχι, Ακύρωση
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="app">
            {showTherapistSchedule ? (
              <TherapistSchedule
                onBack={handleBackFromSchedule}
                therapists={therapists}
                onUpdateTherapists={updateTherapists}
                schedule={therapistSchedule}
                onUpdateSchedule={saveTherapistSchedule}
              />
            ) : showNonWorkingDays ? (
              <NonWorkingDays
                onBack={handleBackFromNonWorkingDays}
                customNonWorkingDays={customNonWorkingDays}
                onUpdateCustomNonWorkingDays={saveCustomNonWorkingDays}
              />
            ) : !selectedPerson ? (
              <PersonSelector
                entries={entries}
                onSelectPerson={handleSelectPerson}
                onShowTherapistSchedule={handleShowTherapistSchedule}
                onShowNonWorkingDays={handleShowNonWorkingDays}
              />
            ) : (
              <FileUploader
                selectedPerson={selectedPerson}
                onFileSelected={handleFileSelected}
                onBack={handleBackToPersonList}
                therapists={therapists}
                therapistSchedule={therapistSchedule}
                customNonWorkingDays={customNonWorkingDays}
                onUpdatePersonAmka={handleUpdatePersonAmka}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;