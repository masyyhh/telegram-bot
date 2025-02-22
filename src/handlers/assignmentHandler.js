const { google } = require('googleapis');
const db = require('../database');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

exports.addAssignment = async (ctx) => {
    try {
        const [title, dueDate] = ctx.message.text.split(' ').slice(1);
        const userId = ctx.from.id;

        const event = {
            summary: title,
            start: { dateTime: new Date(dueDate).toISOString(), timeZone: 'UTC' },
            end: { dateTime: new Date(dueDate).toISOString(), timeZone: 'UTC' },
        };

        const { data } = await calendar.events.insert({ calendarId: 'primary', resource: event });

        await db.query(
            'INSERT INTO assignments (user_id, title, due_date, google_event_id) VALUES (?, ?, ?, ?)',
            [userId, title, dueDate, data.id]
        );

        ctx.reply(`✅ Assignment "${title}" added to Google Calendar.`);
    } catch (error) {
        ctx.reply('Error adding assignment.');
        console.error(error);
    }
};
