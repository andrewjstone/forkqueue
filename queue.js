var cp = require('child_process'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

var Queue = module.exports = function(numWorkers, workerModule) {
  this.workerModule = workerModule;
  this.workers = [];
  this.waiting = [];
  this.queue = [];
  this.dequeued = 0;
  this.enqueued = 0;
  this.done = false;
  this.terminated = false;
  this.callback = null;

  for (var i = 0; i < numWorkers; i++) {
    this.addWorker();
  }
};

util.inherits(Queue, EventEmitter);

Queue.prototype.addWorker = function() {
  var self = this;
  var worker = cp.fork(this.workerModule);
  this.workers.push(worker);
  worker.on('message', function(m) {
    self.handleMessage(m, worker);
  });
};

Queue.prototype.enqueue = function(val) {
  ++this.enqueued;
  this.queue.unshift(val);
  this.flush();
};

Queue.prototype.concat = function(array) {
  this.enqueued += array.length;
  if (array.length) {
    this.queue = array.concat(this.queue);
  }
  this.flush();
};

Queue.prototype.flush = function() {
  var worker = null,
      val = null;

  while (this.waiting.length && this.queue.length) {
    worker = this.waiting.pop();
    val = this.queue.pop();
    ++this.dequeued;
    worker.send(val);
  }
};

Queue.prototype.handleMessage = function(message, worker) {
  if (this.terminated) return;
  if (typeof message === 'object' && message.msg) return this.emit('msg', message.msg);
  if (message !== 'next') return console.error('Child sent and invalid message: '+message);

  this.waiting.push(worker);
  this.flush();

  if (!this.queue.length && this.done) {
    this.killWorkers();
    if (this.callback) this.callback();
  }
};

Queue.prototype.end = function(callback) {
  if (this.queue.length) {
    this.done = true;
    this.callback = callback;
  } else {
    this.killWorkers();
    if (callback) callback();
  }
};

Queue.prototype.killWorkers = function() {
  this.workers.forEach(function(worker) {
    worker.kill();
  });
  this.terminated = true;
}
