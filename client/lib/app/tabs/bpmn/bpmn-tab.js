'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var BpmnEditor = require('../../editor/bpmn-editor'),
    XMLEditor = require('../../editor/xml-editor'),
    MultiEditorTab = require('../multi-editor-tab'),
    FromEditor = require('../../editor/form-editor');

var ensureOpts = require('util/ensure-opts');


/**
 * A tab displaying a BPMN diagram.
 *
 * @param {Object} options
 */
function BpmnTab(options) {

  if (!(this instanceof BpmnTab)) {
    return new BpmnTab(options);
  }

  ensureOpts([
    'metaData'
  ], options);

  options = assign({
    editorDefinitions: [
      { id: 'diagram', label: 'Diagram', component: BpmnEditor },
      { id: 'xml', label: 'XML', isFallback: true, component: XMLEditor },
      { id: 'form-editor', label: 'Edit Form', isFallback: true, component: FromEditor }
    ]
  }, options);

  MultiEditorTab.call(this, options);
}

inherits(BpmnTab, MultiEditorTab);

module.exports = BpmnTab;
