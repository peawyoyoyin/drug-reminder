const LineBot = require('linebot')
const FormData = require('form-data')
const axios = require('axios')
const replies = require('./line-messages')

let botConfig
try {
    botConfig = require('./bot-config')
} catch (e) {
    console.error('bot config file not found, create bot-config.js first')
    // exit(1)
}
const CronJobs = require('./cron')

// id : {
// tmp:drugInfo
//    state:  ''''vmifjvifjdi
//    reminder: [
//     {   ชื่อยา: [jid1,jid2,jid3] }
//    ]}

const users = {}

const bot = LineBot(botConfig)

function validateUser(userId) {
    if (!users[userId]) {
        users[userId] = {
            state: 'idle',
            reminder: []
        }
    }
}

function cleanNotNumber(drugInfo) {
    const numberOnly = ['per_times', 'per_week', 'per_day', 'per_hour']
    const output = {}
    for (let k in drugInfo) {
        if (numberOnly.includes(k)) {
            if (!isNaN(drugInfo[k])) {
                output[k] = drugInfo[k]
            }
        } else {
            output[k] = drugInfo[k]
        }
    }
    return output
}

function getOnly(obj, fields) {
    const output = {}
    for (let k in obj) {
        if (fields.includes(k)) {
            output[k] = obj[k]
        }
    }
    return output
}

function setDrugTime(drugInfo, time) {
    const drugNoTime = getOnly(drugInfo, ['per_times', 'time', 'time2', 'name'])
    for (let k in time) {
        drugNoTime[k] = time[k]
    }
    return drugNoTime
}

function genContent(drugInfo) {
    const template = [
        {
            name: 'name',
            content: value => ({
                type: 'text',
                text: 'ยา: ' + value,
                wrap: true
            })
        },
        {
            name: 'per_times',
            content: value => ({
                type: 'text',
                text: 'รับประทานครั้งละ ' + value + ' เม็ด',
                wrap: true
            })
        },
        {
            name: 'per_day',
            content: value => ({
                type: 'text',
                text: 'วันละ ' + value + ' ครั้ง',
                wrap: true
            })
        },
        {
            name: 'per_week',
            content: value => ({
                type: 'text',
                text: 'สัปดาห์ละ ' + value + ' ครั้ง',
                wrap: true
            })
        },
        {
            name: 'time',
            content: value => ({
                type: 'text',
                text: 'เวลาที่รับประทาน: ' + value,
                wrap: true
            })
        },
        {
            name: 'time2',
            content: value => ({
                type: 'text',
                text: 'ช่วง: ' + value,
                wrap: true
            })
        }
    ]
    const output = []
    for (let c of template) {
        if (drugInfo[c.name]) {
            output.push(c.content(drugInfo[c.name]))
        }
    }
    return output
}

function createNotificationJob(userId, opts) {
    return () => {
        console.log(`noti to ${userId}`)
        bot.push(
            userId,
            replies.createNotificationMessage({
                drugName: opts.drugName,
                consumption: opts.consumption,
                cancelAction: {
                    type: 'message',
                    text: `ยกเลิก ${opts.drugName}`
                }
            })
        )
    }
}

consumption = {
    name: 'ทดลอง',
    per_times: 1,
    per_day: 3,
    // per_week: 1
    // per_hour: 4
    time: ['เช้า', 'กลางวัน', 'เย็น' /*ก่อนนอน*/],
    time2: ['ก่อนอาหาร', 'หลังอาหาร']
}

