const nodemailer = require('nodemailer');

async function sendEmailNotification(emailConfig, entry, daysUntilExpiry) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password
      }
    });

    const mailOptions = {
      from: emailConfig.user,
      to: emailConfig.notifyEmail,
      subject: `Γνωμάτευση πρόκειται να λήξει: ${entry.name}`,
      html: `
        <h3>Γνωμάτευση πρόκειται να λήξει</h3>
        <p><strong>Ονοματεπώνυμο:</strong> ${entry.name}</p>
        <p><strong>Ημερομηνία Έναρξης:</strong> ${new Date(entry.startingDate).toLocaleDateString()}</p>
        <p><strong>Ημερομηνία Λήξης:</strong> ${new Date(entry.endingDate).toLocaleDateString()}</p>
        <p><strong>Ημέρες μέχρι τη λήξη:</strong> ${daysUntilExpiry}</p>
        <hr>
        <p>Αυτή είναι μια αυτοματοποιημένη ειδοποίηση από το Πρόγραμμα Διαχείρισης Γνωματεύσεων.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Στάλθηκε ειδοποίηση email για τη γνωμάτευση: ${entry.name}`);
    return { success: true };
  } catch (error) {
    console.error('Σφάλμα κατά την αποστολή ειδοποίησης email:', error);
    return { success: false, error: error.message };
  }
}

async function sendAlertEmail(emailConfig, entries) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password
      }
    });

    let entriesList = '';
    entries.forEach(entry => {
      const daysUntilExpiry = Math.ceil((new Date(entry.endingDate) - new Date()) / (1000 * 60 * 60 * 24));
      let statusText;
      if (daysUntilExpiry < 0) {
        statusText = `Έληξε πριν ${Math.abs(daysUntilExpiry)} ημέρες`;
      } else if (daysUntilExpiry === 0) {
        statusText = 'Λήγει σήμερα';
      } else if (daysUntilExpiry === 1) {
        statusText = 'Λήγει αύριο';
      } else {
        statusText = `${daysUntilExpiry} ημέρες απομένουν`;
      }
      
      entriesList += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${entry.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(entry.startingDate).toLocaleDateString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(entry.endingDate).toLocaleDateString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${statusText}</td>
        </tr>
      `;
    });

    const mailOptions = {
      from: emailConfig.user,
      to: emailConfig.notifyEmail,
      subject: `Περίληψη: ${entries.length} γνωματεύσεις που έχουν λήξει ή λήγουν σε 10 ημέρες`,
      html: `
        <h3>Γνωματεύσεις που έχουν λήξει ή λήγουν σύντομα - Περίληψη</h3>
        <p>Οι παρακάτω ${entries.length} γνωματεύσεις έχουν λήξει ή λήγουν τις επόμενες 10 ημέρες:</p>

        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Ονοματεπώνυμο</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Ημερομηνία Έναρξης</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Ημερομηνία Λήξης</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Κατάσταση</th>
            </tr>
          </thead>
          <tbody>
            ${entriesList}
          </tbody>
        </table>
        
        <hr style="margin: 20px 0;">
        <p><em>Αυτή είναι μια αυτοματοποιημένη ειδοποίηση από το Διαχείριση Γνωματεύσεων.</em></p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Περιληπτικό email στάλθηκε για ${entries.length} γνωματεύσεις που λήγουν σύντομα`);
    return { success: true };
  } catch (error) {
    console.error('Σφάλμα κατά την αποστολή περιληπτικού email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmailNotification,
  sendAlertEmail
};