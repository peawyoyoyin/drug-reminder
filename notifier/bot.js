const LineBot = require('linebot')
let botConfig
try {
  botConfig = require('./bot-config')
} catch {
  console.error('bot config file not found, create bot-config.js first')
  exit(1)
}
const CronJobs = require('./cron')


const bot = LineBot(botConfig)

bot.on('message', (event) => {
  console.log(event)
  if(event.message.type === 'text') {
      if(event.message.text.startsWith('cancel')) {
        const jobId = event.message.text.split(' ')[1];
        const success = CronJobs.stopJob(event.source.userId, jobId);
        if (success) {
          event.reply({
            type: 'text',
            text: `successfully canceled job ${jobId}`
          })
        }
        return
      }

      const second = parseInt(event.message.text);

      if(isNaN(second)) {
        event.reply({
          type: 'text',
          text: `not a number`
        })
        return
      }

      const jobId = CronJobs.registerNewJob(event.source.userId,
        () => {
          bot.push(event.source.userId, {
            type: 'text',
            text: `automatic notification from job ${jobId}`
          })
        },
        `${second} * * * * *`)

      event.reply([
      {
        type: 'text',
        text: `registered new job`
      },
      {
        type: 'text',
        text: jobId
      }
    ])
  }
})

bot.listen('/bot', 3004, () => {
  console.log('bot listening on port 3004')
})