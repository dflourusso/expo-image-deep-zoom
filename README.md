Expo Image Deep Zoom
===
> Use **MapView** to zoom big images

### Installation

`yarn add expo-image-deep-zoom`

### Usage

#### Loading online tiles
```javascript 
import { DeepZoom } from 'expo-image-deep-zoom'

export default class App extends React.Component {
  render() {
    return <DeepZoom
      maxZoom={5}
      urlTemplate='http://your-server/tiles/{z}/{x}/{y}.jpg'
    />
  }
}
```

#### Loading offline tiles

You can download the tiles from your server
```javascript 
import { DeepZoom } from 'expo-image-deep-zoom'
import { FileSystem } from 'expo'

export default class App extends React.Component {
  render() {
    return <DeepZoom
      maxZoom={5}
      urlTemplate={`${FileSystem.documentDirectory}tiles/{z}/{x}/{y}.jpg`}
    />
  }
}
```

Or generate the tiles in the user device
> It can be very slow
```javascript 
import { View, Text } from 'react-native'
import { DeepZoom } from 'expo-image-deep-zoom'
import { FileSystem } from 'expo'

const MAX_ZOOM = 5

export default class App extends React.Component {
  state = { ready: false, progress: 0 }
  
  componentDidMount() {
    (async () => {
      const cacheDirectory = `${FileSystem.documentDirectory}tiles`
      const onProgress = ({loaded, total}) => this.setState({ progress: parseInt(total / loaded) })
      const tileGrid = new TileGrid(uri, cacheDirectory, onProgress)
      await tileGrid.init()
      await tileGrid.createAllTiles(MAX_ZOOM)
      this.setState({ ready: true })
    })()
  }
  
  render() {
    if (!this.state.ready) return <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
      <Text>{this.state.progress}%</Text>
    </View>
  
    return <DeepZoom
      maxZoom={MAX_ZOOM}
      urlTemplate={`${FileSystem.documentDirectory}tiles/{z}/{x}/{y}.jpg`}
    />
  }
}
```

### Author

[Daniel Fernando Lourusso](https://www.linkedin.com/in/dflourusso)
