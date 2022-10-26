var Event = require('./event')
var MBTiles = require("@mapbox/mbtiles");
const axios = require("axios");
const mbtilesPath = "./results/google.mbtiles?mode=rwc"


class RequestManager extends Event {
  constructor() {
    super()
    this.init()
  }

  init() {
    new MBTiles(mbtilesPath, (err, mbtiles) => {
      this.mbtiles = mbtiles;
      this.mbtiles.startWriting((err) => { // 开始
        err && console.log(err)
        this.writeMetadata()
        this.fire('on-load')
      });
    });
  }

  requestTile(z, x, y, callback) {
    console.log(`请求瓦片  z:${z} x:${x} y:${y}`);
    let n = Math.round(Math.random() * 3)
    axios({
      method: "get",
      url: `http://khm${n}.google.com/kh?v=908&hl=en&x=${x}&y=${y}&z=${z}`,
      responseType: "arraybuffer",
      proxy: {
        host: "127.0.0.1",
        port: 10809,
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
      },
    })
      .then(res => {
        // console.log(res.data)
        this.writeTile(z, x, y, res.data)
        callback(null);
      })
      .catch((err) => {
        callback({ error: err, coord: { z, x, y } });
      });
  }

  writeTile(z, x, y, buffer) {
    this.mbtiles.putTile(z, x, y, buffer, function (err) {
      err && console.log(err)
    })
  }

  hasTile(z, x, y) {
    return new Promise((resolve, reject) => {
      this.mbtiles.getTile(z, x, y, (err, data) => {
        if (data) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  writeMetadata() {
    var exampleInfo = {
      "name": "google tiles",
      "description": "Google tiles in China",
      "format": "jpg",
      "version": 2,
      "minzoom": 0,
      "maxzoom": 18,
      "scheme": 'xyz',
      "bounds": "-180.000000,-85.051129,180.000000,85.051129",
      "tileSize": 256
    };
  
    this.mbtiles.putInfo(exampleInfo, function (err) {
      err && console.log(err)
    });
  }

  stop(callback) {
    this.mbtiles.stopWriting((err) => {
      err && console.log(err)
      console.log("写入完成");
      callback()
      //process.exit(1);
    });
  }
}

module.exports = RequestManager