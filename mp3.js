const lame = require('lame')
const through2 = require('through2')
const stream = require('stream')

const STREAM_ENCODE_DEFAULTS = {
  bitRate: 128,
  outSampleRate: 22050,
  mode: lame.STEREO
}

const MP3_DEFAULTS = {
  channels: 1,
  bitDepth: 16,
  sampleRate: 44100
}

const duration = 1591745;

const createSegments = (segments, MP3Format = MP3_DEFAULTS, duration) => {
  let currentIndex = 0
  let currentMs = 0;
  let segMilliseconds = duration / segments.length
  // TODO: reduce down again to get rid of small 1s gaps
  const _segments = segments.reduce((accum, segment) => {
    const last = accum[accum.length - 1]
    
    if (last && last.pause && segment.pause) {
      last.duration += 1
      last.pause += segment.pause
      last.buffer = null // remove buffer
    } else if (last && last.buffer && segment.buffer) {
      last.duration += 1
      last.buffer = true
    } else {
      accum.push(Object.assign(segment, { id: currentIndex, duration: 1, startTime: currentMs }))
      currentIndex += 1
    }
    currentMs += segMilliseconds
    return accum
  }, [])
  _segments.MP3Format = MP3Format
  return _segments
}

const toMP3Stream =
  (options, segment = {}) =>
  (encodeOptions = STREAM_ENCODE_DEFAULTS) => {
    const bufferStream = new stream.PassThrough()
      .pipe(
        new lame.Encoder(Object.assign({}, options, encodeOptions))
      )
    bufferStream.end(segment.buffer)
    return bufferStream
  }

function decorateSegment (segment, index, arr) {
  return Object.assign({
    toMP3Stream: toMP3Stream(arr.MP3Format, segment),
    isSilence: !!segment.pause
  }, segment)
}

const createSplitter = () => {
  let oddByte = null
  let channel = 0
  return through2.obj(function (data, enc, callback) {
    let i = 0
    let value
    const values = []
    let currentMs = 0

    const fraction = duration / (data.length / 2)

    // If there is a leftover byte from the previous block, combine it with the
    // first byte from this block
    if (oddByte !== null) {
      value = ((data.readInt8(i++) << 8) | oddByte) / 32767
      channel = ++channel % 2
    }

    for (; i < data.length; i += 2) {
      value = data.readInt16LE(i) / 32767
      currentMs += fraction
      values.push({value, startTime: currentMs})
      channel = ++channel % 2
    }

    if (values.every(v => Math.abs(v.value) < 0.01)) {
      this.push({ pause: 1 })
    } else {
      this.push({ buffer: true })
    }

    oddByte = (i < data.length) ? data.readUInt8(i) : null
    callback()
  })
}

module.exports = function splitAudioPause (readStream, duration, options = {}) {
  return new Promise((resolve, reject) => {
    const decoder = new lame.Decoder()
    const splitBuffers = createSplitter()
    const audioComposition = []
    let MP3Format

    decoder.on('error', reject)
    decoder.on('format', _format => { MP3Format = _format })
    splitBuffers.on('data', data => audioComposition.push(data))
    splitBuffers.on('error', reject)
    splitBuffers.on('end', () => {
      console.log("done splitting buffers")
      const segments = createSegments(audioComposition, MP3Format, duration)
        .map(decorateSegment)

      resolve(segments)
    })

    readStream
      .pipe(decoder)
      .pipe(splitBuffers)
      .on('error', reject)
  })
}