const inherits = require('inherits'),
      debounce = require('lodash/function/debounce'),
      BaseEditor = require('./base-editor'),
      debug = require('debug')('diagram-editor'),
      needsOverride = require('util/needs-override'),
      getWarnings = require('app/util/get-warnings');

/**
 * Base diagram editor.
 *
 * @param {Object} options
 */
function DiagramEditor(options) {

  BaseEditor.call(this, options);

  this.on('imported', (context) => {
    const xml = context.xml,
          warnings = context.warnings;

    const initialState = this.initialState;

    // we are back at start, unset reimport flag
    if (xml === initialState.xml) {
      initialState.reimported = false;
    } else

    // reimport, we are going to be dirty always
    if ('stackIndex' in initialState) {
      initialState.reimported = true;
    }

    initialState.stackIndex = -1;

    if (warnings && warnings.length) {
      this.showWarnings();
    }
  });

  this.on('updated', (context) => {
    const modeler = this.modeler,
          initialState = this.initialState;

    // log stack index on first imported
    // update after loading
    if (isImported(modeler) && !('stackIndex' in initialState)) {
      initialState.stackIndex = this.getStackIndex();
    }

    // on updated, update state and emit <shown> event
    this.updateState();

    this.emit('shown', context);
  });

  this.on('layout:update', function(evt) {
    const log = evt.log;

    if (log && log.cleared) {
      this.hideWarnings();
    }
  });

  this.on('focus', debounce(this.resize, 50));
  this.on('window:resized', debounce(this.resize, 50));
  this.on('layout:update', debounce(this.resize, 50));
}

inherits(DiagramEditor, BaseEditor);

module.exports = DiagramEditor;


/**
 * Update the editor contents because they changed
 * or we re-mounted.
 */
DiagramEditor.prototype.update = function() {

  // only do actual work if mounted
  if (!this.mounted) {
    debug('[#update] skipping (not mounted)');

    return;
  }

  const modeler = this.getModeler(),
        lastXML = this.lastXML,
        newXML = this.newXML;

  // reimport in XML change
  if (!newXML || lastXML === newXML) {
    debug('[#update] skipping (no change)');

    this.emit('updated', this.lastImport);

    return;
  }

  debug('[#update] import');

  this.emit('import', newXML);

  this.lastXML = newXML;

  modeler.importXML(newXML, (err, warnings) => {

    const importContext = this.lastImport = {
      error: err,
      warnings: warnings,
      xml: newXML
    };

    debug('[#update] imported', importContext);

    this.emit('imported', importContext);

    this.emit('updated', importContext);
  });
};


DiagramEditor.prototype.destroy = function() {
  const modeler = this.getModeler();

  if (modeler.destroy) {
    modeler.destroy();
  }
};

// This allows an easier replacing of this method f.ex: DMN needs
DiagramEditor.prototype.saveXML = function(done) {
  const modeler = this.getModeler(),
        commandStack = modeler.get('commandStack');

  this._saveXML(modeler, commandStack._stackIdx, done);
};


DiagramEditor.prototype._saveXML = function(modeler, commandStackIdx, done) {

  const initialState = this.initialState;

  debug('[#saveXML] save');

  this.emit('save');

  const savedCallback = (err, xml) => {

    const saveContext = { error: err, xml: xml };

    debug('[#saveXML] saved', saveContext);

    this.emit('saved', saveContext);

    if (err) {
      return done(err);
    }

    this.lastXML = this.newXML = xml;

    done(null, xml);
  };

  if (!(initialState.stackIndex !== commandStackIdx)) {
    return savedCallback(null, this.lastXML);
  }

  modeler.saveXML({ format: true }, savedCallback);
};


DiagramEditor.prototype.triggerAction = function(action, options) {

  const modeler = this.getModeler();

  if (action === 'undo') {
    return modeler.get('commandStack').undo();
  }

  if (action === 'redo') {
    return modeler.get('commandStack').redo();
  }

  this.triggerEditorActions(action, options);
};


DiagramEditor.prototype.isHistoryLost = function(xml) {
  return this.lastXML !== xml;
};


DiagramEditor.prototype.triggerEditorActions = function() {
  throw needsOverride();
};


DiagramEditor.prototype.resize = function() {
  throw needsOverride();
};


DiagramEditor.prototype.showWarnings = function() {

  const warnings = getWarnings(this.lastImport);

  if (!warnings) {
    return;
  }

  const messages = warnings.map(function(warning) {
    return [ 'warning', '> ' + warning.message ];
  });

  // prepend summary message
  messages.unshift([ 'warning', 'Imported ' + this.name.toUpperCase() + ' diagram with ' + warningsStr(warnings) ]);

  messages.push([ 'warning', '' ]);

  this.log(messages);
};

DiagramEditor.prototype.hideWarnings = function() {
  this.lastImport = null;

  this.emit('changed');
};

DiagramEditor.prototype.log = function(messages, open) {
  this.emit('log', messages);

  if (open) {
    this.openLog();
  }
};

DiagramEditor.prototype.openLog = function() {
  this.emit('log:toggle', { open: true });

  this.hideWarnings();
};


function warningsStr(warnings) {
  const count = warnings.length;

  return count + ' warning' + (count !== 1 ? 's' : '');
}

function isImported(modeler) {
  return modeler && !!modeler.definitions;
}
