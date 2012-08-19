var cp = require('child_process');

var Queue = module.exports = function(numWorkers, workerModule) {
  this.workers = [];
  this.waiting = [];
  this.queue = [];
  this.dequeued = 0;
  this.enqueued = 0;
  this.done = false;
  this.callback = null;

  var self = this;
  for (var i = 0; i < numWorkers; i++) {
    var worker = cp.fork(workerModule);
    worker.on('message', function(m) {
      self.handleMessage(m, worker);
    });
    this.workers.push(worker);
  }
};

Queue.prototype.enqueue = function(val) {
  ++this.enqueued;
  if (this.waiting.length) {
    var worker = this.waiting.pop();
    worker.send(val);
  } else {
    this.queue.unshift(val);
  }
};

Queue.prototype.handleMessage = function(message, worker) {
  if (message !== 'next') throw(new Error('Child must only send "next" messages'));
  if (this.queue.length) {
    ++this.dequeued;
    var val = this.queue.pop();
    worker.send(val);
    if (!this.queue.length && this.done) {
      this.killWorkers();
      if (this.callback) this.callback();
    }
  } else {
    this.waiting.push(worker);
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
}
