const Cron = require('node-cron')
const UUID = require('short-uuid')

class CronJobs {
  constructor() {
    this.users = {}
  }

  registerNewJob(userId, job, cronExpression, opts = {}) {
    const jobId = UUID.generate()

    if(!Cron.validate(cronExpression)) {
      console.error(`cron expression error: ${cronExpression}`)
      return
    }

    if(typeof job !== 'function') {
      console.error(`job is not function`)
      return
    }

    const task = Cron.schedule(cronExpression, job)

    if(this.users[userId] === undefined) {
      this.users[userId] = {}
    }

    this.users[userId][jobId] = {
      task,
    }

    return jobId
  }

  stopJob(userId, jobId) {
    if(this.users[userId] === undefined) {
      return false
    }
    if(this.users[userId][jobId] === undefined) {
      return false
    }
    this.users[userId][jobId].task.destroy()
    delete this.users[userId][jobId]
    return true
  }
}

module.exports = new CronJobs()