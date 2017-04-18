const inherits = require('inherits'),
      assign = require('lodash/object/assign'),
      Tab = require('base/components/tab'),
      ensureOpts = require('util/ensure-opts'),
      __ = require('./../../../locales').__;

function EmptyTab(options) {

  if (!(this instanceof EmptyTab)) {
    return new EmptyTab(options);
  }

  options = assign({ empty: true }, options);

  ensureOpts([
    'app',
    'events'
  ], options);

  this.render = ()=>{

    const html =
      <div className="empty-tab">
        <p className="buttons-create">
          <span>{__('Create a')}</span>
          <button onClick={ this.app.compose('triggerAction', 'create-bpmn-diagram') }>BPMN {__('diagram_create')}</button>
          <span>{__('or')}</span>
          <button onClick={ this.app.compose('triggerAction', 'create-dmn-diagram') }>DMN {__('diagram_create')}</button>
          <span>{__('or')}</span>
          <button onClick={ this.app.compose('triggerAction', 'create-cmmn-diagram') }>CMMN {__('diagram_create')}</button>
        </p>
      </div>;

    return html;
  };

  Tab.call(this, options);

  this.on('focus', () => {
    this.events.emit('tools:state-changed', this, {});
  });
}

inherits(EmptyTab, Tab);

module.exports = EmptyTab;
