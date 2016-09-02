# streamspeed

A simple way to keep track of the speed of your readable streams.

[![Build Status](https://secure.travis-ci.org/fent/node-streamspeed.svg)](http://travis-ci.org/fent/node-streamspeed)
[![Dependency Status](https://gemnasium.com/fent/node-streamspeed.svg)](https://gemnasium.com/fent/node-streamspeed)
[![codecov](https://codecov.io/gh/fent/node-streamspeed/branch/master/graph/badge.svg)](https://codecov.io/gh/fent/node-streamspeed)

# Usage

```js
var StreamSpeed = require('streamspeed');

var rs = fs.createReadStream('somefile.avi');
var ss = new StreamSpeed();
ss.add(rs);

// Listen for events emitted by streamspeed on the given stream.
ss.on('speed', function(speed, avgSpeed) {
  console.log('Reading at', speed, 'bytes per second');
});
```

Keep track of even a group of streams easily.

```js
var group = new Streamspeed();
group.add(stream1);
group.add(stream2);
group.add(stream3);

group.on('speed', function(speed, avg) {
  console.log('now reading at', speed, 'bps');
});
```

![example img](http://i.imgur.com/y47Sc.png)

# API
### new StreamSpeed(timeUnit)
A group that can be used to watch several streams. Will emit `speed` events. `timeUnit` defaults to `1000` for speed per second.

### StreamSpeed#add(stream)
Adds stream to group.

### StreamSpeed#remove(stream)
Removes stream from group.

### StreamSpeed#getStreams()
Returns a list of all streams in the group.

### StreamSpeed#speed
Curent speed.

### StreamSpeed#avg
Current average speed.

### StreamSpeed.toHuman(bytes, timeUnit)
Convenient method to convert `bytes` to a human readable string.

```js
StreamSpeed.toHuman(1500); // 1.46KB
StreamSpeed.toHuman(1024 * 1024) => 1MB
StreamSpeed.toHuman(1024 * 1024 * 20.5, 's') => 20.5MB/s
```

### Event: 'speed'
* `Number` - Speed at which streams in the group are being read.
* `Number` - Average speed.

Will be emitted after the second time a stream is read and only if there is a change in speed.


# Install

    npm install streamspeed


# Tests
Tests are written with [mocha](http://visionmedia.github.com/mocha/)

```bash
npm test
```

# License
MIT
