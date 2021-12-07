var MBTiles = require("@mapbox/mbtiles");
var fs = require('fs')

const startZoom = 17
const endZoom = 17
var zoomStack = []
var colStack = [];
var rowStack = [];
var startX = 0
var z = 0, x = 0, y = 0;
var myMbtiles = null
var tasks = 0

for(let i = startZoom;i<=endZoom;i++) {
  zoomStack.push(i)
}

new MBTiles("/mnt/e/MyProjects/thcloud-server/data/admin/tilesets/satellite-v2-BfwLUbeLMi.mbtiles?mode=rwc", function (
  err,
  mbtiles
) {
    myMbtiles = mbtiles;
    mbtiles.startWriting(function (err) { // 开始
        console.log('开始写入')
        writeTile2db();
    });
});

function stop() {
  myMbtiles.stopWriting(function (err) {
    console.log("写入完成");
    process.exit(1);
  });
}

function readNewZoom() {
  if (!zoomStack.length) {
    //stop()
    writeMetadata();
    return false
  }
  z = zoomStack.pop()
  colStack = fs.readdirSync(`/mnt/e/tiles/arcgis/satellite/${z}`);
  if (startX) {
    colStack = colStack.filter(v => Number(v) <= startX)
  }
  return true
}

function readNewCol() {
  if (!colStack.length && !readNewZoom()) {
    return false
  }
  x = colStack.pop()
  rowStack = fs.readdirSync(`/mnt/e/tiles/arcgis/satellite/${z}/${x}`);
  return true
}

function readNewTile() {
  var tile = rowStack.pop()
  y = Number(tile.split(".")[0]);
  let buffer = fs.readFileSync(`/mnt/e/tiles/arcgis/satellite/${z}/${x}/${tile}`);
  return buffer
}

function writeTile2db() {
  for(let i = tasks;i < 10;i++) {
    if (rowStack.length) {
      tasks++;
      let buffer = readNewTile();
      myMbtiles.putTile(z, x, y, buffer, function (err) {
        tasks--
        console.log(`${z}/${x}/${y}`);
        writeTile2db();
      });
    } else if (readNewCol()) {
      writeTile2db();
      break
    } else {
      break
    }
  }
}

function writeMetadata() {
  var exampleInfo = {
    "name": "google tiles",
    "description": "Google tiles in China",
    "format": "jpg",
    "version": 2,
    "minzoom": 0,
    "maxzoom": 13,
    "schema": 'xyz',
    "tileSize": 256
  };

  myMbtiles.putInfo(exampleInfo, function (err) {
    stop();
  });
}
