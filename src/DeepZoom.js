import React from 'react'
import PropTypes from 'prop-types'
import { MapView } from 'expo'

export default class DeepZoom extends React.Component {

  static get propTypes() {
    return {
      urlTemplate: PropTypes.string.isRequired,
      maxZoom: PropTypes.number.isRequired
    }
  }

  render() {
    const { maxZoom, urlTemplate } = this.props

    return (<MapView
        mapType={'none'}
        provider='google'
        style={{ flex: 1 }}
        minZoomLevel={0}
        maxZoomLevel={maxZoom}
        initialRegion={{
          latitude: 0,
          longitude: 0,
          latitudeDelta: 150,
          longitudeDelta: 150
        }}
      >
        <MapView.UrlTile urlTemplate={urlTemplate} tileSize={256}/>
      </MapView>
    )
  }
}