bot.on('message', async event => {
    validateUser(event.source.userId)
    const user = users[event.source.userId]
    console.log(user)

    if (event.message.type === 'image') {
        if (user.state === 'idle') {
            const bodyFormData = new FormData()
            bodyFormData.append(
                'url',
                `https://api.line.me/v2/bot/message/${event.message.id}/content`
            )
            event.reply(replies.createOnDrugLabelReceivedMessage())
            bodyFormData.append('line_token', botConfig.channelAccessToken)
            const { data } = await axios({
                method: 'post',
                url: 'http://127.0.0.1:3000/process-url',
                data: bodyFormData,
                headers: bodyFormData.getHeaders()
            }).catch(e => console.error(e))
            const drugInfo = cleanNotNumber(data)
            user.tmp = drugInfo
            user.state = 'รอตั้งชื่อ'
            bot.push(event.source.userId, replies.createNameAssignmentMessage())
        } else {
            event.reply({
                type: 'text',
                text: 'คุณยังตั้งการแจ้งเตือนก่อนหน้าไม่เรียบร้อย'
            })
        }
    }

    if (event.message.type === 'text') {
        if (event.message.text.startsWith('ตั้งชื่อ')) {
            if (user.state === 'รอตั้งชื่อ') {
                user.tmp.name = event.message.text.split(' ')[1]
                user.state = 'ตั้งชื่อเรียบร้อย'
                // reply(event, user.tmp)
                event.reply([
                    replies.createNewDrugInformationMessage({
                        drugName: user.tmp.name,
                        consumption: user.tmp,
                        confirmAction: {
                            type: 'message',
                            text: 'ยืนยัน'
                        },
                        editAction: {
                            type: 'message',
                            text: 'แก้ไข'
                        }
                    }),
                    replies.createEditDialogMessage()
                ])
            } else {
                event.reply({
                    type: 'text',
                    text: 'คุณไม่สามารถตั้งชื่อได้'
                })
            }
            return
        }

        if (event.message.text.startsWith('แก้ไข')) {
            if (user.state === 'ตั้งชื่อเรียบร้อย') {
                const field = event.message.text.split(' ')[1]
                // console.log(field)
                if (['ชื่อ', 'ยา'].includes(field)) {
                    user.tmp['name'] = event.message.text.split(' ')[2]
                }
                if (
                    [
                        'จำนวนเม็ด',
                        'จำนวน',
                        'ปริมาณ',
                        'ปริมาณยา',
                        'ครั้งละ'
                    ].includes(field)
                ) {
                    user.tmp['per_times'] = event.message.text.split(' ')[2]
                }
                if (['วันละ', 'วัน', 'ปริมาณ', 'ปริมาณยา'].includes(field)) {
                    user.tmp = setDrugTime(user.tmp, {
                        per_day: event.message.text.split(' ')[2]
                    })
                }
                if (['สัปดาห์ละ', 'สัปดาห์'].includes(field)) {
                    user.tmp = setDrugTime(user.tmp, {
                        per_week: event.message.text.split(' ')[2]
                    })
                }
                if (['ชั่วโมง'].includes(field)) {
                    user.tmp = setDrugTime(user.tmp, {
                        per_hour: event.message.text.split(' ')[2]
                    })
                }
                if (['เวลา', 'เวลาที่รับประทาน'].includes(field)) {
                    user.tmp['time'] = event.message.text.split(' ')[2]
                }
                if (['ช่วง', 'ช่วงเวลา'].includes(field)) {
                    user.tmp['time2'] = event.message.text.split(' ').slice(2)
                }
                user.tmp = cleanNotNumber(user.tmp)
                // reply(event, user.tmp)
                event.reply(
                    replies.createNewDrugInformationMessage({
                        drugName: user.tmp.name,
                        consumption: user.tmp,
                        confirmAction: {
                            type: 'message',
                            text: 'ยืนยัน'
                        },
                        editAction: {
                            type: 'message',
                            text: 'แก้ไข'
                        }
                    })
                )
            } else {
                event.reply({
                    type: 'text',
                    text: 'คุณไม่สามารถแก้ไขได้'
                })
            }
            return
        }

        if (event.message.text.startsWith('ยกเลิก')) {
            if (user.state === 'idle') {
                const drugName = event.message.text.split(' ')[1]
                for (let i in user.reminder) {
                    if (user.reminder[i].name === drugName) {
                        for (let j of user.reminder[i].jobs) {
                            CronJobs.stopJob(j)
                        }
                    }
                    user.reminder.splice(i, 1)
                    event.reply({
                        type: 'text',
                        text: `คุณยกเลิกแจ้งเตือน ${drugName} เรียบร้อยแล้ว`
                    })
                    return
                }
                event.reply({
                    type: 'text',
                    text: `ไม่พบยาชื่อ ${drugName}`
                })
            } else {
                event.reply({
                    type: 'text',
                    text: 'คุณยังตั้งการแจ้งเตือนก่อนหน้าไม่เรียบร้อย'
                })
            }
            return
        }

        if (event.message.text.startsWith('ยืนยัน')) {
            // console.log(drugCache)
            // event.reply({
            //     type: 'text',
            //     text: 'ตั้งการแจ้งเตือนเรียบร้อย'
            // })

            const drugCache = user.tmp

            const time2 = drugCache.time2 ? drugCache.time2 : ['เช้า']
            const jobs = []
            for (let t of time2) {
                let second =
                    t === 'เช้า'
                        ? 8
                        : t === 'กลางวัน'
                        ? 12
                        : t === 'เย็น'
                        ? 16
                        : 20

                const jobId = CronJobs.registerNewJob(
                    createNotificationJob(event.source.userId, {
                        drugName: drugCache.name,
                        consumption: drugCache
                    }),
                    `${second} * * * * *`
                )

                jobs.push(jobId)
            }

            const drug = {
                name: drugCache.name,
                jobs: jobs
            }
            user.reminder.push(drug)
            user.state = 'idle'
            event.reply(replies.createScheduleFinishedMessage())
            return
        }
    }
})

