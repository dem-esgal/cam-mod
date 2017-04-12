'use strict';

const inherits = require('inherits');
const assign = require('lodash/object/assign');
const domify = require('domify');
const DiagramEditor = require('./diagram-editor');
const BpmnJS = require('bpmn-js/lib/Modeler');

const diagramOriginModule = require('diagram-js-origin'),
      executableFixModule = require('./bpmn/executable-fix'),
      clipboardModule = require('./bpmn/clipboard'),
      propertiesPanelModule = require('bpmn-js-properties-panel'),
      propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
      camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda');

const WarningsOverlay = require('base/components/warnings-overlay');

const isUnsaved = require('util/file/is-unsaved');

const getWarnings = require('app/util/get-warnings');

const ensureOpts = require('util/ensure-opts'),
      dragger = require('util/dom/dragger'),
      isInputActive = require('util/dom/is-input').active,
      copy = require('util/copy');

const generateImage = require('app/util/generate-image');
const generateWar = require('app/util/generate-war');

const debug = require('debug')('bpmn-editor');


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function BpmnEditor(options) {

  ensureOpts([
    'layout',
    'config',
    'metaData'
  ], options);

  DiagramEditor.call(this, options);

  this.name = 'bpmn';

  // elements to insert modeler and properties panel into
  this.$propertiesEl = domify('<div class="properties-parent"></div>');

  this.openContextMenu = function(evt) {
    evt.preventDefault();

    this.emit('context-menu:open', 'bpmn');
  };

  // let canvas know that the window has been resized
  this.on('window:resized', this.compose('resize'));

  // set current modeler version and name to the diagram
  this.on('save', () => {
    let definitions = this.getModeler().definitions;

    if (definitions) {
      definitions.exporter = options.metaData.name;
      definitions.exporterVersion = options.metaData.version;
    }
  });
}

inherits(BpmnEditor, DiagramEditor);

module.exports = BpmnEditor;


BpmnEditor.prototype.triggerEditorActions = function(action, options = {}) {
  let opts = options,
      modeler = this.getModeler(),
      editorActions = modeler.get('editorActions', false);

  if (!editorActions) {
    return;
  }

  if ('alignElements' === action) {
    opts = options;
  }

  if ('moveCanvas' === action) {
    opts = assign({ speed: 20 }, options);
  }

  if ('zoomIn' === action) {
    action = 'stepZoom';

    opts = {
      value: 1
    };
  }

  if ('zoomOut' === action) {
    action = 'stepZoom';

    opts = {
      value: -1
    };
  }

  if ('zoom' === action) {
    opts = assign({
      value: 1
    }, options);
  }

  if ('zoomFit' === action) {
    action = 'zoom';

    opts = assign({
      value: 'fit-viewport'
    }, options);
  }

  if ('distributeHorizontally' === action) {
    action = 'distributeElements';

    opts = {
      type: 'horizontal'
    };
  }

  if ('distributeVertically' === action) {
    action = 'distributeElements';

    opts = {
      type: 'vertical'
    };
  }

  // ignore all editor actions (besides the following three)
  // if there's a current active input or textarea
  if ([ 'removeSelection', 'stepZoom', 'zoom', 'find' ].indexOf(action) === -1 && isInputActive()) {
    return;
  }

  debug('editor-actions', action, opts);

  // forward other actions to editor actions
  editorActions.trigger(action, opts);
};


BpmnEditor.prototype.updateState = function() {

  let modeler = this.getModeler(),
      initialState = this.initialState,
      commandStack,
      inputActive;

  // ignore change events during import
  if (initialState.importing) {
    return;
  }

  let elementsSelected,
      elements,
      dirty;

  let stateContext = {
    bpmn: true,
    undo: !!initialState.undo,
    redo: !!initialState.redo,
    dirty: initialState.dirty,
    exportAs: [ 'png', 'jpeg', 'svg', 'war' ]
  };

  // no diagram to harvest, good day maam!
  if (isImported(modeler)) {
    commandStack = modeler.get('commandStack');

    dirty = (
      initialState.dirty ||
      initialState.reimported ||
      initialState.stackIndex !== commandStack._stackIdx
    );

    // direct editing function
    elements = modeler.get('selection').get();
    elementsSelected = false;

    if (elements.length >= 1) {
      elementsSelected = true;
    }

    inputActive = isInputActive();

    stateContext = assign(stateContext, {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      elementsSelected: elementsSelected && !inputActive,
      dirty: dirty,
      zoom: true,
      editable: true,
      copy: true,
      inactiveInput: !inputActive,
      paste: !modeler.get('clipboard').isEmpty()
    });
  }

  this.emit('state-updated', stateContext);
};

BpmnEditor.prototype.getStackIndex = function() {
  const modeler = this.getModeler();

  return isImported(modeler) ? modeler.get('commandStack')._stackIdx : -1;
};

BpmnEditor.prototype.mountProperties = function(node) {
  debug('mount properties');

  node.appendChild(this.$propertiesEl);
};

BpmnEditor.prototype.unmountProperties = function(node) {
  debug('unmount properties');

  node.removeChild(this.$propertiesEl);
};

