const Cron = require('node-cron')
const UUID = require('short-uuid')

class CronJobs {
  constructor() {
    this.jobs = {}
  }

  registerNewJob(job, cronExpression, opts = {}) {
    const jobId = UUID.generate()

    if(!Cron.validate(cronExpression)) {
      console.error(`cron expression error: ${cronExpression}`)
      return
    }

    if(typeof job !== 'function') {
      console.error(`job is not function`)
      return
    }

    const task = Cron.schedule(cronExpression, () => job(jobId))

    this.jobs[jobId] = {
      task,
    }

    return jobId
  }

  stopJob(jobId) {
    if(this.jobs[jobId] === undefined) {
      return false
    }
    this.jobs[jobId].task.destroy()
    delete this.jobs[jobId]
    return true
  }
}

module.exports = new CronJobs()