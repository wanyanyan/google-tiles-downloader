var TaskManager = require('./src/task_manager.js')

let taskManager = new TaskManager({
  bounds: [-180, -85.05, 180, 85.05],
  minzoom: 0,
  maxzoom: 5
})

taskManager.start()