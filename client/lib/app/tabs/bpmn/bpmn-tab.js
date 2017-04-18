const inherits = require('inherits');

const assign = require('lodash/object/assign');

const BpmnEditor = require('../../editor/bpmn-editor'),
      XMLEditor = require('../../editor/xml-editor'),
      MultiEditorTab = require('../multi-editor-tab'),
      FromEditor = require('../../editor/form-editor');

const ensureOpts = require('util/ensure-opts');

const __ = require('./../../../../locales/').__;

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
      { id: 'diagram', label: __('Diagram'), component: BpmnEditor },
      { id: 'xml', label: __('XML'), isFallback: true, component: XMLEditor },
      { id: 'form-editor', label: __('Form Editor'), isFallback: true, component: FromEditor }
    ]
  }, options);

  MultiEditorTab.call(this, options);
}

inherits(BpmnTab, MultiEditorTab);

module.exports = BpmnTab;
