import React from 'react'
import { ActivityIndicator, PixelRatio, StyleSheet, View } from 'react-native'
import PropTypes from 'prop-types'
import { MapView } from 'expo'

import TileGrid from './TileGrid'
import { tilesForZoom } from './RegionToTile'

const INITIAL_REGION = { latitude: 0, longitude: 0, latitudeDelta: 150, longitudeDelta: 150 }

export default class DeepZoom extends React.Component {
  state = {
    mapRegion: undefined,
    loading: true,
    showTilesComponent: false
  }

  static get propTypes() {
    return {
      imageUri: PropTypes.string.isRequired,
      cacheDirectory: PropTypes.string.isRequired,
      maxZoom: PropTypes.number.isRequired
    }
  }

  get urlTemplate() {
    return `${this.props.cacheDirectory}/{z}-{x}-{y}.jpg`
  }

  componentDidMount() {
    this.init()
  }

  tilesToGenerate = tiles => {
    const tilesOnDisk = this.tileGrid.tilesOnDisk
    return tiles.filter(p => !tilesOnDisk.includes(`${p.z}-${p.x}-${p.y}.jpg`))
  }

  init = async () => {
    this.tileGrid = new TileGrid(this.props.imageUri, this.props.cacheDirectory, () => { })
    await this.tileGrid.init()
    const _tiles = this.tileGrid.getTilesForZoom(2)
    const tiles = this.tilesToGenerate(_tiles)
    await this.tileGrid.manipulateTiles(tiles)
    this.setState({ showTilesComponent: true, loading: false })
  }

  generateTiles = async () => {
    if (!this.tileGrid.imageSize) return
    const { mapRegion } = this.state
    const _tiles = tilesForZoom(mapRegion, this._calcZoom(mapRegion.longitudeDelta))
    const tiles = this.tilesToGenerate(_tiles)
    if (tiles.length > 0) {
      this.setState({ loading: true })
      await this.tileGrid.manipulateTiles(tiles)
      this.setState({ loading: false, showTilesComponent: false }, () => {
        this.setState({ showTilesComponent: true })
      })
    }
  }

  _calcZoom = longitudeDelta => {
    const pixelRatio = PixelRatio.get() - 2
    return Math.round(Math.log(360 / longitudeDelta) / Math.LN2) + pixelRatio
  }

  handleMapRegionChange = mapRegion => {
    this.setState({ mapRegion }, this.generateTiles)
  }

  render() {
    const { maxZoom } = this.props

    return (<View style={{ flex: 1 }}><MapView
        mapType={'none'}
        provider='google'
        style={{ flex: 1 }}
        minZoomLevel={0}
        maxZoomLevel={maxZoom}
        initialRegion={INITIAL_REGION}
        rotateEnabled={false}
        showsCompass={false}
        pitchEnabled={false}
        onRegionChangeComplete={this.handleMapRegionChange}>
        {this.state.showTilesComponent && <MapView.UrlTile urlTemplate={this.urlTemplate} zIndex={1}/>}
      </MapView>
        {this.state.loading && <View style={StyleSheet.absoluteFillObject}>
          <ActivityIndicator
            size="large"
            style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, .5)' }}
          />
        </View>}
      </View>
    )
  }
}
