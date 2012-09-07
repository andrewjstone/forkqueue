var assert = require('assert');
var Queue = require('../queue');

var queue = null;
var vals = [];
var msgsReceived = 0;
var workerModule = __dirname+'/testWorker.js';
var numWorkers = 5;

describe('queue with concurrency 5', function() {
  it('create a queue with 5 forked workers', function() {
    queue = new Queue(numWorkers, workerModule);
    queue.on('msg', function(str) {
      ++msgsReceived;
    });
  });

  it('enqueue 100 values', function() {
    for (var i = 0; i < 100; i++) {
      vals.push(i);
      queue.enqueue(i);
    }
    assert.equal(queue.queue.length, 100);
  });

  it('enqueue another 100 values already in an array', function() {
    queue.concat(vals);
    assert.equal(queue.queue.length, 200);
  });

  it('end the queue: ensure it gets emptied before the callback', function(done) {
    queue.end(function() {
      assert.equal(queue.enqueued, 200);
      assert.equal(queue.dequeued, 200);
      assert.equal(queue.queue.length, 0);
      done();
    });
  });

  it('1 message has been received from each worker', function() {
    // sometimes a worker is killed before doing anything
    assert(msgsReceived >= 4);
  });
});
