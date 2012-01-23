# streamspeed [![Build Status](https://secure.travis-ci.org/fent/node-streamspeed.png)](http://travis-ci.org/fent/node-streamspeed)

A simple way to keep track of the speed of your node streams.

# Usage

```js
var streamspeed = require('streamspeed');

var rs = fs.createReadStream('somefile.avi');
streamspeed.watch(rs);

// liten for events emitted by streamspeed
rs.on('readspeed', function(speed, avgSpeed) {
  console.log('Reading at', speed, 'bytes per second');
});

var ws = fs.createWriteStream('filecopy.avi');
streamspeed.watch(ws);

ws.on('writespeed', function(speed, avg) {
  // comes with convenient function for humans!
  console.log('Average write speed:', streamspeed.toHuman(avg));
});
```

Keep track of even a group of streams easily.

```js
var group = streamspeed.createGroup();
group.add(stream1);
group.add(stream2);
group.add(stream3);

group.on('readspeed', function(speed, avg) {
  console.log('now reading at', speed, 'bps');
});

group.on('writespeed', function(speed, avg) {
  console.log('now writing at', speed, 'bps');
});
```

![example img](http://i.imgur.com/y47Sc.png)

# API
### watch(stream, timeUnit)
Watches `stream` for any `data` events or calls to `write` and emits the following events

* 'readinfo' `function (speed, avgSpeed) { }`
* 'writespeed' `function (speed, avgSpeed) { }`

The events will be emitted before the 2nd `data` event or call to `write()`. And after the 2nd time, will only be emitted if there is a change to `speed` or `avgSpeed`. `timeUnit` defaults to 1000 for 1 second. Can be used to get the speed at a different time rate like 1 for `speed` per millisecond.

### unwatch(stream)
Unwatches `stream`. Stops emitting speed events. `unwatch` will be called on a watched stream if it emits an `end` or `error` event, on both individual streams and groups.

### toHuman(bytes, timeUnit)
Convenient method to convert `bytes` to a human readable string.

```js
streamspeed.toHuman(1500); // 1.46KB
streamspeed.toHuman(1024 * 1024) => 1MB
streamspeed.toHuman(1024 * 1024 * 20.5, 's') => 20.5MB/s
```

### Group(timeUnit)
A group that can be used to watch several streams. Will emit `readspeed` and `writespeed`.

### Group#watch(stream)
Add `stream` to group.

### Group#unwatch(stream)
Remove `stream` from group.

### Group#getStreams()
Convenient method that returns a list of all streams in the group.


# Install

    npm install streamspeed


# Tests
Tests are written with [mocha](http://visionmedia.github.com/mocha/)

```bash
npm test
```

# License
MIT
