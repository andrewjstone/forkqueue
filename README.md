ForkQueue creates a queue where the items are removed via a 'next' message received from child processes. The number of child processes is passed to the constructor along with the full path of the module to run. The processes are spawned via child\_process.fork
# API

## Constructor

```javascript
var Queue = require('forkqueue');
var numWorkers = 5,
    module = 'worker.js';

var queue = new Queue(numWorkers, module);
```

## Enqueue
Add a value to the queue

```javascript
for (var i = 0; i < 100; i++) {
  queue.enqueue(i);
}
```

## Concat 
Puts the values of the array onto the queue

```javascript
var vals = [];
for (var i = 0; i < 100; i++) {
  vals.push(i);
}
queue.concat(vals);
```

## End
Wait for the child processes to work through the queue then kill them.

```javascript
queue.end(callback);
```

## Events
The Queue inherits from EventEmitter. It emits the following events:

 * ```msg```, ```str``` - a string message forwarded from a worker 

## Worker modules

Worker modules are spawned with [child_process.fork](http://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options). In order to request a value off the queue, they send a 'next' message to the parent with ```process.send('next')```. The only message sent to them contains the value off the queue. They will exit with 'SIGTERM' sent from the parent after ```queue.end``` is called. They can also send ```{msg: 'str'}``` messages that get emitted from the queue. 

A simple worker is below.

```javascript
  process.send({msg: 'some string'});

  process.on('message', function(value) {
    // Do something with value

    // Tell the parent to return the next value off the queue
    process.send('next');
  });

  process.send('next');
```


