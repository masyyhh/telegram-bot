const db = require('../database');
const moment = require('moment-timezone');

exports.addClass = async (ctx) => {
    try {
        const [name, day, start, end, location] = ctx.message.text.split(' ').slice(1);
        const userId = ctx.from.id;

        await db.query(
            'INSERT INTO classes (user_id, class_name, day_of_week, start_time, end_time, location) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, day, start, end, location || null]
        );

        ctx.reply(`Class "${name}" added on ${day} from ${start} to ${end}.`);
    } catch (error) {
        ctx.reply('Error adding class.');
        console.error(error);
    }
};

exports.getTodayClasses = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const today = moment().format('dddd');

        const [classes] = await db.query(
            'SELECT class_name, start_time, end_time, location FROM classes WHERE user_id = ? AND day_of_week = ? ORDER BY start_time',
            [userId, today]
        );

        if (classes.length === 0) return ctx.reply('No classes today.');

        let response = `📅 Today's Classes:\n`;
        classes.forEach(c => {
            response += `📌 ${c.class_name} (${c.start_time} - ${c.end_time}) ${c.location ? `@ ${c.location}` : ''}\n`;
        });

        ctx.reply(response);
    } catch (error) {
        ctx.reply('Error fetching classes.');
        console.error(error);
    }
};

exports.getNextClass = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const now = moment().format('HH:mm:ss');
        const today = moment().format('dddd');

        const [nextClass] = await db.query(
            'SELECT class_name, start_time, end_time, location FROM classes WHERE user_id = ? AND day_of_week = ? AND start_time > ? ORDER BY start_time LIMIT 1',
            [userId, today, now]
        );

        if (nextClass.length === 0) return ctx.reply('No more classes today.');

        const c = nextClass[0];
        ctx.reply(`🕒 Next class: ${c.class_name} (${c.start_time} - ${c.end_time}) ${c.location ? `@ ${c.location}` : ''}`);
    } catch (error) {
        ctx.reply('Error fetching next class.');
        console.error(error);
    }
};
