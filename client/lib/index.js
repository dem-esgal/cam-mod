'use strict';

var domReady = require('domready');

var debug = require('debug')('app-client');

// provide vdom utility
global.h = require('vdom/h');

var Config = require('external/config'),
    Dialog = require('external/dialog'),
    Events = require('base/events'),
    FileSystem = require('external/file-system'),
    Logger = require('base/logger'),
    Menu = require('external/window-menu'),
    ContextMenu = require('external/context-menu'),
    Workspace = require('external/workspace');

var App = require('./app');

var mainLoop = require('util/dom/main-loop');

var browser = require('util/browser');

var remote = require('electron').remote,
    metaData = remote.getGlobal('metaData');

domReady(function() {
  var events = new Events();

  var app = new App({
    config: new Config(),
    dialog: new Dialog(events),
    events: events,
    fileSystem: new FileSystem(),
    logger: new Logger(),
    workspace: new Workspace(),
    metaData: metaData
  });

  // Setting up external components
  new Menu(app);
  new ContextMenu(app);

  app.on('ready', function() {
    debug('client is ready');

    browser.send('client:ready');
  });

  app.on('quitting', function() {
    debug('client is quitting');

    browser.send('app:quit-allowed');
  });

  browser.on('client:open-files', function(e, files) {
    debug('opening external files: ', files);

    app.openFiles(files);
  });

  browser.on('client:window-focused', function(e) {
    debug('window focused');

    app.recheckTabContent(app.activeTab);
  });

  browser.on('dialog-overlay:toggle', function(e, isOpened) {
    debug('toggle dialog overlay', isOpened);

    app.toggleOverlay(isOpened);
  });

  mainLoop(app, document.body);

  app.run();
});


require('debug').enable('*');
