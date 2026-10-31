// Інструкція для запуску:
// 1. npm init -y && npm install node-telegram-bot-api dotenv
// 2. Створіть файл .env з рядком: TELEGRAM_BOT_TOKEN=9236187437:AAHBq3im6TITQFVc_G9Wyg8l4acZZi_0wNA
// 3. Запуск: node bot.js

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || "9236187437:AAHBq3im6TITQFVc_G9Wyg8l4acZZi_0wNA";
const webAppUrl = "https://totoshop-creator.github.io/scrp.nexus.app/";

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 SCRP Nexus Bot запущен та очікує команди...");

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Вітаю, Операторе! 🛡️ Ласкаво просимо до фінансового термінала **SCRP Nexus**.", {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Відкрити Nexus WebApp", web_app: { url: webAppUrl } }],
                [{ text: "📊 Додати витрату швидко", callback_data: "quick_expense" }]
            ]
        }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'quick_expense') {
        bot.sendMessage(chatId, "Будь ласка, відкрийте повноцінний WebApp для зручного обліку витрат та перегляду AI-аналітики.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 Запустити термінал", web_app: { url: webAppUrl } }]
                ]
            }
        });
    }
    bot.answerCallbackQuery(query.id);
});

// Щоденне нагадування (приклад імітації шедулера)
setInterval(() => {
    // Тут можна підключити збережені chatId користувачів для розсилки нагадувань внести витрати
}, 86400000);
