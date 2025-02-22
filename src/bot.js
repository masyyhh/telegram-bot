require("dotenv").config();
const { Telegraf } = require("telegraf");
const mysql = require("mysql2/promise");

// Initialize bot with token from .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Start command with reply keyboard
bot.command("start", async (ctx) => {
    const keyboard = [
        ["Show Today's Schedule", "Add a Class"],
        ["Upcoming Assignments", "Help"]
    ];

    await ctx.reply("Welcome! Choose an option from the menu below:", {
        reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true }
    });
});

// Help command with inline keyboard buttons
bot.command("help", async (ctx) => {
    const helpMessage = `
    Available commands:
    /start - Start the bot
    /help - Show this help message
    /today - Show today's schedule
    /add_class - Add a new class (follow instructions)
    /assignments - View upcoming assignments
    `;

    const keyboard = [
        [
            { text: "Show Today's Schedule", callback_data: "today_schedule" },
            { text: "Add a Class", callback_data: "add_class" },
        ],
        [
            { text: "Upcoming Assignments", callback_data: "view_assignments" }
        ]
    ];

    await ctx.reply(helpMessage, {
        reply_markup: { inline_keyboard: keyboard }
    });
});

// Handle add_class command (providing instructions)
bot.command("add_class", async (ctx) => {
    const instructionMessage = `
    To add a class, please use the following format:
    /add_class <class_name> <day> <start_time> <end_time>
    
    Example:
    /add_class "Math 101" Monday "09:00" "11:00"
    
    This will add "Math 101" on Monday from 9 AM to 11 AM.
    `;
    
    await ctx.reply(instructionMessage);
});

// Handle button presses (inline keyboard callback)
bot.on("callback_query", async (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    // Handle different button clicks
    if (callbackData === "today_schedule") {
        await ctx.reply("Fetching today's schedule...");
    } else if (callbackData === "add_class") {
        // Trigger the instruction for adding a class
        await ctx.reply("To add a class, use the format: \n\n/add_class <class_name> <day> <start_time> <end_time>");
    } else if (callbackData === "view_assignments") {
        await ctx.reply("Fetching upcoming assignments...");
    }

    // Acknowledge the callback query to remove the loading state
    await ctx.answerCallbackQuery();
});

// Fetch today's schedule
bot.command("today", async (ctx) => {
    const today = new Date().toLocaleString("en-US", { weekday: "long" });
    const userId = ctx.from.id;

    const [rows] = await db.query(
        "SELECT class_name, start_time, end_time FROM classes WHERE user_id = ? AND day_of_week = ? ORDER BY start_time",
        [userId, today]
    );

    if (rows.length === 0) {
        return ctx.reply("No classes scheduled for today.");
    }

    let message = "📅 *Today's Schedule:*\n";
    rows.forEach((row) => {
        message += `📌 *${row.class_name}* - ${row.start_time} to ${row.end_time}\n`;
    });

    await ctx.replyWithMarkdown(message);
});

// Launch the bot
bot.launch().catch((err) => {
    console.error("Failed to start bot:", err);
});
