process.send({msg: 'test'});
process.on('message', function(value) {
  // Do something with value

  // Tell the parent to return the next value off the queue
  process.send('next');
});

process.send('next');

