var fs = require('fs')
var path = require('path')
var readline = require('readline')
const requestTile = require("./request");

var logs = []
var requestList = []
var tasks = 0 // 当前任务数

const rl = readline.createInterface({
    input: fs.createReadStream('./log.txt'),
    output: process.stdout,
    terminal: false
})

rl.on('line', line => {
    var arr = line.split(' ')
    var z = pickInfo(arr[0])
    var x = pickInfo(arr[1])
    var y = pickInfo(arr[2])
    var code = pickInfo(arr[3])
    if (!Number(code) || Number(code) > 500) {
      requestList.push({ z, x, y });
    }
})

rl.on('close', () => {
    console.log('开始请求')
    getTile();
    //
})

function pickInfo(mes) {
    return mes.split(':').pop()
}

function getTile() {
    if (!requestList.length) {
        return
    }
    for(let i = tasks;i < 3; i++) {
        let {z, x, y} = requestList.pop()
        requestTile(z, x, y, cb);
        tasks++
    }
}

function cb(data) {
    tasks--
    if (data) { // 失败
      let { z, x, y } = data.coord;
      let msg = `z:${z} x:${x} y:${y} 错误码:${data.error.response && data.error.response.status} url:${data.error.config.url}`;
      console.log(msg);
      logs.push(msg);
    }
    if (checkDone()) {
      fs.writeFileSync("./log.txt", logs.join("\n"));
    } else {
      getTile();
    }
}

function checkDone() {
    return !requestList.length && !tasks
}