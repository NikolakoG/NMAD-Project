import React, { useState } from 'react';
import { isGreekPublicHoliday } from '../utils/holidays';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

function FileUploader({ selectedPerson, onFileSelected, onBack, onContinueToTherapy, therapists, therapistSchedule, customNonWorkingDays, onUpdatePersonAmka }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTherapyData, setExtractedTherapyData] = useState(null);
  const [showTherapyModal, setShowTherapyModal] = useState(false);
  const [selectedTherapyForModal, setSelectedTherapyForModal] = useState(null);
  const [showMonthSelection, setShowMonthSelection] = useState(false);
  const [selectedTherapists, setSelectedTherapists] = useState({});
  const [showAmkaConflictModal, setShowAmkaConflictModal] = useState(false);
  const [conflictAmkaData, setConflictAmkaData] = useState(null);
  const [confirmedAmka, setConfirmedAmka] = useState(null);
  const [showUpdateAmkaModal, setShowUpdateAmkaModal] = useState(false);
  const [pendingPdfAmka, setPendingPdfAmka] = useState(null);
  const [showFinalInfo, setShowFinalInfo] = useState(false);
  const [finalInfoData, setFinalInfoData] = useState(null);
  const [editableInfo, setEditableInfo] = useState({
    receiptNumber: '',
    parentName: '',
    parentAmka: '',
    opinionNumber: '',
    studentName: '',
    studentAmka: ''
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Μόνο αρχεία PDF επιτρέπονται');
      setFile(null);
      return;
    }

    setError('');
    setFile(file);
  };

  // Helper function to normalize therapy type names
  const normalizeTherapyType = (type) => {
    const normalized = type.toUpperCase().replace(/[ΆΈΉΊΌΎΏάέήίόύώ]/g, (match) => {
      const map = { 'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
                    'ά': 'Α', 'έ': 'Ε', 'ή': 'Η', 'ί': 'Ι', 'ό': 'Ο', 'ύ': 'Υ', 'ώ': 'Ω' };
      return map[match] || match;
    });

    // Map to standard names
    if (normalized.includes('ΛΟΓΟΘΕΡΑΠΕΙ') || normalized.includes('ΛΟΓΟΘΕΡΑΠΙ')) {
      return 'Λογοθεραπεία';
    }
    if (normalized.includes('ΕΡΓΟΘΕΡΑΠΕΙ') || normalized.includes('ΕΡΓΟΘΕΡΑΠΙ')) {
      return 'Εργοθεραπεία';
    }
    if (normalized.includes('ΣΥΜΠΕΡΙΦΟΡΑΣ') || normalized.includes('ΣΥΜΠΕΡΙΦΟΡΑ')) {
      return 'Θεραπεία Συμπεριφοράς';
    }
    if (normalized.includes('ΕΙΔΙΚΗ') && normalized.includes('ΦΥΣΙΚΟΘΕΡΑΠΕΙΑ')) {
      return 'Ειδική Αγωγή - Φυσικοθεραπεία';
    }

    return type;
  };

  // Helper function to get Greek weekday name from date
  const getGreekWeekday = (date) => {
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[date.getDay()];
  };


  // Helper function to get therapist's working days
  const getTherapistWorkingDays = (therapistName) => {
    if (!therapistSchedule) return [];

    const workingDays = [];
    const weekdays = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

    weekdays.forEach(day => {
      const daySchedule = therapistSchedule[day] || [];
      const isWorking = daySchedule.some(t => {
        const tName = typeof t === 'string' ? t : t.name;
        return tName === therapistName;
      });
      if (isWorking) {
        workingDays.push(day);
      }
    });

    return workingDays;
  };

  // Helper function to distribute sessions across working days in a month
  const distributeSessionsInMonth = (therapistName, sessionCount, dateFrom, dateTo) => {
    const workingDays = getTherapistWorkingDays(therapistName);
    if (workingDays.length === 0) return [];

    // Parse dates (format: DD/MM/YYYY)
    const [dayFrom, monthFrom, yearFrom] = dateFrom.split('/').map(Number);
    const [dayTo, monthTo, yearTo] = dateTo.split('/').map(Number);

    const startDate = new Date(yearFrom, monthFrom - 1, dayFrom);
    const endDate = new Date(yearTo, monthTo - 1, dayTo);

    // Get all working dates in the period (excluding public holidays and custom non-working days)
    const workingDates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekday = getGreekWeekday(currentDate);

      // Format date as YYYY-MM-DD in local time (not UTC)
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Check if it's a custom non-working day
      const isCustomNonWorkingDay = customNonWorkingDays && customNonWorkingDays.includes(dateStr);

      // Only include if it's a working day AND not a public holiday AND not a custom non-working day
      if (workingDays.includes(weekday) && !isGreekPublicHoliday(currentDate) && !isCustomNonWorkingDay) {
        workingDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Distribute sessions across working dates
    const sessionDates = [];
    if (workingDates.length > 0 && sessionCount > 0) {
      if (sessionCount <= workingDates.length) {
        // Sessions fit within available days - distribute evenly
        const interval = Math.floor(workingDates.length / sessionCount);

        for (let i = 0; i < sessionCount; i++) {
          const dateIndex = Math.min(i * interval, workingDates.length - 1);
          sessionDates.push({ date: workingDates[dateIndex], count: 1 });
        }
      } else {
        // More sessions than available days - need to double up
        // First, assign one session to each working day
        workingDates.forEach(date => {
          sessionDates.push({ date: new Date(date), count: 1 });
        });

        // Calculate how many extra sessions we need to add
        let remainingSessions = sessionCount - workingDates.length;

        // Distribute extra sessions evenly across working dates
        let index = 0;
        while (remainingSessions > 0) {
          sessionDates[index].count++;
          remainingSessions--;
          index = (index + 1) % sessionDates.length; // Cycle through dates
        }
      }
    }

    return sessionDates;
  };

  const extractTherapyData = (text) => {
    const therapyData = {
      sessions: [],
      therapies: [],
      amka: '',
      fullName: ''
    };

    // Extract AMKA and Full Name
    // Pattern: Α.Μ.Κ.Α. Εξεταζόμενου   NUMBER : : FULLNAME Ονομ/μο Εξεταζόμενου
    const amkaPattern = /Α\.Μ\.Κ\.Α\.\s+Εξεταζόμενου\s+(\d+)\s*:\s*:\s*([^\n]+?)\s+Ονομ\/μο\s+Εξεταζόμενου/i;
    const amkaMatch = text.match(amkaPattern);

    if (amkaMatch) {
      therapyData.amka = amkaMatch[1].trim();
      therapyData.fullName = amkaMatch[2].trim();
    }

    // Extract Συνεδρίες (Sessions)
    // Find therapy type followed by "Συνολική Ποσότητα Είδους:" and then a number
    const therapyTypes = [
      'ΕΙΔΙΚΗ ΑΓΩΓΗ/ΦΥΣΙΚΟΘΕΡΑΠΕΙΑ',
      'ΛΟΓΟΘΕΡΑΠΕΙΑ',
      'ΕΡΓΟΘΕΡΑΠΕΙΑ',
      'ΘΕΡΑΠΕΙΑ ΣΥΜΠΕΡΙΦΟΡΑΣ'
    ];

    therapyTypes.forEach(therapyType => {
      // Create a regex to find the therapy type followed by "Συνολική Ποσότητα Είδους:" and a number
      const pattern = new RegExp(
        therapyType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '[\\s\\S]{0,200}?Συνολική\\s+Ποσότητα\\s+Είδους:\\s+(\\d+)',
        'gi'
      );

      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const count = parseInt(match[1], 10);
        if (count > 0) {
          therapyData.sessions.push({ type: normalizeTherapyType(therapyType), count });
        }
      }
    });

    // Extract Θεραπείες from "Αριθμοί Μηνιαίων Παραπεμπτικών ανά Είδος Θεραπειών"
    // The structure is: pairs of (number + dates), then therapy name, then more pairs, etc.

    // Pattern for referrals: "3 με διάρκεια ισχύος από 01/01/2024 έως 31/01/2024"
    const referralPattern = /(\d+)\s+με\s+διάρκεια\s+ισχύος\s+από\s+([\d\/]+)\s+έως\s+([\d\/]+)/g;

    // Pattern for therapy names (including alternate forms)
    // Note: Order matters - more specific patterns (like combinations) should come first
    const therapyNamePattern = /(ΕΙΔΙΚΗ\s+ΑΓΩΓΗ\/ΦΥΣΙΚΟΘΕΡΑΠΕΙΑ[^/]*|ΑΓΩΓΗ\s+ΛΟΓΟΥ\s*-\s*ΛΟΓΟΘΕΡΑΠΕΙΑ|ΛΟΓΟΘΕΡΑΠΕΙΑ|ΕΡΓΟΘΕΡΑΠΕΙΑ|ΘΕΡΑΠΕΙΑ\s+ΣΥΜΠΕΡΙΦΟΡΑΣ)/gi;

    // Find all positions of referrals and therapy names
    const items = [];

    // Find all referral patterns
    let match;
    while ((match = referralPattern.exec(text)) !== null) {
      items.push({
        type: 'referral',
        position: match.index,
        number: parseInt(match[1], 10),
        dateFrom: match[2],
        dateTo: match[3]
      });
    }

    // Find all therapy names
    while ((match = therapyNamePattern.exec(text)) !== null) {
      let therapyName = match[1];
      // Normalize ΑΓΩΓΗ ΛΟΓΟΥ - ΛΟΓΟΘΕΡΑΠΕΙΑ to ΛΟΓΟΘΕΡΑΠΕΙΑ
      if (therapyName.includes('ΑΓΩΓΗ ΛΟΓΟΥ')) {
        therapyName = 'ΛΟΓΟΘΕΡΑΠΕΙΑ';
      }
      // Keep the combined therapy type as is (don't split it)
      if (therapyName.includes('ΕΙΔΙΚΗ ΑΓΩΓΗ/ΦΥΣΙΚΟΘΕΡΑΠΕΙΑ')) {
        // Already in correct format, just store it
      }
      items.push({
        type: 'therapy',
        position: match.index,
        name: therapyName
      });
    }

    // Sort all items by position
    items.sort((a, b) => a.position - b.position);

    // Process items: assign referrals to the next therapy name that appears
    let pendingReferrals = [];

    items.forEach(item => {
      if (item.type === 'referral') {
        // Store referral for later assignment
        pendingReferrals.push(item);
      } else if (item.type === 'therapy') {
        // Assign all pending referrals to this therapy
        pendingReferrals.forEach(referral => {
          therapyData.therapies.push({
            therapy: normalizeTherapyType(item.name),
            number: referral.number,
            dateFrom: referral.dateFrom,
            dateTo: referral.dateTo
          });
        });
        // Clear pending referrals
        pendingReferrals = [];
      }
    });

    return therapyData;
  };

  const handleContinue = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Send to main process to extract text
      const { ipcRenderer } = window.require('electron');
      const extractedData = await ipcRenderer.invoke('extract-pdf-data', arrayBuffer);

      if (extractedData.success) {
        // Extract therapy data directly
        const therapyData = extractTherapyData(extractedData.text);

        // Check if AMKA from PDF matches selected person's AMKA
        if (therapyData.amka && selectedPerson.childAmka && therapyData.amka !== selectedPerson.childAmka) {
          // AMKA conflict - show modal
          setConflictAmkaData({
            pdfAmka: therapyData.amka,
            personAmka: selectedPerson.childAmka,
            therapyData: therapyData
          });
          setShowAmkaConflictModal(true);
        } else {
          // No conflict or no AMKA to compare
          setExtractedTherapyData(therapyData);
          onFileSelected(file, extractedData);

          // Call parent handler if provided
          if (onContinueToTherapy) {
            onContinueToTherapy(therapyData);
          }
        }
      } else {
        setError(`Σφάλμα: ${extractedData.error}`);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      setError('Σφάλμα κατά την ανάγνωση του αρχείου PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmkaChoice = (chosenAmka) => {
    // Check if user chose PDF AMKA
    if (chosenAmka === conflictAmkaData.pdfAmka) {
      // Show update confirmation modal
      setPendingPdfAmka(chosenAmka);
      setShowAmkaConflictModal(false);
      setShowUpdateAmkaModal(true);
    } else {
      // User chose person AMKA, proceed directly
      proceedWithAmka(chosenAmka);
    }
  };

  const proceedWithAmka = (chosenAmka) => {
    // Update therapy data with chosen AMKA
    const updatedTherapyData = {
      ...conflictAmkaData.therapyData,
      amka: chosenAmka
    };
    setConfirmedAmka(chosenAmka);
    setExtractedTherapyData(updatedTherapyData);
    setShowAmkaConflictModal(false);
    setConflictAmkaData(null);

    onFileSelected(file, { success: true, text: '' });
  };

  const handleUpdateAmkaConfirmation = async (shouldUpdate) => {
    if (shouldUpdate && onUpdatePersonAmka) {
      // Update the student's AMKA via parent callback
      await onUpdatePersonAmka(selectedPerson.id, pendingPdfAmka);
    }

    // Proceed with PDF AMKA regardless of update choice
    proceedWithAmka(pendingPdfAmka);
    setShowUpdateAmkaModal(false);
    setPendingPdfAmka(null);
  };


  if (isProcessing) {
    return (
      <div className="file-uploader">
        <div className="processing-container">
          <div className="loader-container">
            <div className="loader"></div>
          </div>
          <h3>Επεξεργασία PDF...</h3>
          <p>Παρακαλώ περιμένετε ενώ το σύστημα διαβάζει το αρχείο.</p>
        </div>
      </div>
    );
  }

  const generateDocx = async () => {
    try {
      const { ipcRenderer } = window.require('electron');

      // Read the template file
      const templatePath = await ipcRenderer.invoke('get-template-path');
      console.log('Using template at:', templatePath);

      const content = await ipcRenderer.invoke('read-file', templatePath);
      console.log('Template file size:', content.length);

      // Load the docx file as binary content
      const zip = new PizZip(content);

      // Verify the placeholders in the loaded template
      const xml = zip.files['word/document.xml'].asText();
      const placeholders = xml.match(/\{\{[^}]*\}\}/g);
      console.log('Found placeholders:', placeholders);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Helper to format date as DD/MM/YYYY
      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Prepare session list for the template
      const sessionsList = finalInfoData.therapists.flatMap(therapistInfo => {
        if (!therapistInfo.sessionDates || therapistInfo.sessionDates.length === 0) {
          return [];
        }

        return therapistInfo.sessionDates.flatMap(dateObj =>
          Array.from({ length: dateObj.count }, () => ({
            therapy: therapistInfo.therapy,
            therapist: therapistInfo.therapist,
            date: formatDate(dateObj.date)
          }))
        );
      });

      // Format the session list grouped by therapy type
      const groupedSessions = {};
      sessionsList.forEach(session => {
        const key = `${session.therapy} - ${session.therapist}`;
        if (!groupedSessions[key]) {
          groupedSessions[key] = {
            therapy: session.therapy,
            therapist: session.therapist,
            dates: []
          };
        }
        groupedSessions[key].dates.push(session.date);
      });

      // Format as: "X Θεραπείες ΘΕΡΑΠΕΙΑ\nΗμερομηνίες θεραπείας: date1, date2, date3..."
      const sessionListString = Object.values(groupedSessions).map(group => {
        const count = group.dates.length;
        const therapy = group.therapy;
        const datesStr = group.dates.join(', ');
        return `${count} Θεραπείες ${therapy}\nΗμερομηνίες θεραπείας: ${datesStr}`;
      }).join('\n\n');

      // Prepare data for the template
      const templateData = {
        RECEIPT_NUMBER: editableInfo.receiptNumber || '',
        PARENT_NAME: editableInfo.parentName || '',
        PARENT_AMKA: editableInfo.parentAmka || '',
        OPINION_NUMBER: editableInfo.opinionNumber || '',
        STUDENT_NAME: editableInfo.studentName || '',
        STUDENT_AMKA: editableInfo.studentAmka || '',
        DATE_FROM: finalInfoData.periodStart || '',
        DATE_TO: finalInfoData.periodEnd || '',
        SESSION_LIST: sessionListString
      };

      console.log('Template data:', templateData);

      // Render the document
      doc.render(templateData);

      // Generate the document as a buffer
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Save the file
      const success = await ipcRenderer.invoke('save-docx', buf, `Βεβαιωση_${editableInfo.studentName || 'template'}.docx`);

      if (success) {
        alert('Το αρχείο δημιουργήθηκε επιτυχώς!');
      } else {
        alert('Η αποθήκευση ακυρώθηκε.');
      }
    } catch (error) {
      console.error('Full error object:', error);

      // Docxtemplater specific error handling
      if (error.properties && error.properties.errors) {
        const errorMessages = error.properties.errors.map(err => {
          return `${err.message} at ${err.part}`;
        }).join('\n');
        alert('Σφάλμα στο template:\n' + errorMessages);
      } else {
        alert('Σφάλμα κατά τη δημιουργία του αρχείου: ' + error.message);
      }
    }
  };

  if (showFinalInfo && finalInfoData) {
    // Helper to format date as DD/MM/YYYY
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Calculate non-working days in the period
    const getNonWorkingDaysInPeriod = () => {
      const [dayFrom, monthFrom, yearFrom] = finalInfoData.periodStart.split('/').map(Number);
      const [dayTo, monthTo, yearTo] = finalInfoData.periodEnd.split('/').map(Number);
      const startDate = new Date(yearFrom, monthFrom - 1, dayFrom);
      const endDate = new Date(yearTo, monthTo - 1, dayTo);

      const nonWorkingDays = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Check if it's a public holiday
        if (isGreekPublicHoliday(currentDate)) {
          nonWorkingDays.push({
            date: formatDate(currentDate),
            type: 'Αργία',
            weekday: getGreekWeekday(currentDate)
          });
        } else {
          // Check if it's a custom non-working day
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          if (customNonWorkingDays && customNonWorkingDays.includes(dateStr)) {
            nonWorkingDays.push({
              date: formatDate(currentDate),
              type: 'Μη εργάσιμη ημέρα',
              weekday: getGreekWeekday(currentDate)
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return nonWorkingDays;
    };

    const nonWorkingDaysInPeriod = getNonWorkingDaysInPeriod();

    return (
      <div className="file-uploader">
        <button className="back-button" onClick={() => setShowFinalInfo(false)}>
          <span className="back-arrow">←</span> Επιστροφή
        </button>

        <h2 className="uploader-title">Τελικές Πληροφορίες</h2>

        {/* Editable Info Section */}
        <div className="certificate-info-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Πληροφορίες Βεβαίωσης</h3>
            <button className="btn btn-primary" onClick={generateDocx}>
              Δημιουργία Βεβαίωσης
            </button>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <label>Αριθμός Απόδειξης:</label>
              <input
                type="text"
                value={editableInfo.receiptNumber}
                onChange={(e) => setEditableInfo({...editableInfo, receiptNumber: e.target.value})}
                placeholder="Εισάγετε αριθμό απόδειξης..."
                className="info-input"
              />
            </div>

            <div className="info-field">
              <label>Όνομα Γονέα:</label>
              <input
                type="text"
                value={editableInfo.parentName}
                onChange={(e) => setEditableInfo({...editableInfo, parentName: e.target.value})}
                placeholder="Εισάγετε όνομα γονέα..."
                className="info-input"
              />
            </div>

            <div className="info-field">
              <label>ΑΜΚΑ Γονέα:</label>
              <input
                type="text"
                value={editableInfo.parentAmka}
                onChange={(e) => setEditableInfo({...editableInfo, parentAmka: e.target.value})}
                placeholder="Εισάγετε ΑΜΚΑ γονέα..."
                className="info-input"
              />
            </div>

            <div className="info-field">
              <label>Αριθμός Γνωμάτευσης:</label>
              <input
                type="text"
                value={editableInfo.opinionNumber}
                onChange={(e) => setEditableInfo({...editableInfo, opinionNumber: e.target.value})}
                placeholder="Εισάγετε αριθμό γνωμάτευσης..."
                className="info-input"
              />
            </div>

            <div className="info-field">
              <label>Όνομα Μαθητή:</label>
              <input
                type="text"
                value={editableInfo.studentName}
                onChange={(e) => setEditableInfo({...editableInfo, studentName: e.target.value})}
                placeholder="Εισάγετε όνομα μαθητή..."
                className="info-input"
              />
            </div>

            <div className="info-field">
              <label>ΑΜΚΑ Μαθητή:</label>
              <input
                type="text"
                value={editableInfo.studentAmka}
                onChange={(e) => setEditableInfo({...editableInfo, studentAmka: e.target.value})}
                placeholder="Εισάγετε ΑΜΚΑ μαθητή..."
                className="info-input"
              />
            </div>
          </div>
        </div>

        <div className="final-info-container">
          <div className="period-info">
            <strong>Περίοδος:</strong> {finalInfoData.periodStart} - {finalInfoData.periodEnd}
          </div>

          {nonWorkingDaysInPeriod.length > 0 && (
            <div className="non-working-days-info">
              <strong>Μη εργάσιμες ημέρες στην περίοδο:</strong>
              <div className="non-working-days-list">
                {nonWorkingDaysInPeriod.map((day, idx) => (
                  <span key={idx} className="non-working-day-tag">
                    {day.date} ({day.weekday}) - {day.type}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="therapies-distribution">
            {finalInfoData.therapists && finalInfoData.therapists.map((therapistInfo, index) => (
              <div key={index} className="therapy-distribution-card">
                <div className="therapy-distribution-header">
                  <h3>{therapistInfo.therapy}</h3>
                  <div className="therapist-badge">{therapistInfo.therapist}</div>
                </div>

                <div className="session-info">
                  <strong>Σύνολο Συνεδριών:</strong> {therapistInfo.sessionCount}
                </div>

                {therapistInfo.sessionDates && therapistInfo.sessionDates.length > 0 ? (
                  <div className="session-dates">
                    <h4>Ημερομηνίες Συνεδριών:</h4>
                    <div className="dates-grid">
                      {therapistInfo.sessionDates.flatMap((dateObj, idx) =>
                        // Create multiple items for sessions with count > 1
                        Array.from({ length: dateObj.count }, (_, i) => (
                          <div key={`${idx}-${i}`} className="date-item">
                            {formatDate(dateObj.date)} ({getGreekWeekday(dateObj.date)})
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-dates-warning">
                    ⚠️ Ο θεραπευτής δεν έχει προγραμματισμένες ημέρες εργασίας για αυτή την περίοδο
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showMonthSelection && extractedTherapyData) {
    // Group therapies by date range
    const periodGroups = {};

    extractedTherapyData.therapies.forEach(therapy => {
      const periodKey = `${therapy.dateFrom}-${therapy.dateTo}`;
      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = {
          dateFrom: therapy.dateFrom,
          dateTo: therapy.dateTo,
          therapies: [],
          id: periodKey
        };
      }
      periodGroups[periodKey].therapies.push(therapy.therapy);
    });

    // Convert to array and remove duplicates in therapy lists
    const groupedPeriods = Object.values(periodGroups).map(group => ({
      ...group,
      therapies: [...new Set(group.therapies)] // Remove duplicate therapy names
    }));

    const handlePeriodClick = (period) => {
      // Get therapy information for the selected period
      const therapiesForPeriod = extractedTherapyData.therapies.filter(
        t => `${t.dateFrom}-${t.dateTo}` === period.id
      );

      // Group by therapy type and count sessions
      const therapyInfo = {};
      therapiesForPeriod.forEach(therapy => {
        if (!therapyInfo[therapy.therapy]) {
          therapyInfo[therapy.therapy] = {
            count: 0,
            sessions: []
          };
        }
        therapyInfo[therapy.therapy].count += therapy.number;
        therapyInfo[therapy.therapy].sessions.push({
          number: therapy.number,
          dateFrom: therapy.dateFrom,
          dateTo: therapy.dateTo
        });
      });

      // Get therapist info from selectedTherapists and calculate session distribution
      const therapistsInfo = extractedTherapyData.sessions.map((session, index) => {
        const therapistName = selectedTherapists[index] || 'Δεν επιλέχθηκε';
        const sessionCount = session.count;

        // Calculate session dates for this therapist
        const sessionDates = distributeSessionsInMonth(
          therapistName,
          sessionCount,
          period.dateFrom,
          period.dateTo
        );

        return {
          therapy: session.type,
          therapist: therapistName,
          sessionCount: sessionCount,
          sessionDates: sessionDates
        };
      });

      const finalData = {
        receiptNumber: '', // Empty
        parentName: selectedPerson.parentFullName || '', // From selected person
        parentAmka: selectedPerson.parentAmka || '', // From selected person
        opinionNumber: selectedPerson.opinionCode || '', // From selected person
        studentName: extractedTherapyData.fullName || '',
        studentAmka: confirmedAmka || extractedTherapyData.amka || '',
        periodStart: period.dateFrom,
        periodEnd: period.dateTo,
        therapyInfo: therapyInfo,
        therapists: therapistsInfo
      };

      setFinalInfoData(finalData);

      // Initialize editable info with data from finalData
      setEditableInfo({
        receiptNumber: finalData.receiptNumber || '',
        parentName: finalData.parentName || '',
        parentAmka: finalData.parentAmka || '',
        opinionNumber: finalData.opinionNumber || '',
        studentName: finalData.studentName || '',
        studentAmka: finalData.studentAmka || ''
      });

      setShowFinalInfo(true);
    };

    return (
      <div className="file-uploader">
        <button className="back-button" onClick={() => setShowMonthSelection(false)}>
          <span className="back-arrow">←</span> Επιστροφή
        </button>

        <h2 className="uploader-title">Διαλέξτε για ποιον μήνα θέλετε βεβαίωση</h2>

        <div className="month-selection-list">
          {groupedPeriods.map((period) => (
            <div
              key={period.id}
              className="month-period-item clickable"
              onClick={() => handlePeriodClick(period)}
            >
              <div className="month-period-label">
                <span className="period-therapy">
                  {period.therapies.join(', ')}
                </span>
                <span className="period-dates">
                  από <strong>{period.dateFrom}</strong> έως <strong>{period.dateTo}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (extractedTherapyData) {
    // Group therapies by therapy type
    const therapiesByType = {};
    extractedTherapyData.therapies.forEach(therapy => {
      if (!therapiesByType[therapy.therapy]) {
        therapiesByType[therapy.therapy] = [];
      }
      therapiesByType[therapy.therapy].push(therapy);
    });

    const handleTherapyClick = (therapyType) => {
      // Open modal with therapy referrals
      if (therapiesByType[therapyType]) {
        setSelectedTherapyForModal(therapyType);
        setShowTherapyModal(true);
      }
    };

    const handleCloseModal = () => {
      setShowTherapyModal(false);
      setSelectedTherapyForModal(null);
    };

    const handleProceedToMonthSelection = () => {
      setShowMonthSelection(true);
    };

    const handleTherapistChange = (sessionIndex, therapistName) => {
      setSelectedTherapists(prev => ({
        ...prev,
        [sessionIndex]: therapistName
      }));
    };

    // Check if all therapists are selected
    const allTherapistsSelected = extractedTherapyData.sessions.every((session, index) =>
      selectedTherapists[index] && selectedTherapists[index] !== ''
    );

    return (
      <>
        <div className="file-uploader">
          <button className="back-button" onClick={onBack}>
            <span className="back-arrow">←</span> Επιστροφή
          </button>

          <h2 className="uploader-title">Εξαγόμενα Δεδομένα Θεραπείας</h2>

          {(extractedTherapyData.fullName || extractedTherapyData.amka) && (
            <div className="extracted-patient-info">
              {extractedTherapyData.fullName && (
                <div className="patient-info-item">
                  <strong>Ονοματεπώνυμο:</strong> {extractedTherapyData.fullName}
                </div>
              )}
              {extractedTherapyData.amka && (
                <div className="patient-info-item">
                  <strong>ΑΜΚΑ:</strong> {extractedTherapyData.amka}
                </div>
              )}
            </div>
          )}

          <div className="therapy-data-display">
            <div className="therapy-section">
              <h3>Επιλέξτε Θεραπευτή για κάθε θεραπεία</h3>
              {extractedTherapyData.sessions.length > 0 ? (
                <div className="therapy-column-list">
                  {extractedTherapyData.sessions.map((session, index) => (
                    <div
                      key={index}
                      className="therapy-row-item"
                    >
                      <div
                        className={`therapy-info ${therapiesByType[session.type] ? 'clickable' : ''}`}
                        onClick={() => therapiesByType[session.type] && handleTherapyClick(session.type)}
                        style={{ cursor: therapiesByType[session.type] ? 'pointer' : 'default' }}
                      >
                        <span className="therapy-type">{session.type}</span>
                        <span className="therapy-count">{session.count} συνεδρίες</span>
                      </div>
                      <select
                        className="therapist-dropdown"
                        value={selectedTherapists[index] || ''}
                        onChange={(e) => handleTherapistChange(index, e.target.value)}
                      >
                        <option value="">Επιλέξτε θεραπευτή...</option>
                        {therapists && therapists
                          .filter((therapist) => {
                            // Filter therapists by the therapy type
                            const therapistType = typeof therapist === 'object' ? therapist.type : '';
                            const sessionType = session.type;

                            // If therapist has no type (old format), show all
                            if (!therapistType) return true;

                            // Match the therapy type
                            return therapistType === sessionType;
                          })
                          .map((therapist, idx) => {
                            const name = typeof therapist === 'string' ? therapist : therapist.name;
                            return (
                              <option key={idx} value={name}>
                                {name}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Δεν βρέθηκαν δεδομένα συνεδριών</p>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary continue-button-spaced"
            onClick={handleProceedToMonthSelection}
            disabled={!allTherapistsSelected}
          >
            Προχωρήστε
          </button>
        </div>

        {showTherapyModal && selectedTherapyForModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal therapy-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedTherapyForModal}</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <h4>Παραπεμπτικά:</h4>
                <div className="referral-list">
                  {therapiesByType[selectedTherapyForModal].map((referral, index) => (
                    <div key={index} className="referral-item">
                      <span className="referral-number">{referral.number}</span>
                      <span className="referral-dates">
                        με διάρκεια ισχύος από <strong>{referral.dateFrom}</strong> έως <strong>{referral.dateTo}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="file-uploader">
      <button className="back-button" onClick={onBack}>
        <span className="back-arrow">←</span> Επιστροφή
      </button>

      <h2 className="uploader-title">
        Επιλέξτε την γνωμάτευση του μαθητή.
      </h2>

      <div className="selected-person-info">
        <strong>Επιλεγμένος μαθητής:</strong> {selectedPerson.lastName} {selectedPerson.firstName}
      </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!file ? (
          <div className="drop-zone-content">
            <div className="drop-icon">📄</div>
            <p className="drop-text">Σύρετε και αφήστε το αρχείο PDF εδώ</p>
            <p className="drop-text-secondary">ή κάντε κλικ για να επιλέξετε αρχείο</p>
          </div>
        ) : (
          <div className="file-selected">
            <div className="file-icon">✓</div>
            <p className="file-name">{file.name}</p>
            <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="btn btn-primary continue-button"
        onClick={handleContinue}
        disabled={!file}
      >
        Προχωρήστε
      </button>

      {showAmkaConflictModal && conflictAmkaData && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal amka-conflict-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Αναντιστοιχία ΑΜΚΑ</h3>
            </div>
            <div className="modal-body">
              <p className="amka-warning-text">
                Το ΑΜΚΑ από το PDF είναι διαφορετικό από το ΑΜΚΑ του επιλεγμένου μαθητή.
              </p>
              <p className="amka-warning-text">Παρακαλώ επιλέξτε ποιο ΑΜΚΑ θέλετε να χρησιμοποιήσετε για να συνεχίσετε:</p>

              <div className="amka-options">
                <div className="amka-option-card">
                  <h4>ΑΜΚΑ από PDF</h4>
                  <p className="amka-number">{conflictAmkaData.pdfAmka}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAmkaChoice(conflictAmkaData.pdfAmka)}
                  >
                    Επιλογή ΑΜΚΑ από PDF
                  </button>
                </div>

                <div className="amka-option-card">
                  <h4>ΑΜΚΑ Μαθητή</h4>
                  <p className="amka-number">{conflictAmkaData.personAmka}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAmkaChoice(conflictAmkaData.personAmka)}
                  >
                    Επιλογή ΑΜΚΑ Μαθητή
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                <p style={{ marginBottom: '10px', fontSize: '14px' }}>ή</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAmkaConflictModal(false);
                    setConflictAmkaData(null);
                    onBack();
                  }}
                >
                  Επιστροφή για επιλογή άλλου μαθητή
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateAmkaModal && pendingPdfAmka && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal update-amka-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ενημέρωση ΑΜΚΑ Μαθητή</h3>
            </div>
            <div className="modal-body">
              <p className="update-amka-question">
                Θέλετε να ενημερώσετε το ΑΜΚΑ του μαθητή <strong>{selectedPerson.lastName} {selectedPerson.firstName}</strong> στον πίνακα με το ΑΜΚΑ από το PDF;
              </p>

              <div className="amka-update-info">
                <div className="amka-change-row">
                  <span className="amka-label">Τρέχον ΑΜΚΑ:</span>
                  <span className="amka-old">{selectedPerson.childAmka}</span>
                </div>
                <div className="amka-arrow">↓</div>
                <div className="amka-change-row">
                  <span className="amka-label">Νέο ΑΜΚΑ:</span>
                  <span className="amka-new">{pendingPdfAmka}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateAmkaConfirmation(true)}
                >
                  Ναι, Ενημέρωση ΑΜΚΑ
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleUpdateAmkaConfirmation(false)}
                >
                  Όχι, Συνέχεια χωρίς Ενημέρωση
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
