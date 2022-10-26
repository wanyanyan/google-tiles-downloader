var MBTiles = require("@mapbox/mbtiles");
var gm = require('gm');
var path = require('path')
var fs = require('fs')
const mbtilesPath = "./results/google.mbtiles?mode=rwc"

var mbtiles = null
new MBTiles(mbtilesPath, (err, instance) => {
  mbtiles = instance;
  mbtiles.startWriting((err) => { // 开始
    err && console.log(err)
    start()
  });
});

function start() {
  let querys = [
    getTile(1, 0, 0),
    getTile(1, 1, 0),
    getTile(1, 0, 1),
    getTile(1, 1, 1)
  ]
  Promise.all(querys).then(images => {
    fs.writeFileSync('./results/tl.jpg', images[0])
    fs.writeFileSync('./results/tr.jpg', images[1])
    fs.writeFileSync('./results/bl.jpg', images[2])
    fs.writeFileSync('./results/br.jpg', images[3])
    gm()
      .in('-page', '+0+0')  // Custom place for each of the images
      .in(path.resolve('./results/tl.jpg'))
      .in('-page', '+256+0')
      .in(path.resolve('./results/tr.jpg'))
      .in('-page', '+0+256')
      .in(path.resolve('./results/bl.jpg'))
      .in('-page', '+256+256')
      .in(path.resolve('./results/br.jpg'))
      .mosaic()  // Merges the images as a matrix
      .write(path.resolve('./results/merge.jpg'), function (err) {
          if (err) console.log(err);
      });
  })
}

function getTile(z, x, y) {
  return new Promise((resolve, reject) => {
    mbtiles.getTile(z, x, y, (err, data) => {
      if (data) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}