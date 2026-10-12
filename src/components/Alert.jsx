/**
 * Displays informational feedback supplied by App, such as an unmatched city search.
 * The status role announces the text without interrupting keyboard interaction.
 */
const InfoAlert = ({ text }) => <p className="alert info-alert" role="status">{text}</p>;
/**
 * Displays App-provided warnings, including the offline-data notice.
 * Uses the shared alert styling with a distinct warning tone and status role.
 */
const WarningAlert = ({ text }) => <p className="alert warning-alert" role="status">{text}</p>;
export { InfoAlert, WarningAlert };
