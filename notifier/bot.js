const LineBot = require('linebot')
const FormData = require('form-data')
let botConfig
try {
    botConfig = require('./bot-config')
} catch (e) {
    console.error('bot config file not found, create bot-config.js first')
    exit(1)
}
const CronJobs = require('./cron')

const bot = LineBot(botConfig)

bot.on('message', async event => {
    if (event.message.type === 'image') {
        const bodyFormData = new FormData()
        bodyFormData.append(
            'url',
            `https://api.line.me/v2/bot/message/${events.message.id}/content`
        )
        bodyFormData.append('line_token', botConfig.channelAccessToken)
        const drugInfo = await axios({
            method: 'post',
            url: 'http://127.0.0.1:3004/process-url',
            data: bodyFormData,
            headers: bodyFormData.getHeaders()
        }).carch(e => console.error(e))
        console.log(drugInfo)
    }

    if (event.message.type === 'text') {
        if (event.message.text.startsWith('cancel')) {
            const jobId = event.message.text.split(' ')[1]
            const success = CronJobs.stopJob(event.source.userId, jobId)
            if (success) {
                event.reply({
                    type: 'text',
                    text: `successfully canceled job ${jobId}`
                })
            }
            return
        }

        const second = parseInt(event.message.text)

        if (isNaN(second)) {
            event.reply({
                type: 'text',
                text: `not a number`
            })
            return
        }

        const jobId = CronJobs.registerNewJob(
            event.source.userId,
            () => {
                bot.push(event.source.userId, {
                    type: 'text',
                    text: `automatic notification from job ${jobId}`
                })
            },
            `${second} * * * * *`
        )

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

bot.listen('/bot', 80, () => {
    console.log('bot listening on port 80')
})