BpmnEditor.prototype.resizeProperties = function onDrag(panelLayout, event, delta) {

  const oldWidth = panelLayout.open ? panelLayout.width : 0;

  const newWidth = Math.max(oldWidth + delta.x * -1, 0);

  this.emit('layout:changed', {
    propertiesPanel: {
      open: newWidth > 25,
      width: newWidth
    }
  });

  this.notifyModeler('propertiesPanel.resized');
};

BpmnEditor.prototype.toggleProperties = function() {

  const config = this.layout.propertiesPanel;

  this.emit('layout:changed', {
    propertiesPanel: {
      open: !config.open,
      width: !config.open ? (config.width > 25 ? config.width : 250) : config.width
    }
  });

  this.notifyModeler('propertiesPanel.resized');
};


BpmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el, this.$propertiesEl);

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed',
      'elements.copied'
    ], this.updateState, this);

    // add importing flag (high priority)
    this.modeler.on('import.parse.start', 1500, () => {
      this.initialState.importing = true;
    });

    // remove importing flag (high priority)
    this.modeler.on('import.done', 1500, () => {
      this.initialState.importing = false;
    });

    // log errors into log
    this.modeler.on('error', 1500, (error) => {
      this.emit('log', [[ 'error', error.error ]]);
      this.emit('log:toggle', { open: true });
    });

    this.modeler.on('elementTemplates.errors', (e) => {
      this.logTemplateWarnings(e.errors);
    });
  }

  return this.modeler;
};


BpmnEditor.prototype.loadTemplates = function(done) {

  const file = this.file;

  const diagram = isUnsaved(file) ? null : { path: file.path };

  this.config.get('bpmn.elementTemplates', diagram, done);
};

BpmnEditor.prototype.createModeler = function($el, $propertiesEl) {

  const elementTemplatesLoader = this.loadTemplates.bind(this);

  const propertiesPanelConfig = {
    'config.propertiesPanel': [ 'value', { parent: $propertiesEl } ]
  };

  return new BpmnJS({
    container: $el,
    position: 'absolute',
    additionalModules: [
      clipboardModule,
      diagramOriginModule,
      executableFixModule,
      propertiesPanelModule,
      propertiesProviderModule,
      propertiesPanelConfig
    ],
    elementTemplates: elementTemplatesLoader,
    moddleExtensions: { camunda: camundaModdlePackage }
  });
};

BpmnEditor.prototype.exportAs = function(type, done) {
  let modeler = this.getModeler();
  if (type == 'war') {
    let file = {};
    try {
      this.saveXML((err, xml) => {
        if (err) {
          debug('[#showEditor] editor export error %s', err);
        }}
      );
      assign(file, { contents: '', buffer : generateWar(this.newXML, this.file) });
    } catch (err) {
      return done(err);
    }
    return done(null, file);
  }
  modeler.saveSVG((err, svg) => {
    let file = {};

    if (err) {
      return done(err);
    }

    if (type !== 'svg') {
      try {
        assign(file, { contents: generateImage(type, svg) });
      } catch (err) {
        return done(err);
      }
    } else {
      assign(file, { contents: svg });
    }

    done(null, file);
  });
};

// trigger the palette resizal whenever we focus a tab or the layout is updated
BpmnEditor.prototype.resize = function() {
  let modeler = this.getModeler(),
      canvas = modeler.get('canvas');

  canvas.resized();
};

BpmnEditor.prototype.render = function() {

  let propertiesLayout = this.layout.propertiesPanel;

  let propertiesStyle = {
    width: (propertiesLayout.open ? propertiesLayout.width : 0) + 'px'
  };

  let warnings = getWarnings(this.lastImport);

  return (
    <div className="bpmn-editor"
         key={ this.id + '#bpmn' }
         onFocusin={ this.compose('updateState') }
         onContextmenu={ this.compose('openContextMenu') }>
      <div className="editor-container"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
      <div className="properties" style={ propertiesStyle } tabIndex="0">
        <div className="toggle"
             ref="properties-toggle"
             draggable="true"
             onClick={ this.compose('toggleProperties') }
             onDragstart={ dragger(this.compose('resizeProperties', copy(propertiesLayout))) }>
          Properties Panel
        </div>
        <div className="resize-handle"
             draggable="true"
             onDragStart={ dragger(this.compose('resizeProperties', copy(propertiesLayout))) }></div>
        <div className="properties-container"
             onAppend={ this.compose('mountProperties') }
             onRemove={ this.compose('unmountProperties') }>
        </div>
      </div>
      <WarningsOverlay warnings={ warnings }
                       onOpenLog={ this.compose('openLog') }
                       onClose={ this.compose('hideWarnings') } />
    </div>
  );
};

BpmnEditor.prototype.logTemplateWarnings = function(warnings) {

  let messages = warnings.map(function(warning) {
    return [ 'warning', '> ' + warning.message ];
  });

  // prepend summary message
  messages.unshift([ 'warning', 'Some element templates could not be parsed' ]);

  messages.push([ 'warning', '' ]);

  this.log(messages, true);
};

/**
 * Notify initialized modeler about an event.
 *
 * @param {String} eventName
 */
BpmnEditor.prototype.notifyModeler = function(eventName) {

  let modeler = this.getModeler();

  try {
    modeler.get('eventBus').fire(eventName);
  } catch (e) {
    // we don't care
  }
};

function isImported(modeler) {
  return !!modeler.definitions;
}
