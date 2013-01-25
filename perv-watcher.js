var sys = require('sys')
var exec = require('child_process').exec;
var Inotify = require('inotify-plusplus');

var PervStore  = require('./perv-store.js');

var config = require('./config.json');
var store = new PervStore(config.database);
var watch_path = config.watch_path || '~/sites';



function find_paths_watch(base_path) {
  var paths_find_process = exec('find ' + watch_path + ' -type d ! -path \*.git\*', {maxBuffer: 1024*1024*1024}, function (error, stdout, stderr) {
    if (error) {
      console.log('error finding directories to watch');
      console.log(error);
    } else {
      perv_watch(stdout.split('\n'));
    }
  });
}

function perv_watch(watch_paths) {
  function log_event(ev) {
    store.write(ev);
  }

  var directive = {
    close_write: log_event,
    modify: log_event,
    moved_from: true
  }
  var options = {
    all_events_is_catchall: true // by default (false) "all_events" only catches events already listened for.
                                 // this option tells "all_events" to catch all events, period.
  , onlydir: true
  }
  directive.create = function(ev) {
      inotify.watch(directive, ev.watch+'/'+ev.name, options);
  }
  var inotify = Inotify.create(true); // stand-alone, persistent mode, runs until you hit ctrl+c

  watch_paths.forEach(function(path) {
    if (path.search(/[!-~]/) > -1) {
      inotify.watch(directive, path, options);
    }
  });
}


//begin
find_paths_watch(watch_path);