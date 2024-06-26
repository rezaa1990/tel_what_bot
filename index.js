const venom = require("venom-bot");
const { Telegraf } = require("telegraf");
const axios = require("axios");
const fs = require("fs");

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(telegramBotToken);

venom
  .create({
    session: process.env.SESSION_ID, // name of session
  })
  .then((client) => startWhatsAppBot(client))
  .catch((error) => {
    console.error("Error starting WhatsApp bot:", error);
  });

// گوش دادن به رویداد message برای خواندن پیام‌های ارسال شده در کانال
function startWhatsAppBot(client) {
  client.onMessage(async (message) => {
    console.log("message:", message);
    if (message.isGroupMsg) {
      // چک کردن اینکه پیام در یک گروه ارسال شده است یا خیر
      console.log("پیام در یک گروه ارسال شده است:");
      console.log("گروه:", message.chat.title);
      console.log("متن پیام:", message.body);
    }
  });
  bot.on("channel_post", async (ctx) => {
    const channel_post = ctx.update.channel_post;

    if (channel_post.chat.type === "channel") {
      if (channel_post.photo) {
        try {
          const photo = channel_post.photo;
          const fileId = photo[photo.length - 1].file_id;

          // دریافت اطلاعات فایل
          const file = await bot.telegram.getFile(fileId);
          const downloadLink = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`;

          // دانلود عکس
          const imagePath = `/home/reza/Desktop/${fileId}.jpg`; // مسیر ذخیره عکس
          await downloadImage(downloadLink, imagePath);

          // ارسال عکس به واتساپ

          await client.sendImage(
            process.env.USER_ID, // شماره واتساپ مقصد
            imagePath, // مسیر عکس دانلود شده
            "name",
            "Caption text"
          );
          await client.sendImage(
            process.env.GROUP_ID, // شماره واتساپ مقصد
            imagePath, // مسیر عکس دانلود شده
            "name",
            "Caption text"
          );
        } catch (error) {
          console.error("Error:", error);
        }
      }
      //       else if (channel_post.document) {
      //   const document = channel_post.document; // گرفتن آی‌دی فایل ارسال شده
      //   console.log('document:',document)

      //   // ارسال فایل به واتساپ
      //   await client.sendFile(
      //     "989366487149@c.us", // شماره واتساپ مقصد
      //     document.file_id, // آی‌دی فایل
      //     "Document Caption" // عنوان فایل (اختیاری)
      //   );
      // }
      else {
        // ارسال متن پیام به واتساپ
        await client.sendText(
          process.env.USER_ID, // شماره واتساپ مقصد
          channel_post.text // متن پیام
        );
        await client.sendText(
          process.env.GROUP_ID, // شماره واتساپ مقصد
          channel_post.text // متن پیام
        );
      }
    }
  });
}

// تابع برای دانلود عکس از لینک
async function downloadImage(url, path) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });
  response.data.pipe(fs.createWriteStream(path));
  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve();
    });
    response.data.on("error", (err) => {
      reject(err);
    });
  });
}

bot.launch();
