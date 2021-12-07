var fs = require("fs");
const axios = require("axios");

//中国范围
const nw = {
  lng: 73,
  lat: 54,
};

const se = {
  lng: 136,
  lat: 17,
};

let logs = [];
let tasks = 0;
let requestList = []
for(let i = se.lat;i <= nw.lat;i++) {
    for(let j = nw.lng;j <= se.lng;j++) {
        requestList.push({lng: j, lat: i})
    }
}
downloadSrtm();

function downloadSrtm() {
  if (!requestList.length) {
    return;
  }
  for (let i = tasks; i < 5; i++) {
    let { lng, lat } = requestList.pop();
    requestTile(lng, lat, cb);
    tasks++;
  }
}

function cb(data) {
  tasks--;
  if (data) {
    // 失败
    let { lng, lat } = data.coord;
    let msg = `lng:${lng} lat:${lat} 错误码:${
      data.error.response && data.error.response.status
    } url:${data.error.config.url}`;
    console.log(data.error.message);
    logs.push(msg);
  }
  if (checkDone()) {
    fs.writeFileSync("./srtm_log.txt", logs.join("\n"));
  } else {
    downloadSrtm();
  }
}

function checkDone() {
  return !requestList.length && !tasks;
}

function requestTile(lng, lat, callback) {
  console.log(`请求格网  lng:${lng}  lat: ${lat}`);
  //`http://www.talkgis.com:9966/proxy/tiles/${z}/${x}/${y}`
  if (!fs.existsSync(`./srtm`)) {
    fs.mkdirSync(`./srtm`);
  }
  let lngstr = (Array(3).join("0") + lng).slice(-3);
  let latstr = (Array(2).join("0") + lat).slice(-2);
  axios({
    method: "get",
    //url: `http://mt2.google.cn/vt/lyrs=s&scale=1&hl=zh-CN&gl=cn&x=${x}&y=${y}&z=${z}`,
    url: `https://e4ftl01.cr.usgs.gov/MEASURES/SRTMGL1.003/2000.02.11/N${latstr}E${lngstr}.SRTMGL1.hgt.zip`,
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
      const writer = fs.createWriteStream(`./srtm/N${latstr}E${lngstr}.SRTMGL1.hgt.zip`);
      response.data.pipe(writer);
      callback(null);
    })
    .catch((err) => {
      callback({ error: err, coord: { lng, lat } });
    });
}