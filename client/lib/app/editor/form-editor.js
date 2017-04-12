'use strict';

let inherits = require('inherits');
let BaseEditor = require('./base-editor');
let debug = require('debug')('xml-editor');
const app = require('electron').remote.app;
const path = require('path');
const basepath = app.getAppPath();
const webviewUrl = 'file://' + path.resolve(basepath + '/../fb/index.html');

function FormEditor(options) {

  BaseEditor.call(this, options);

  // update edit state with every shown
  this.on('updated', (ctx) => {
    this.updateState();

    this.emit('shown', ctx);
  });

  this.on('shown', () => {

  });
}

inherits(FormEditor, BaseEditor);

module.exports = FormEditor;


FormEditor.prototype.render = function() {
  return (
    <div className="form-editor" key={ this.id + '#xml' } height="100%">
      <div className="form-editor-container"
           tabIndex="0"
           height="100%"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
        <webview ref="webview" src={webviewUrl} autosize="on"></webview>
      </div>
    </div>
  );
};

FormEditor.prototype.updateState = function() {

  var initialState = this.initialState || { xml: this.lastXML };

  var stateContext = {
    undo: !!history.undo,
    redo: !!history.redo,
    dirty: (
      initialState.dirty
    ),
    exportAs: false,
    editable: true,
    searchable: true
  };

  this.emit('state-updated', stateContext);
};


FormEditor.prototype.update = function() {

  // only do actual work if mounted
  if (!this.mounted) {
    debug('[#update] skipping (not mounted)');

    return;
  }

  var newXML = this.newXML;
  this.emit('imported', newXML);
  this.lastXML = newXML;
  this.emit('updated', {});
};

FormEditor.prototype.triggerAction = function(action, options) {

};


FormEditor.prototype.saveXML = function(done) {
  var xml;

  debug('#saveXML - save');

  this.emit('save');

  this.lastXML = this.newXML = xml = '';

  var saveContext = { error: null, xml: xml };

  debug('#saveXML - saved', saveContext);

  this.emit('saved', saveContext);

  done(null, xml);
};


FormEditor.prototype.destroy = function() {
};

