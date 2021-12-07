const fs = require('fs')
const util = require('./util')
const requestTile = require('./request')

// 武汉
const nw = {
  lng: 114.027099609375,
  lat: 30.89633279665858
};

const se = {
  lng: 114.66293334960938,
  lat: 30.25550857462476,
};
const startZoom = 18
const endZoom = 18

// 中国范围
// const nw = {
//   lng: 73,
//   lat: 53.6,
// };

// const se = {
//   lng: 136.090593,
//   lat: 17.466661,
// };

// const startZoom = 12
// const endZoom = 12
const concurrent = 5 // 最多允许的任务数

var tasks = 0 // 当前任务数

requestZoom(startZoom)

function requestZoom(zoom) {
  console.log(`开始请求第${zoom}级`)
  let topLeftCoord = util.lngLat2TileCoord(nw, zoom)
  let bottomRightCoord = util.lngLat2TileCoord(se, zoom)
  let minx = topLeftCoord.x
  let miny = topLeftCoord.y
  let maxx = bottomRightCoord.x
  let maxy = bottomRightCoord.y
  let currentx = minx, currenty = miny;
  console.log(minx, miny, maxx, maxy)
  function cb(error) {
    tasks--
    if (error) {
      processError(error)
      if (error.error.response && error.error.response.status == 429) {
        return
      }
    }
    if (currentx < maxx) {
      currentx++
      getTile(zoom, currentx, currenty, cb)
    } else if (currenty < maxy) {
      currentx = minx
      currenty++
      getTile(zoom, currentx, currenty, cb)
    } else if (tasks === 0){
      // 这一级请求完成
      console.log(`请求完成：第${zoom}级`)
      if (zoom < endZoom) {
        requestZoom(zoom+1)
      }
    }
  }

  if (tasks < concurrent) {
    let N = concurrent - tasks
    for(let i = 0;i < N;i++) {
      getTile(zoom, currentx, currenty, cb)
      if (i == N-1) { // 最后一次在for循环内执行
        break
      }
      if (currentx < maxx) {
        currentx++
      } else if (currenty < maxy) {
        currentx = minx
        currenty++
      } else {
        break
      }
    }
  }
}

function getTile(z, x, y, callback) {
  tasks++;
  requestTile(z, x, y, callback);
}

function processError(data) {
  let {z, x, y} = data.coord
  let code = data.error.response && data.error.response.status
  if (code == 400) {
    return
  }
  let msg = `z:${z} x:${x} y:${y} 错误码:${code} url:${data.error.config.url}`
  console.log(msg)
  fs.appendFileSync('./log.txt', msg+'\n', "utf-8")
}