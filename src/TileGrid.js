import { Image } from 'react-native'
import { FileSystem, ImageManipulator } from 'expo'

/*
* Usage:
*   const tiles = new TileGrid(`${FileSystem.documentDirectory}images/image.png`, `${FileSystem.documentDirectory}tiles`, onProgress)
*   await tiles.init()
*   await tiles.manipulateTiles(tiles)
*/
export default class TileGrid {
  _tilesOnDisk = []

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
    await this._createDirectory(this.cacheDirectory)
    this._tilesOnDisk = await FileSystem.readDirectoryAsync(this.cacheDirectory)
  }

  get tilesOnDisk() {
    return this._tilesOnDisk
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

  _getDimensionsForCrop(tile) {
    const ratio = Math.pow(2, tile.z)
    const size = this.imageSize / ratio
    const originX = size * tile.x
    const originY = size * tile.y

    return { originX, originY, width: size, height: size }
  }

  async manipulateTiles(tiles) {
    for (const i in tiles) {
      if (tiles.hasOwnProperty(i)) {
        await this._manipulateTile(tiles[i]).catch((e) => {
          if (__DEV__) console.log('Tile manipulation error', e)
        })
        this.onProgress({ loaded: parseInt(i) + 1, total: tiles.length })
      }
    }
  }

  async _manipulateTile(tile) {
    const fileName = `${tile.z}-${tile.x}-${tile.y}.jpg`
    const to = `${this.cacheDirectory}/${fileName}`
    const actions = [{ crop: this._getDimensionsForCrop(tile) }, { resize: { width: 256, height: 256 } }]
    const saveOptions = { format: 'jpeg' }
    const result = await ImageManipulator.manipulateAsync(this.imageUri, actions, saveOptions)
    await FileSystem.moveAsync({ from: result.uri, to })
    this._tilesOnDisk.push(fileName)
  }

  _createDirectory = async (directory) => {
    const { exists } = await FileSystem.getInfoAsync(directory)
    if (!exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true })
    }
  }
}