bot.on('postback', async event => {
    console.log(event)
})

const reply = (event, drug) => {
    console.log(drug)
    event.reply([
        {
            type: 'flex',
            altText: 'Pill',
            contents: {
                type: 'bubble',
                styles: {
                    header: {
                        backgroundColor: '#3333cc'
                    }
                },
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: 'รายละเอียดการแจ้งเตือน',
                            weight: 'bold',
                            color: '#ffffff'
                        }
                    ]
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'md',
                    contents: [
                        {
                            type: 'box',
                            layout: 'horizontal',
                            spacing: 'md',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'vertical',
                                    spacing: 'md',
                                    contents: genContent(drug)
                                }
                            ]
                        }
                    ]
                }
            }
        },
        {
            type: 'flex',
            altText: 'bottom',
            contents: drug.name
                ? {
                      type: 'bubble',
                      body: {
                          type: 'box',
                          layout: 'vertical',
                          spacing: 'md',
                          contents: [
                              {
                                  type: 'text',
                                  text:
                                      'หากต้องการแก้ไข ให้พิมพ์ข้อความส่งมาตามแบบข้างล่าง',
                                  wrap: true,
                                  color: '#ff4d4d'
                              },
                              {
                                  type: 'text',
                                  text:
                                      'แก้ไข ฟิลดิ์ที่แก้ไข ข้อมูลที่ต้องการแก้',
                                  wrap: true
                              },
                              {
                                  type: 'text',
                                  text: 'ตัวอย่าง: แก้ไข ชื่อ ตัวอย่าง',
                                  wrap: true
                              }
                          ]
                      },
                      footer: {
                          type: 'box',
                          layout: 'vertical',
                          spacing: 'md',
                          contents: [
                              {
                                  type: 'button',
                                  style: 'primary',
                                  action: {
                                      type: 'message',
                                      label: 'ตั้งการแจ้งเตือน',
                                      text: 'ยืนยัน'
                                  }
                              }
                          ]
                      }
                  }
                : {
                      type: 'bubble',
                      body: {
                          type: 'box',
                          layout: 'vertical',
                          spacing: 'md',
                          contents: [
                              {
                                  type: 'text',
                                  text: 'กรุณาตั้งชื่อยา',
                                  wrap: true,
                                  color: '#ff4d4d'
                              },
                              {
                                  type: 'text',
                                  text: 'ตัวอย่าง: ตั้งชื่อ ยาตัวอย่าง',
                                  wrap: true
                              }
                          ]
                      }
                  }
        }
    ])
}

bot.listen('/bot', 443, () => {
    console.log('bot listening on port 443')
})
