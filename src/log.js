var fs = require('fs')
var util = require('./util')

module.exports = {
  clearInfo() {
    fs.writeFileSync('./logs/log.txt', '')
  },
  clearError() {
    fs.writeFileSync('./logs/error.txt', '')
  },
  addInfo(message) {
    fs.appendFileSync("./logs/log.txt", `[${util.formatTime('yyyy-MM-dd HH:mm:ss')}]  ${message}\n`, "utf-8")
  },
  addError(message) {
    console.log(message)
    fs.appendFileSync('./logs/error.txt', `${message}\n`, "utf-8")
  },
  writeError(list) {
    fs.writeFileSync("./logs/error.txt", list.join("\n"), "utf-8")
  }
}