import React, { Component } from 'react'
import * as tf from '@tensorflow/tfjs'

import { IMAGENET_CLASSES } from './imagenetClasses'

import cat from './cat.jpg'
import dog from './dog.jpg'

const imgs = { cat, dog }

const getImg = imgSrc =>
  new Promise(resolve => {
    const img = new Image()
    img.src = imgSrc
    img.crossOrigin = '*'
    img.onload = () => resolve(img)
  })

const IMAGE_SIZE = 224
const NORM_OFFSET = tf.scalar(127.5)

const MODEL_PATH =
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
// const MODEL_PATH = `${process.env.PUBLIC_URL}/static/model/emotion/model.json`

class App extends Component {
  componentDidMount() {
    this.loadModel()
  }

  prepImg = async imgSrc => {
    let img = await getImg(imgSrc)

    // Convert to tensor
    img = tf.fromPixels(img)

    // Normalize the image from [0, 255] to [-1, 1].
    const normalized = img
      .toFloat()
      .sub(NORM_OFFSET)
      .div(NORM_OFFSET)

    // Resize the image to
    let resized = normalized
    if (img.shape[0] !== IMAGE_SIZE || img.shape[1] !== IMAGE_SIZE) {
      const alignCorners = true
      resized = tf.image.resizeBilinear(
        normalized,
        [IMAGE_SIZE, IMAGE_SIZE],
        alignCorners
      )
    }

    // Reshape to a single-element batch so we can pass it to predict.
    const batched = resized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3])

    return batched
  }

  loadModel = async () => {
    this.model = await tf.loadModel(MODEL_PATH)

    console.log('model loaded!')
    window.model = this.model // TODO: remove this

    // warmup model
    const result = tf.tidy(() =>
      this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]))
    )
    await result.data()

    // model input / output shape
    const inShape = this.model.inputs[0].shape
    const outShape = this.model.outputs[0].shape
    console.log({ inShape, outShape })

    // predict!
    const inputs = await this.prepImg(imgs.dog)
    const logits = this.model.predict(inputs).dataSync()
    const maxProb = Math.max.apply(null, logits)
    const topClass = IMAGENET_CLASSES[logits.indexOf(maxProb)]
    console.log(topClass)
  }

  render() {
    return (
      <div className="container">
        <p>stay tuned :)</p>
      </div>
    )
  }
}

export default App
