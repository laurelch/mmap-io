// Generated by LiveScript 1.6.0
var fs, os, mmap, assert, constants, say, PAGESIZE, PROT_READ, PROT_WRITE, MAP_SHARED, e, fd, size, buffer, out, i$, ix, incore_stats, WRONG_PAGE_SIZE, testFile, testSize, fdW, wBuffer, fdR, rBuffer, i, val;
fs = require("fs");
os = require("os");
mmap = require("../");
assert = require("assert");
constants = require("constants");
say = function(){
  var args, res$, i$, to$;
  res$ = [];
  for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  args = res$;
  return console.log.apply(console, args);
};
say("mmap in test is", mmap);
PAGESIZE = mmap.PAGESIZE, PROT_READ = mmap.PROT_READ, PROT_WRITE = mmap.PROT_WRITE, MAP_SHARED = mmap.MAP_SHARED;
try {
  say("mmap.PAGESIZE = ", mmap.PAGESIZE, "tries to overwrite it with 47");
  mmap.PAGESIZE = 47;
  say("now mmap.PAGESIZE should be the same:", mmap.PAGESIZE, "silently kept");
} catch (e$) {
  e = e$;
  say("Caught trying to modify the mmap-object. Does this ever happen?", e);
}
fd = fs.openSync(process.argv[1], 'r');
size = fs.fstatSync(fd).size;
say("file size", size);
buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd, 0, mmap.MADV_SEQUENTIAL);
say("buflen 1 = ", buffer.length);
assert.equal(buffer.length, size);
say("Give advise with 2 args");
mmap.advise(buffer, mmap.MADV_NORMAL);
say("Give advise with 4 args");
mmap.advise(buffer, 0, mmap.PAGESIZE, mmap.MADV_NORMAL);
say("\n\nBuffer contents, read byte for byte backwards and see that nothing explodes:\n");
try {
  out = "";
  for (i$ = size - 1; i$ >= 0; --i$) {
    ix = i$;
    out += String.fromCharCode(buffer[ix]);
  }
  incore_stats = mmap.incore(buffer); // Returns tuple of [ unmapped-pages-count, mapped-pages-count ]
  assert.equal(incore_stats[0], 0);
  assert.equal(incore_stats[1], 2);
} catch (e$) {
  e = e$;
  if (e.message !== 'mincore() not implemented') {
    // assert(false, "Shit happened while reading from buffer");
    console.error("Error while reading from buffer:", e);
  }
}
try {
  say("read out of bounds test");
  assert.equal(typeof buffer[size + 47], "undefined");
} catch (e$) {
  e = e$;
  say("deliberate out of bounds, caught exception - does this thing happen?", e.code, 'err-obj = ', e);
}
buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd, 0);
say("buflen test 5-arg map call = ", buffer.length);
assert.equal(buffer.length, size);
buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd);
say("buflen test 4-arg map call = ", buffer.length);
assert.equal(buffer.length, size);
if (os.type() !== 'Windows_NT') {
  fd = fs.openSync(process.argv[1], 'r');
  buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd, PAGESIZE);
  say("buflen test 3 = ", buffer.length);
  assert.equal(buffer.length, size);
}
fd = fs.openSync(process.argv[1], 'r');
try {
  buffer = mmap.map("foo", PROT_READ, MAP_SHARED, fd, 0);
} catch (e$) {
  e = e$;
  say("Pass faulty arg - caught deliberate exception: " + e.message);
}
fd = fs.openSync(process.argv[1], 'r');
try {
  buffer = mmap.map(0, PROT_READ, MAP_SHARED, fd, 0);
} catch (e$) {
  e = e$;
  say("Pass zero size - caught deliberate exception: " + e.message);
}
WRONG_PAGE_SIZE = PAGESIZE - 1;
fd = fs.openSync(process.argv[1], 'r');
try {
  buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd, WRONG_PAGE_SIZE);
} catch (e$) {
  e = e$;
  say("Pass wrong page-size as offset - caught deliberate exception: " + e.message);
}
fd = fs.openSync(process.argv[1], 'r');
try {
  buffer = mmap.map(size, PROT_READ, MAP_SHARED, fd);
  mmap.advise(buffer, "fuck off");
} catch (e$) {
  e = e$;
  say("Pass faulty arg to advise() - caught deliberate exception: " + e.message);
}
say("Now for some write/read tests");
try {
  say("Creates file");
  testFile = "./tmp-mmap-file";
  testSize = 47474;
  fs.writeFileSync(testFile, "");
  fs.truncateSync(testFile, testSize);
  say("open write buffer");
  fdW = fs.openSync(testFile, 'r+');
  say("fd-write = ", fdW);
  wBuffer = mmap.map(testSize, PROT_WRITE, MAP_SHARED, fdW);
  fs.closeSync(fdW);
  mmap.advise(wBuffer, mmap.MADV_SEQUENTIAL);
  say("open read bufer");
  fdR = fs.openSync(testFile, 'r');
  rBuffer = mmap.map(testSize, PROT_READ, MAP_SHARED, fdR);
  fs.closeSync(fdR);
  mmap.advise(rBuffer, mmap.MADV_SEQUENTIAL);
  say("verify write and read");
  for (i$ = 0; i$ < testSize; ++i$) {
    i = i$;
    val = 32 + i % 60;
    wBuffer[i] = val;
    assert.equal(rBuffer[i], val);
  }
  say("Write/read verification seemed to work out");
} catch (e$) {
  e = e$;
  say("Something fucked up in the write/read test::", e.message);
}
try {
  say("sync() tests x 4");
  say("1. Does explicit blocking sync to disk");
  mmap.sync(wBuffer, 0, testSize, true, false);
  say("2. Does explicit blocking sync without offset/length arguments");
  mmap.sync(wBuffer, true, false);
  say("3. Does explicit sync to disk without blocking/invalidate flags");
  mmap.sync(wBuffer, 0, testSize);
  say("4. Does explicit sync with no additional arguments");
  mmap.sync(wBuffer);
} catch (e$) {
  e = e$;
  say("Something fucked up for syncs::", e.message);
}
try {
  fs.unlinkSync(testFile);
} catch (e$) {
  e = e$;
  say("Failed to remove test-file", testFile);
}
say("\nAll done");
process.exit(0);