var fs = require('fs')
const axios = require("axios");
const outputPath = "./results";

const urls = [
  "http://mt1.google.cn/vt/lyrs=s@110",
  "http://khm1.google.com/kh?v=908&hl=en",
];

function requestTile(z, x, y, callback) {
  console.log(`请求瓦片  z:${z} x:${x} y:${y}`);
  if (fs.existsSync(`${outputPath}/${z}`)) {
    if (!fs.existsSync(`${outputPath}/${z}/${x}`)) {
      fs.mkdirSync(`${outputPath}/${z}/${x}`);
    }
  } else {
    fs.mkdirSync(`${outputPath}/${z}`);
    fs.mkdirSync(`${outputPath}/${z}/${x}`);
  }

  axios({
    method: "get",
    url: `${urls[1]}&x=${x}&y=${y}&z=${z}`,
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
      const writer = fs.createWriteStream(`${outputPath}/${z}/${x}/${y}.jpg`);
      response.data.pipe(writer);
      callback(null);
    })
    .catch((err) => {
      callback({ error: err, coord: { z, x, y } });
    });
}

module.exports = requestTile