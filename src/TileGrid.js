import { Image, InteractionManager } from 'react-native'
import { FileSystem, ImageManipulator } from 'expo'

/*
* Usage:
*   const tiles = new Tiles(`${FileSystem.documentDirectory}images/image.png`, `${FileSystem.documentDirectory}tiles`)
*   await tiles.init()
*   await tiles.createAllTiles(MAX_ZOOM) or await tiles.createTilesForZoom(ZOOM)
*
* Each zoom level increases the magnification by a factor of two
*   1 image for zoom 0
*   4 image for zoom 1
*   8 image for zoom 2
*   16 image for zoom 3
*/
export default class TileGrid {
  constructor(imageUri, cacheDirectory, onProgress) {
    this.imageUri = imageUri
    this.cacheDirectory = cacheDirectory
    this.onProgress = onProgress
  }

  async init() {
    const size = await new Promise((resolve, reject) => {
      Image.getSize(this.imageUri, (width, height) => resolve({ width, height }), reject)
    })
    if (size.width !== size.height) throw 'Source image must be a square'
    this.imageSize = size.width
  }

  cleanTiles() {
    return FileSystem.deleteAsync(this.cacheDirectory)
  }

  getTilesForZoom(zoom) {
    const size = Array(Math.pow(2, zoom)).fill(0)
    return size.reduce((tiles, p, x) => {
      return tiles.concat(size.map((p1, y) => ({ x, y, z: zoom })))
    }, [])
  }

  getTilesFromZeroToZoom(zoom) {
    const size = Array(zoom + 1).fill(0)
    return size.reduce((tiles, p, z) => {
      return tiles.concat(this.getTilesForZoom(z))
    }, [])
  }

  _getDimensionsForCrop(tile) {
    const ratio = Math.pow(2, tile.z)
    const size = this.imageSize / ratio
    const originX = size * tile.x
    const originY = size * tile.y

    return { originX, originY, width: size, height: size }
  }

  async _manipulateTiles(tiles) {
    if (this.manipulating) return this.manipulating
    const downloadSuccessFile = `${this.cacheDirectory}/.completed`
    this.manipulating = new Promise(async resolve => {
      const { exists } = await FileSystem.getInfoAsync(downloadSuccessFile)
      if (exists) return resolve()
      for (const i in tiles) {
        if (tiles.hasOwnProperty(i)) {
          await new Promise((resolve, reject) =>
            InteractionManager.runAfterInteractions(() =>
              this._manipulateTile(tiles[i]).then(resolve).catch(reject)
            )
          )
          this.onProgress({ loaded: parseInt(i) + 1, total: tiles.length })
        }
      }
      await FileSystem.writeAsStringAsync(downloadSuccessFile, '')
      resolve()
    })
    return this.manipulating
  }

  async _manipulateTile(tile) {
    const to = `${this.cacheDirectory}/${tile.z}/${tile.x}/${tile.y}.jpg`
    const { exists } = await FileSystem.getInfoAsync(to)
    if (exists) return
    const actions = [{ crop: this._getDimensionsForCrop(tile) }, { resize: { width: 256, height: 256 } }]
    const saveOptions = { format: 'jpeg' }
    const result = await ImageManipulator.manipulateAsync(this.imageUri, actions, saveOptions)
    await this._createDirectory(tile)
    await FileSystem.moveAsync({ from: result.uri, to })
  }

  _createDirectory = async (tile) => {
    const path = `${this.cacheDirectory}/${tile.z}/${tile.x}`
    const { exists } = await FileSystem.getInfoAsync(path)
    if (!exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true })
    }
  }

  async createAllTiles(maxZoom) {
    const tiles = this.getTilesFromZeroToZoom(maxZoom)
    await this._manipulateTiles(tiles)
  }

  async createTilesForZoom(zoom) {
    const tiles = this.getTilesForZoom(zoom)
    await this._manipulateTiles(tiles)
  }
}
