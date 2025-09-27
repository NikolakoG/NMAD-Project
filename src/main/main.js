const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { sendEmailNotification, sendAlertEmail } = require('./emailService');

let mainWindow;
let dataFilePath;
let emailTrackingPath;
let emailCheckInterval;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }
};

app.whenReady().then(() => {
  // Set up data file paths in user data directory
  dataFilePath = path.join(app.getPath('userData'), 'entries.json');
  emailTrackingPath = path.join(app.getPath('userData'), 'email-tracking.json');
  
  createWindow();
  
  // Initialize email scheduling system
  initializeEmailScheduler();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Clean up email check interval
    if (emailCheckInterval) {
      clearInterval(emailCheckInterval);
    }
    app.quit();
  }
});

// IPC handlers for data operations
ipcMain.handle('load-entries', async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist
    return [];
  }
});

ipcMain.handle('save-entries', async (event, entries) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(entries, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-email-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'email-config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('save-email-config', async (event, config) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'email-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


ipcMain.handle('send-alert-email', async (_, config, entries) => {
  return await sendAlertEmail(config, entries);
});

ipcMain.handle('get-email-tracking', async () => {
  return await loadEmailTracking();
});

// Email scheduling system
async function initializeEmailScheduler() {
  try {
    // Check for missed days on startup
    await checkMissedDaysAndSendEmails();
    
    // Set up daily check every minute to wait for 13:00
    emailCheckInterval = setInterval(checkDailyEmailTime, 60 * 1000);
    
    console.log('Σύστημα αυτόματων email αρχικοποιήθηκε - έλεγχος κάθε λεπτό για 13:00 (Ώρα Ελλάδας)');
  } catch (error) {
    console.error('Σφάλμα αρχικοποίησης συστήματος email:', error);
  }
}

async function checkDailyEmailTime() {
  try {
    // Get current time in Greece timezone (Europe/Athens)
    const now = new Date();
    const greeceTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
    const currentHour = greeceTime.getHours();
    const currentMinute = greeceTime.getMinutes();
    
    console.log(`⏰ Current Greece time: ${greeceTime.toLocaleString()} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
    
    // Check if it's 13:00 (1 PM) in Greece
    if (currentHour === 13 && currentMinute === 0) {
      console.log('🎯 It\'s 13:00 in Greece - sending daily emails!');
      await sendDailyExpirationEmails();
    }
  } catch (error) {
    console.error('Σφάλμα κατά τον έλεγχο ώρας αποστολής email:', error);
  }
}

async function checkMissedDaysAndSendEmails() {
  try {
    console.log('🔄 Checking for missed days and sending catch-up emails...');
    
    const tracking = await loadEmailTracking();
    
    // Use Greece timezone for all date calculations
    const now = new Date();
    const greeceNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
    const today = new Date(greeceNow.getFullYear(), greeceNow.getMonth(), greeceNow.getDate());
    
    console.log('📊 Email tracking data:', tracking);
    console.log('📅 Today (Greece):', today.toISOString());
    console.log('📅 Current Greece time:', greeceNow.toLocaleString());
    
    if (!tracking.lastEmailDate) {
      // First time running, just set today's date at noon Greece time
      const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0);
      await saveEmailTracking({ lastEmailDate: todayAtNoon.toISOString() });
      console.log('🆕 Πρώτη εκτέλεση - αρχικοποίηση ημερομηνίας email');
      return;
    }
    
    const lastEmailDate = new Date(tracking.lastEmailDate);
    const lastEmailDay = new Date(lastEmailDate.getFullYear(), lastEmailDate.getMonth(), lastEmailDate.getDate());
    
    console.log('📅 Last email date:', lastEmailDate.toISOString());
    console.log('📅 Last email day:', lastEmailDay.toISOString());
    
    // Calculate days difference using Greece timezone
    const daysDifference = Math.floor((today - lastEmailDay) / (1000 * 60 * 60 * 24));
    console.log(`⏰ Days since last email: ${daysDifference}`);
    
    if (daysDifference > 0) {
      console.log(`🚨 Εντοπίστηκαν ${daysDifference} ημέρες χωρίς αποστολή email - αποστολή τώρα...`);
      
      // Show alert to user
      if (mainWindow) {
        mainWindow.webContents.send('show-catchup-alert', daysDifference);
      }
      
      await sendDailyExpirationEmails(true); // true = catch-up mode
    } else {
      console.log('✅ No missed days detected');
    }
  } catch (error) {
    console.error('Σφάλμα κατά τον έλεγχο χαμένων ημερών:', error);
  }
}

async function sendDailyExpirationEmails(isCatchUp = false) {
  try {
    console.log(`🔍 sendDailyExpirationEmails called - isCatchUp: ${isCatchUp}`);

    // Show the email sending modal
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('show-email-sending-modal');
    }

    const entries = await loadEntries();
    console.log(`📊 Loaded ${entries.length} total entries`);
    
    const emailConfig = await getEmailConfig();
    
    if (!emailConfig) {
      console.log('❌ Δεν βρέθηκαν ρυθμίσεις email - παράλειψη αυτόματης αποστολής');
      return;
    }
    
    console.log('✅ Email config found:', { user: emailConfig.user, notifyEmail: emailConfig.notifyEmail });
    
    const today = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);
    
    console.log(`📅 Checking entries expiring between now and ${tenDaysFromNow.toLocaleDateString()}`);
    
    const expiringEntries = entries.filter(entry => {
      const endDate = new Date(entry.endingDate);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      console.log(`  - ${entry.name}: expires ${endDate.toLocaleDateString()} (${daysUntilExpiry} days)`);
      return endDate <= tenDaysFromNow; // This includes expired entries (endDate < today) and expiring entries
    });
    
    console.log(`🔔 Found ${expiringEntries.length} entries expiring within 10 days`);
    
    if (expiringEntries.length > 0) {
      let successCount = 0;
      let failedCount = 0;
      
      // Send individual email for each entry
      for (const entry of expiringEntries) {
        const daysUntilExpiry = Math.ceil((new Date(entry.endingDate) - today) / (1000 * 60 * 60 * 24));
        const result = await sendEmailNotification(emailConfig, entry, daysUntilExpiry);
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          console.error(`Αποτυχία αποστολής email για γνωμάτευση: ${entry.name} - ${result.error}`);
        }
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const mode = isCatchUp ? 'catch-up' : 'κανονική';
      console.log(`Καθημερινά αυτόματα emails (${mode}) - Επιτυχής αποστολή: ${successCount}, Αποτυχίες: ${failedCount} από ${expiringEntries.length} συνολικά`);
      
      // Notify frontend about the results
      if (mainWindow && mainWindow.webContents) {
        const resultsData = {
          mode: String(mode),
          successCount: Number(successCount),
          failedCount: Number(failedCount),
          totalCount: Number(expiringEntries.length),
          isCatchUp: Boolean(isCatchUp)
        };
        mainWindow.webContents.send('automatic-email-results', resultsData);
      }
    } else {
      console.log('ℹ️ Δεν βρέθηκαν γνωματεύσεις για αυτόματο email - παράλειψη αποστολής');
    }
    
    // Update tracking with current timestamp
    const now = new Date();
    await saveEmailTracking({ lastEmailDate: now.toISOString() });

  } catch (error) {
    console.error('Σφάλμα κατά την αποστολή καθημερινών emails:', error);
  } finally {
    // Hide the email sending modal
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('hide-email-sending-modal');
    }
  }
}

async function loadEntries() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function getEmailConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'email-config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function loadEmailTracking() {
  try {
    const data = await fs.readFile(emailTrackingPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { lastEmailDate: null };
  }
}

async function saveEmailTracking(tracking) {
  try {
    await fs.writeFile(emailTrackingPath, JSON.stringify(tracking, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Σφάλμα αποθήκευσης παρακολούθησης email:', error);
    return { success: false, error: error.message };
  }
}