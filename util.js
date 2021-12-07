module.exports =  {
  lngLat2TileCoord(lngLat, zoom) {
    let {lng, lat} = lngLat
    const scale = Math.pow(2, zoom)
    return {
      x: Math.floor((180 + lng) / 360 * scale),
      y: Math.floor(((180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360) * scale)
    }
  }
}