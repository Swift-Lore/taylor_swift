// src/config/site-updates.js
export const SITE_UPDATES = {
  lastUpdated: 'April 2026',
  totalEvents: 5746,
  firstYear: 2003
};

// Helper function to format the update text
export function getUpdateText() {
  return `Last updated: ${SITE_UPDATES.lastUpdated} · Currently tracking ${SITE_UPDATES.totalEvents}+ Taylor Swift events from ${SITE_UPDATES.firstYear} to present.`;
}