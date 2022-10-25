var Event = require('./event')
var fs = require('fs')
var _ = require('lodash')
var log = require('./log')
var util = require('./util')
const requestTile = require('./request')
const concurrent = 20 // 最多允许的任务数
var tasks = 0

class TaskManager extends Event {
  constructor(options) {
    super()
    this.options = options
    let {bounds, minzoom, maxzoom} = this.options
    this.task = {
      area: { bounds, minzoom, maxzoom},
      progress: {
        zoom: minzoom,
        x: 0,
        y: 0
      }
    }
  }

  start() {
    let task = JSON.parse(fs.readFileSync("./results/task.json", { encoding: "utf8" }))
    if (_.isEqual(task.area, this.task.area)) { // 继续原来的任务
      this.task.progress = task.progress
    } else { // 开始新的任务
      log.clearInfo()
      log.addInfo(`开始任务：${JSON.stringify(this.task.area)}`)
    }
    this.requestZoom()
  }

  // 单个瓦片下载完成后的回调
  tileLoaded(error) {
    fs.writeFileSync('./results/task.json', JSON.stringify(this.task, null, 2))
    tasks--
    if (error) {
      this.processError(error)
      if (error.error.response && error.error.response.status == 429) {
        return
      }
    }
    if (this.task.progress.x < this.task.progress.maxx) {
      this.task.progress.x++
      this.getTile();
    } else if (this.task.progress.y < this.task.progress.maxy) {
      this.task.progress.x = this.task.progress.minx
      this.task.progress.y++
      this.getTile();
    } else if (tasks === 0){
      // 这一级请求完成
      log.addInfo(`第${this.task.progress.zoom}级下载完成`)
      if (this.task.progress.zoom < this.task.area.maxzoom) {
        this.task.progress.zoom++
        this.task.progress.x = 0
        this.task.progress.y = 0
        this.requestZoom()
      } else {
        log.addInfo(`任务已完成`)
        this.fire('on-complete', this.task)
      }
    }
  }

  requestZoom() {
    log.addInfo(`开始请求第${this.task.progress.zoom}级`)
    let bounds = this.task.area.bounds
    let topLeftCoord = util.lngLat2TileCoord([bounds[0], bounds[3]], this.task.progress.zoom);
    let bottomRightCoord = util.lngLat2TileCoord([bounds[2], bounds[1]], this.task.progress.zoom);
    this.task.progress.minx = topLeftCoord.x
    this.task.progress.miny = topLeftCoord.y
    this.task.progress.maxx = bottomRightCoord.x
    this.task.progress.maxy = bottomRightCoord.y
    this.task.progress.x = Math.max(this.task.progress.minx, this.task.progress.x)
    this.task.progress.y = Math.max(this.task.progress.miny, this.task.progress.y)
    console.log(this.task.progress.minx, this.task.progress.miny, this.task.progress.maxx, this.task.progress.maxy)
    if (tasks < concurrent) {
      let N = concurrent - tasks
      for(let i = 0;i < N;i++) {
        this.getTile();
        if (i == N-1) { // 最后一次在for循环内执行
          break
        }
        if (this.task.progress.x < this.task.progress.maxx) {
          this.task.progress.x++
        } else if (this.task.progress.y < this.task.progress.maxy) {
          this.task.progress.x = this.task.progress.minx
          this.task.progress.y++
        } else {
          break
        }
      }
    }
  }

  getTile() {
    tasks++;
    requestTile(this.task.progress.zoom, this.task.progress.x, this.task.progress.y, this.tileLoaded.bind(this));
  }
  
  processError(data) {
    let {z, x, y} = data.coord
    let code = data.error.response && data.error.response.status
    if (code == 400 || code == 404) {
      return
    }
    let msg = `z:${z} x:${x} y:${y} 错误码:${code} url:${data.error.config.url}`
    log.addError(msg)
  }
  
}

module.exports = TaskManager