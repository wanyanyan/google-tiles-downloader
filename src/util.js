module.exports = {
  lngLat2TileCoord(lngLat, zoom) {
    let { lng, lat } = lngLat;
    const scale = Math.pow(2, zoom);
    return {
      x: Math.floor(((180 + lng) / 360) * scale),
      y: Math.floor(
        ((180 -
          (180 / Math.PI) *
            Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
          360) *
          scale
      ),
    };
  },
  formatTime(fmt) {
    let now = new Date();
    let weekday = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    var o = {
      "M+": now.getMonth() + 1, //月份
      "d+": now.getDate(), //日
      "H+": now.getHours(), //小时
      "m+": now.getMinutes(), //分
      "s+": now.getSeconds(), //秒
      "q+": Math.floor((now.getMonth() + 3) / 3), //季度
      S: ("000" + now.getMilliseconds()).substr(
        ("" + now.getMilliseconds()).length
      ), //毫秒
      W: weekday[now.getDay()],
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        (now.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length)
        );
    return fmt;
  },
};