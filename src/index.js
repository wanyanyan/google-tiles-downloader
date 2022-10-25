const fs = require('fs')
const util = require('./util')
const requestTile = require('./request');
//const MBTiles = require("@mapbox/mbtiles");

// 武汉
// const nw = {
//   lng: 114.027099609375,
//   lat: 30.89633279665858
// };

// const se = {
//   lng: 114.66293334960938,
//   lat: 30.25550857462476,
// };
// const startZoom = 18
// const endZoom = 18

// 中国范围
var startZoom = 15
var endZoom = 15

var downloadZoom = startZoom
const concurrent = 20 // 最多允许的任务数
var grids = []
var downloadGrids = []
var tasks = 0 // 当前任务数

// new MBTiles("/mnt/e/google.mbtiles?mode=rwc", function (err, mbtiles) {
//   myMbtiles = mbtiles;
//   mbtiles.startWriting(function (err) {
//     mymbtiles = mbtiles;
//     //writeMetadata();
//     run();
//   });
// });

run()

function run() {
  grids = JSON.parse(fs.readFileSync("./grids.json", { encoding: "utf8" }));
  downloadGrids = JSON.parse(JSON.stringify(grids));
  fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  任务开始，一共有${grids.length}个格网，从第${startZoom}级到第${endZoom}级\n`, "utf-8");
  fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  开始下载第${downloadZoom}级\n`, "utf-8");
  requestGrid();
}


function requestGrid() {
  if (!downloadGrids.length) {
    // 请求完成
    if (downloadZoom < endZoom) {
      downloadZoom++
      downloadGrids = JSON.parse(JSON.stringify(grids));
      fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  开始下载第${downloadZoom}级\n`, "utf-8");
    } else {
      fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  所有格网请求完成\n`, "utf-8");
      return
    }
    
  }
  let grid = downloadGrids.shift();
  fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  开始下载：${grid.name}\n`, "utf-8");
  let {nw, se} = grid
  let topLeftCoord = util.lngLat2TileCoord(nw, downloadZoom);
  let bottomRightCoord = util.lngLat2TileCoord(se, downloadZoom);
  let minx = topLeftCoord.x
  let miny = topLeftCoord.y
  let maxx = bottomRightCoord.x - 1
  let maxy = bottomRightCoord.y - 1
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
      getTile(downloadZoom, currentx, currenty, cb);
    } else if (currenty < maxy) {
      currentx = minx
      currenty++
      getTile(downloadZoom, currentx, currenty, cb);
    } else if (tasks === 0){
      // 这一级请求完成
      fs.appendFileSync("./log.txt", `${util.formatTime('yyyy-MM-dd HH:mm:ss')}  下载完成：${grid.name}\n`, "utf-8");
      requestGrid()
    }
  }

  if (tasks < concurrent) {
    let N = concurrent - tasks
    for(let i = 0;i < N;i++) {
      getTile(downloadZoom, currentx, currenty, cb);
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
  if (code == 400 || code == 404) {
    return
  }
  let msg = `z:${z} x:${x} y:${y} 错误码:${code} url:${data.error.config.url}`
  console.log(msg)
  fs.appendFileSync('./error.txt', msg+'\n', "utf-8")
}
