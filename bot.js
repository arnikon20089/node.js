const TelegramBot = require('node-telegram-bot-api');

const token = '7960226570:AAF6CFwz03IO9TG3NcsYPFJK5U9aKVIFnUY';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет, октагон!');
});

console.log('Бот запущен...');