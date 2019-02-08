const createTextRow = (leftText, rightText) => {
  return {
    "type": "box",
    "layout": "horizontal",
    "contents": [
      {
        "type": "text",
        "text": leftText,
        "color": "#555555",
        "flex": 0
      },
      {
        "type": "text",
        "text": rightText,
        "color": "#111111",
        "align": "end"
      }
    ]
  }
}

const createConsumptionInformationView = (consumption) => {
  let result = []
  if (consumption.per_times !== undefined) {
    result.push(createTextRow('ครั้งละ', `${consumption.per_times} เม็ด`))
  }

  if (consumption.per_day !== undefined) {
    result.push(createTextRow('วันละ', `${consumption.per_day} ครั้ง`))
  } else if (consumption.per_week !== undefined) {
    result.push(createTextRow('สัปดาห์ละ', `${consumption.per_week} ครั้ง`))
  }

  if (consumption.per_hour !== undefined) {
    result.push(createTextRow('ทานทุก', `${consumption.per_hour} ชั่วโมง`))
  }

  if (result.time !== undefined && result.time !== []) {
    result.push(createTextRow('รับประทานช่วง', result.time.join(', ')))
  }

  if (result.time2 !== undefined && result.time2 !== []) {
    result.push(createTextRow('เวลาที่รับประทาน', result.time2))
  }
  return result
}

const createNewDrugInformationMessage = ({
    drugName,
    editAction,
    confirmAction,
    consumption,
    imageURL,
  }) => ({
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        {
          "type": "text",
          "text": "ฉลากยาใหม่",
          "weight": "bold",
          "align": "center",
          "size": "xl"
        }
      ]
    },
    "hero": {
      "type": "image",
      "url": imageURL || "https://c8.alamy.com/comp/C4N3C8/antique-prescription-drug-label-C4N3C8.jpg",
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "margin": "xxl",
      "spacing": "sm",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "text",
              "text": "ยา",
              "color": "#555555",
              "size": "xxl",
              "flex": 0
            },
            {
              "type": "text",
              "text": drugName,
              "weight": "bold",
              "size": "xxl",
              "color": "#111111",
              "align": "end"
            }
          ]
        },
        // consumption info
        {
          "type": "box",
          "layout": "vertical",
          "contents": createConsumptionInformationView()
        }
      ]
    },
    "footer": {
      "type": "box",
      "spacing": "md",
      "layout": "horizontal",
      "contents": [
        {
          "type": "button",
          "style": "secondary",
          "action": {
            "label": "แก้ไข",
            ...editAction
          }
        },
        {
          "type": "button",
          "style": "primary",
          "action": {
            "label": "ยืนยัน",
            ...confirmAction
          }
        }
      ]
    }
  })

const createNotificationMessage = ({ timeDescription, imageURL, drugName, cancelAction }) => ({
  "type": "bubble",
  "header": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "แจ้งเตือนการทานยา",
        "weight": "bold",
        "align": "center",
        "size": "xl"
      },
      {
        "type": "text",
        "text": timeDescription,
        "align": "center"
      }
    ]
  },
  "hero": {
    "type": "image",
    "url": imageURL || 'https://c8.alamy.com/comp/C4N3C8/antique-prescription-drug-label-C4N3C8.jpg',
    "size": "full",
    "aspectRatio": "20:13",
    "aspectMode": "cover"
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "margin": "xxl",
    "spacing": "sm",
    "contents": [
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "text",
            "text": drugName,
            "weight": "bold",
            "size": "xxl",
            "color": "#111111",
            "align": "center"
          }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "spacing": "md",
    "layout": "horizontal",
    "contents": [
      {
        "type": "button",
        "style": "secondary",
        "action": {
          "label": "ยกเลิกแจ้งเตือน",
          ...cancelAction
        }
      }
    ]
  }
})

const textMessage = (text, settings) => ({ "type": "text", text, ...settings})

const createNameAssignmentMessage = () => textMessage('โปรดพิมพ์ชื่อยาที่จะใช้ในการแจ้งเตือน')
const createScheduleFinishedMessage = () => textMessage('สร้างการแจ้งเตือนใหม่แล้ว')

const createOnDrugLabelReceivedMessage = () => textMessage('กำลังประมวลผลภาพฉลากยา กรุณารอสักครุ่...')
const createEditDialogMessage = () => ({})

module.exports = {
  createNewDrugInformationMessage,
  createNameAssignmentMessage,
  createScheduleFinishedMessage,
  createOnDrugLabelReceivedMessage,
  createNotificationMessage,
}