var fs = require('fs')
var readline = require('readline')
var log = require('./log')
var Event = require('./event')

class RetryManager extends Event{
  constructor(requestManager) {
    super()
    this.requestManager = requestManager
  }

  retry() {
    log.addInfo('开始重新请求出错的瓦片')
    this.logs = []
    this.requestList = []
    this.tasks = 0 // 当前任务数
    const rl = readline.createInterface({
      input: fs.createReadStream('./logs/error.txt'),
      output: process.stdout,
      terminal: false
    })

    rl.on('line', line => {
      var arr = line.split(' ')
      var z = this.pickInfo(arr[0])
      var x = this.pickInfo(arr[1])
      var y = this.pickInfo(arr[2])
      var code = this.pickInfo(arr[3])
      if (!Number(code) || Number(code) > 500) {
        this.requestList.push({ z, x, y });
      }
    })

    rl.on('close', () => {
      console.log('开始请求')
      this.getTile();
      //
    })
  }

  pickInfo(mes) {
    return mes.split(':').pop()
  }

  getTile() {
    if (!this.requestList.length) {
      this.fire('on-complete')
      return
    }
    for (let i = this.tasks; i < 10; i++) {
      if (!this.requestList.length) {
        break
      }
      let { z, x, y } = this.requestList.pop()
      this.requestManager.requestTile(z, x, y, this.cb.bind(this))
      //requestTile(z, x, y, cb);
      console.log(`还剩${this.requestList.length}个瓦片`);
      this.tasks++
    }
  }

  cb(data) {
    this.tasks--
    //console.log(data)
    if (data) { // 失败
      let code = data.error.response && data.error.response.status;
      if (code != 400 && code != 404) {
        let { z, x, y } = data.coord;
        let msg = `z:${z} x:${x} y:${y} 错误码:${data.error.response && data.error.response.status
          } url:${data.error.config.url}`;
        console.log(msg);
        this.logs.push(msg);
      }
    }
    if (this.checkDone()) {
      log.writeError(this.logs)
      this.fire('on-complete')
    } else {
      this.getTile();
    }
  }

  checkDone() {
    return !this.requestList.length && !this.tasks
  }
}

module.exports = RetryManager