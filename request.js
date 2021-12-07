var fs = require('fs')
const axios = require("axios");

function requestTile(z, x, y, callback) {
    console.log(`请求瓦片  z:${z}  x: ${x}  y: ${y}`);
  //`http://www.talkgis.com:9966/proxy/tiles/${z}/${x}/${y}`
  if (fs.existsSync(`./tiles/${z}`)) {
    if (!fs.existsSync(`./tiles/${z}/${x}`)) {
      fs.mkdirSync(`./tiles/${z}/${x}`);
    }
  } else {
    fs.mkdirSync(`./tiles/${z}`);
    fs.mkdirSync(`./tiles/${z}/${x}`);
  }

  axios({
    method: "get",
    //url: `http://mt2.google.cn/vt/lyrs=s&scale=1&hl=zh-CN&gl=cn&x=${x}&y=${y}&z=${z}`,
    url: `http://khm1.google.com/kh?v=908&hl=en&x=${x}&y=${y}&z=${z}`,
    responseType: "stream",
    proxy: {
      host: "127.0.0.1",
      port: 10809,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    },
  })
    .then(function (response) {
      const writer = fs.createWriteStream(`./tiles/${z}/${x}/${y}.jpg`);
      response.data.pipe(writer);
      callback(null);
    })
    .catch((err) => {
      callback({ error: err, coord: { z, x, y } });
    });
}

module.exports = requestTile