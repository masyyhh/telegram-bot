const db = require('./database');
const bot = require('./bot');
const cron = require('node-cron');
const moment = require('moment-timezone');

cron.schedule('* * * * *', async () => {
    try {
        const now = moment().format('HH:mm:ss');
        const today = moment().format('dddd');

        const [upcomingClasses] = await db.query(
            'SELECT user_id, class_name FROM classes WHERE day_of_week = ? AND TIMEDIFF(start_time, ?) = "00:10:00"',
            [today, now]
        );

        upcomingClasses.forEach(c => {
            bot.telegram.sendMessage(c.user_id, `⏳ Reminder: Your class "${c.class_name}" starts in 10 minutes!`);
        });
    } catch (error) {
        console.error('Error sending reminders:', error);
    }
});
