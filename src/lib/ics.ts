export const generateICS = (event: {
    title: string;
    description: string;
    location: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
}) => {
    const formatDate = (dateStr: string) => {
        return dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = formatDate(new Date().toISOString());
    const start = formatDate(event.startTime);
    const end = formatDate(event.endTime);

    const checkSum = now + '-' + Math.random().toString(36).substring(2, 10);

    const calendarEvent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Project Vector//Secure Schedule//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        `UID:${checkSum}@projectvector.local`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([calendarEvent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'appointment.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
