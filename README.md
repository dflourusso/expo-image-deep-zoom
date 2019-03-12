Expo Image Deep Zoom
===
> Use **MapView** to zoom big images

![Zoom image](./img/demo.gif)

### Installation

`yarn add expo-image-deep-zoom`

### Usage

```javascript 
import React from 'react'
import { InteractionManager, ActivityIndicator } from 'react-native'
import { FileSystem } from 'expo'

import DeepZoom from 'expo-image-deep-zoom'

export default class Planta extends React.Component {
  static navigationOptions = { title: 'Planta' }
  state = { uri: null, cacheDirectory: null }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      const uri = `${FileSystem.documentDirectory}my-image.jpg`
      const cacheDirectory = `${FileSystem.documentDirectory}my-image`
      this.setState({ cacheDirectory, uri })
    })
  }

  render() {
    const { uri } = this.state

    if (!uri) return <ActivityIndicator size='large' style={{ flex: 1 }}/>
    return <DeepZoom
      imageUri={this.state.uri}
      cacheDirectory={this.state.cacheDirectory}
      maxZoom={6}
    />
  }
}
```

### Author

[Daniel Fernando Lourusso](https://www.linkedin.com/in/dflourusso)
