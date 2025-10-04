// Shared holiday utilities

export const fixedHolidays = [
  { month: 1, day: 1, name: 'Πρωτοχρονιά' },
  { month: 1, day: 6, name: 'Θεοφάνεια' },
  { month: 3, day: 25, name: 'Ευαγγελισμός / Εθνική Εορτή' },
  { month: 5, day: 1, name: 'Πρωτομαγιά' },
  { month: 8, day: 15, name: 'Κοίμηση Θεοτόκου' },
  { month: 10, day: 28, name: 'Εθνική Εορτή (Όχι)' },
  { month: 12, day: 25, name: 'Χριστούγεννα' },
  { month: 12, day: 26, name: 'Σύναξη Θεοτόκου' }
];

// Calculate Orthodox Easter for a given year using Meeus's algorithm
export const calculateOrthodoxEaster = (year) => {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const easterMonth = Math.floor((d + e + 114) / 31);
  const easterDay = ((d + e + 114) % 31) + 1;

  // Add 13 days for Julian to Gregorian calendar conversion
  const easterDate = new Date(year, easterMonth - 1, easterDay);
  easterDate.setDate(easterDate.getDate() + 13);

  return easterDate;
};

// Calculate moving holidays based on Easter
export const calculateMovingHolidays = (year) => {
  const easterDate = calculateOrthodoxEaster(year);

  const cleanMonday = new Date(easterDate);
  cleanMonday.setDate(cleanMonday.getDate() - 48);

  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);

  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);

  const holySpirit = new Date(easterDate);
  holySpirit.setDate(holySpirit.getDate() + 50);

  return [
    { date: cleanMonday, name: 'Καθαρά Δευτέρα' },
    { date: goodFriday, name: 'Μεγάλη Παρασκευή' },
    { date: easterDate, name: 'Κυριακή του Πάσχα' },
    { date: easterMonday, name: 'Δευτέρα του Πάσχα' },
    { date: holySpirit, name: 'Αγίου Πνεύματος' }
  ];
};

// Check if a date is a Greek public holiday
export const isGreekPublicHoliday = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Check fixed holidays
  if (fixedHolidays.some(h => h.month === month && h.day === day)) {
    return true;
  }

  // Check moving holidays
  const movingHolidays = calculateMovingHolidays(year);
  return movingHolidays.some(holiday =>
    holiday.date.getDate() === day &&
    holiday.date.getMonth() + 1 === month &&
    holiday.date.getFullYear() === year
  );
};

// Get all public holidays for a year (for display purposes)
export const getPublicHolidays = (
  year, 
  //includeMovingHolidays = true
) => {
  const holidays = [];

  // Add fixed holidays
  fixedHolidays.forEach(h => {
    const date = new Date(year, h.month - 1, h.day);
    holidays.push({
      date: date,
      name: h.name,
      type: 'fixed'
    });
  });

  // Add moving holidays if requested
  // if (includeMovingHolidays) {
  //   const movingHolidays = calculateMovingHolidays(year);
  //   movingHolidays.forEach(h => {
  //     holidays.push({
  //       date: h.date,
  //       name: h.name,
  //       type: 'moving'
  //     });
  //   });
  // }

  // Sort by date
  holidays.sort((a, b) => a.date - b.date);

  return holidays;
};
