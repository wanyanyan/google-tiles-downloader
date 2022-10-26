var TaskManager = require('./src/task_manager.js')
var chinaGrids = require('./src/grids_china')
var log = require('./src/log')

function requestGrid(grid) {
  log.addInfo(`开始请求：${grid.name}`)
  let taskManager = new TaskManager({
    bounds: [grid.nw.lng, grid.se.lat, grid.se.lng, grid.nw.lat],
    minzoom: 14,
    maxzoom: 16
  })
  taskManager.on('on-complete', start)
}

function start() {
  log.addInfo(`请求完成，剩余${chinaGrids.length}个格网`)
  let grid = chinaGrids.pop()
  if (grid) {
    requestGrid(grid)
  } else {
    log.addInfo('全部请求完成')
  }
}

start()

//taskManager.start()