const electron = require('electron'),
      Menu = electron.Menu,
      MenuItem = electron.MenuItem,
      app = electron.app,
      browserOpen = require('../util/browser-open'),
      merge = require('lodash/object/merge'),
      assign = require('lodash/object/assign'),
      __ = require('./../locales/').__;


function MenuBuilder(opts) {
  this.opts = merge({
    appName: app.name,
    state: {
      dmn: false,
      activeEditor: null,
      cmmn: false,
      bpmn: false,
      undo: false,
      redo: false,
      editable: false,
      copy: false,
      paste: false,
      searchable: false,
      zoom: false,
      save: false,
      closable: false,
      elementsSelected: false,
      dmnRuleEditing: false,
      dmnClauseEditingfalse: false,
      exportAs: false,
      development: app.developmentMode,
      devtools: false
    }
  }, opts);

  if (this.opts.template) {
    this.menu = Menu.buildFromTemplate(this.opts.template);
  } else {
    this.menu = new Menu();
  }
}

module.exports = MenuBuilder;

MenuBuilder.prototype.appendAppMenu = function() {
  return this;
};

MenuBuilder.prototype.appendFileMenu = function(submenu) {
  this.menu.append(new MenuItem({
    label: __('File'),
    submenu: submenu
  }));

  return this;
};

MenuBuilder.prototype.appendNewFile = function() {
  this.menu.append(new MenuItem({
    label: __('New File'),
    submenu: Menu.buildFromTemplate([{
      label: 'BPMN ' + __('Diagram'),
      accelerator: 'CommandOrControl+T',
      click: function() {
        app.emit('menu:action', 'create-bpmn-diagram');
      }
    }, {
      label: 'DMN ' + __('Table'),
      click: function() {
        app.emit('menu:action', 'create-dmn-table');
      }
    }, {
      label: 'DMN ' + __('Diagram'),
      click: function() {
        app.emit('menu:action', 'create-dmn-diagram');
      }
    }, {
      label: 'CMMN '+__('Diagram'),
      click: function() {
        app.emit('menu:action', 'create-cmmn-diagram');
      }
    }])
  }));

  return this;
};

MenuBuilder.prototype.appendOpen = function() {
  this.menu.append(new MenuItem({
    label: __('Open_File'),
    accelerator: 'CommandOrControl+O',
    click: function() {
      app.emit('menu:action', 'open-diagram');
    }
  }));
  this.menu.append(new MenuItem({
    label: __('OPEN_WAR_FILE'),
    accelerator: 'CommandOrControl+W',
    click: function() {
      app.emit('menu:action', 'open-war');
    }
  }));
  //this.appendReopenLastTab();

  return this;
};

MenuBuilder.prototype.appendReopenLastTab = function() {
  this.menu.append(new MenuItem({
    label: __('Reopen Last File'),
    accelerator: 'CommandOrControl+Shift+T',
    click: ()=>{
      app.emit('menu:action', 'reopen-last-tab');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveFile = function() {
  this.menu.append(new MenuItem({
    label: __('Save File'),
    enabled: this.opts.state.save,
    accelerator: 'CommandOrControl+S',
    click: ()=>{
      app.emit('menu:action', 'save');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveAsFile = function() {
  this.menu.append(new MenuItem({
    label: __('SAVE_FILE_AS'),
    accelerator: 'CommandOrControl+Shift+S',
    enabled: this.opts.state.save,
    click: ()=>{
      app.emit('menu:action', 'save-as');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveAllFiles = function() {
  this.menu.append(new MenuItem({
    label: __('Save All Files'),
    accelerator: 'CommandOrControl+Alt+S',
    enabled: this.opts.state.save,
    click: ()=>{
      app.emit('menu:action', 'save-all');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendExportAs = function(submenu) {
  const exportState = this.opts.state.exportAs;

  function canExport(type) {
    return (exportState || []).indexOf(type) !== -1;
  }

  this.menu.append(new MenuItem({
    label: __('EXPORT_AS'),
    submenu: submenu || Menu.buildFromTemplate([{
      label: 'PNG Image',
      enabled: canExport('png'),
      click: ()=>{
        app.emit('menu:action', 'export-tab', { type: 'png' });
      }
    },
    {
      label: 'JPEG ' + __('Image'),
      enabled: canExport('jpeg'),
      click: ()=>{
        app.emit('menu:action', 'export-tab', { type: 'jpeg' });
      }
    },
    {
      label: 'SVG ' + __('Image'),
      enabled: canExport('svg'),
      click: ()=>{
        app.emit('menu:action', 'export-tab', { type: 'svg' });
      }
    },
    {
      label: 'War',
      enabled: canExport('war'),
      click: ()=>{
        app.emit('menu:action', 'export-tab', { type: 'war' });
      }
    }
    ])
  }));

  this.appendSeparator();

  return this;
};

MenuBuilder.prototype.appendCloseTab = function() {
  this.menu.append(new MenuItem({
    label: __('Close Tab'),
    enabled: this.opts.state.closable,
    accelerator: 'CommandOrControl+W',
    click: ()=>{
      app.emit('menu:action', 'close-active-tab');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Close All Tabs'),
    enabled: this.opts.state.closable,
    click: ()=>{
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Close Other Tabs'),
    enabled: this.opts.state.closable,
    click: ()=>{
      app.emit('menu:action', 'close-other-tabs');
    }
  }));

  return this;
};

// todo(ricardo): add a proper state check for switching tabs
MenuBuilder.prototype.appendSwitchTab = function(submenu) {
  this.menu.append(new MenuItem({
    label: __('SWITCH_TAB'),
    submenu: submenu || Menu.buildFromTemplate([{
      label: __('Select Next Tab'),
      enabled: this.opts.state.closable,
      accelerator: 'Control+TAB',
      click: ()=>{
        app.emit('menu:action', 'select-tab', 'next');
      }
    },
    {
      label: __('Select Previous Tab'),
      enabled: this.opts.state.closable,
      accelerator: 'Control+SHIFT+TAB',
      click: ()=>{
        app.emit('menu:action', 'select-tab', 'previous');
      }
    }])
  }));

  this.appendSeparator();

  return this;
};

MenuBuilder.prototype.appendQuit = function(submenu) {
  this.menu.append(new MenuItem({
    label: __('Quit'),
    accelerator: 'CommandOrControl+Q',
    click: ()=>{
      app.emit('app:quit');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendRedo = function() {
  this.menu.append(new MenuItem({
    label: __('Redo'),
    enabled: this.opts.state.redo,
    accelerator: 'CommandOrControl+Y',
    click: ()=>{
      app.emit('menu:action', 'redo');
    }
  }));
};

MenuBuilder.prototype.appendCopyPaste = function() {

  const copyEntry = {
    label: __('Copy'),
    enabled: !this.opts.state.inactiveInput || (this.opts.state.elementsSelected && this.opts.state.copy),
    accelerator: 'CommandOrControl+C',
    click: ()=>{
      app.emit('menu:action', 'copy');
    }
  };

  const pasteEntry = {
    label: __('Paste'),
    enabled: !this.opts.state.inactiveInput || this.opts.state.paste,
    accelerator: 'CommandOrControl+V',
    click: ()=>{
      app.emit('menu:action', 'paste');
    }
  };

  if (!this.opts.state.inactiveInput) {
    this.menu.append(new MenuItem({
      label: __('Cut'),
      accelerator: 'CommandOrControl+X',
      role: 'cut'
    }));

    copyEntry.role = 'copy';
    pasteEntry.role = 'paste';
  }

  this.menu.append(new MenuItem(copyEntry));

  this.menu.append(new MenuItem(pasteEntry));

  return this;
};

MenuBuilder.prototype.appendBaseEditActions = function() {
  this.menu.append(new MenuItem({
    label: __('Undo'),
    enabled: this.opts.state.undo,
    accelerator: 'CommandOrControl+Z',
    click: ()=>{
      app.emit('menu:action', 'undo');
    }
  }));

  this.appendRedo();

  this.appendSeparator();

  this.appendCopyPaste();

  return this;
};

MenuBuilder.prototype.appendBpmnActions = function() {
  this.menu.append(new MenuItem({
    label: __('Hand Tool'),
    accelerator: 'H',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'handTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Lasso Tool'),
    accelerator: 'L',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'lassoTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Space Tool'),
    accelerator: 'S',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'spaceTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Global Connect Tool'),
    accelerator: 'C',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'globalConnectTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Edit Label'),
    accelerator: 'E',
    enabled: this.opts.state.elementsSelected,
    click: ()=>{
      app.emit('menu:action', 'directEditing');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: __('Align Elements'),
    enabled: this.opts.state.elementsSelected,
    submenu: Menu.buildFromTemplate([
      {
        label: __('Align Left'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'left'
          });
        }
      }, {
        label: __('Align Right'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'right'
          });
        }
      }, {
        label: __('Align Center'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'center'
          });
        }
      }, {
        label: __('Align Top'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'top'
          });
        }
      }, {
        label: __('Align Bottom'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'bottom'
          });
        }
      }, {
        label: __('Align Middle'),
        click: ()=>{
          app.emit('menu:action', 'alignElements', {
            type: 'middle'
          });
        }
      }
    ])
  }));

  this.menu.append(new MenuItem({
    label: __('Distribute Elements'),
    enabled: this.opts.state.elementsSelected,
    submenu: Menu.buildFromTemplate([
      {
        label: __('Distribute Horizontally'),
        enabled: this.opts.state.elementsSelected,
        click: ()=>{
          app.emit('menu:action', 'distributeHorizontally');
        }
      },
      {
        label: __('Distribute Vertically'),
        enabled: this.opts.state.elementsSelected,
        click: ()=>{
          app.emit('menu:action', 'distributeVertically');
        }
      }
    ])
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: __('Find'),
    accelerator: 'CommandOrControl + F',
    click: ()=>{
      app.emit('menu:action', 'find');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: __('Move Elements to Origin'),
    accelerator: 'CommandOrControl+Shift+0',
    click: ()=>{
      app.emit('menu:action', 'moveToOrigin');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Move Canvas'),
    submenu: Menu.buildFromTemplate([{
      label: 'Move Up',
      accelerator: 'Up',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'up'
        });
      }
    }, {
      label: __('Move Left'),
      accelerator: 'Left',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'left'
        });
      }
    }, {
      label: __('Move Down'),
      accelerator: 'Down',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'down'
        });
      }
    }, {
      label: __('Move Right'),
      accelerator: 'Right',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'right'
        });
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: __('Select All'),
    accelerator: 'CommandOrControl+A',
    click: ()=>{
      app.emit('menu:action', 'selectElements');
    }
  }));

  this.appendRemoveSelection();

  return this;
};


MenuBuilder.prototype.appendCmmnActions = function() {
  this.menu.append(new MenuItem({
    label: __('Hand Tool'),
    accelerator: 'H',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'handTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Lasso Tool'),
    accelerator: 'L',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'lassoTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Space Tool'),
    accelerator: 'S',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'spaceTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Global Connect Tool'),
    accelerator: 'C',
    enabled: this.opts.state.inactiveInput,
    click: ()=>{
      app.emit('menu:action', 'globalConnectTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Edit Label'),
    accelerator: 'E',
    enabled: this.opts.state.elementsSelected,
    click: ()=>{
      app.emit('menu:action', 'directEditing');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: __('Find'),
    accelerator: 'CommandOrControl + F',
    click: ()=>{
      app.emit('menu:action', 'find');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: __('Move Canvas'),
    submenu: Menu.buildFromTemplate([{
      label: __('Move Up'),
      accelerator: 'Up',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'up'
        });
      }
    }, {
      label: __('Move Left'),
      accelerator: 'Left',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'left'
        });
      }
    }, {
      label: __('Move Down'),
      accelerator: 'Down',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'down'
        });
      }
    }, {
      label: __('Move Right'),
      accelerator: 'Right',
      click: ()=>{
        app.emit('menu:action', 'moveCanvas', {
          direction: 'right'
        });
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: __('Select All'),
    accelerator: 'CommandOrControl+A',
    click: ()=>{
      app.emit('menu:action', 'selectElements');
    }
  }));

  this.appendRemoveSelection();

  return this;
};

MenuBuilder.prototype.appendRemoveSelection = function() {
  this.menu.append(new MenuItem({
    label: __('Remove Selected'),
    accelerator: 'Delete',
    enabled: this.opts.state.elementsSelected,
    click: ()=>{
      app.emit('menu:action', 'removeSelection');
    }
  }));
};


MenuBuilder.prototype.appendDmnActions = function() {
  const activeEditor = this.opts.state.activeEditor;

  if (activeEditor === 'diagram') {
    // DRD EDITOR
    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('Lasso Tool'),
      accelerator: 'L',
      enabled: this.opts.state.inactiveInput,
      click: ()=>{
        app.emit('menu:action', 'lassoTool');
      }
    }));

    this.menu.append(new MenuItem({
      label: __('Edit Label'),
      accelerator: 'E',
      enabled: this.opts.state.elementsSelected,
      click: ()=>{
        app.emit('menu:action', 'directEditing');
      }
    }));

    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('Select All'),
      accelerator: 'CommandOrControl+A',
      click: ()=>{
        app.emit('menu:action', 'selectElements');
      }
    }));

    this.appendRemoveSelection();

  } else if (activeEditor === 'table') {
    // TABLE EDITOR

    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('ADD_RULE'),
      submenu: Menu.buildFromTemplate([{
        label: 'At End',
        accelerator: 'CommandOrControl+D',
        click: ()=>{
          app.emit('menu:action', 'ruleAdd');
        }
      }, {
        label: __('Above Selected'),
        enabled: this.opts.state.dmnRuleEditing,
        click: ()=>{
          app.emit('menu:action', 'ruleAddAbove');
        }
      }, {
        label: __('Below Selected'),
        enabled: this.opts.state.dmnRuleEditing,
        click: ()=>{
          app.emit('menu:action', 'ruleAddBelow');
        }
      }])
    }));

    this.menu.append(new MenuItem({
      label: __('Clear Rule'),
      enabled: this.opts.state.dmnRuleEditing,
      click: ()=>{
        app.emit('menu:action', 'ruleClear');
      }
    }));

    this.menu.append(new MenuItem({
      label: __('Remove Rule'),
      enabled: this.opts.state.dmnRuleEditing,
      click: ()=>{
        app.emit('menu:action', 'ruleRemove');
      }
    }));

    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('ADD_CLAUSE'),
      submenu: Menu.buildFromTemplate([{
        label: __('Input'),
        click: ()=>{
          app.emit('menu:action', 'clauseAdd', {
            type: 'input'
          });
        }
      }, {
        label: __('Output'),
        click: ()=>{
          app.emit('menu:action', 'clauseAdd', {
            type: 'output'
          });
        }
      }, {
        type: 'separator'
      }, {
        label: __('Left of selected'),
        enabled: this.opts.state.dmnClauseEditing,
        click: ()=>{
          app.emit('menu:action', 'clauseAddLeft');
        }
      }, {
        label: __('Right of selected'),
        enabled: this.opts.state.dmnClauseEditing,
        click: ()=>{
          app.emit('menu:action', 'clauseAddRight');
        }
      }])
    }));

    this.menu.append(new MenuItem({
      label: __('Remove Clause'),
      enabled: this.opts.state.dmnClauseEditing,
      click: ()=>{
        app.emit('menu:action', 'clauseRemove');
      }
    }));

    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('Insert New Line'),
      accelerator: 'CommandOrControl + Enter',
      enabled: this.opts.state.dmnRuleEditing,
      click: ()=>{
        app.emit('menu:action', 'insertNewLine');
      }
    }));

    this.menu.append(new MenuItem({
      label: __('Select Next Row'),
      accelerator: 'Enter',
      enabled: this.opts.state.dmnRuleEditing,
      click: ()=>{
        app.emit('menu:action', 'selectNextRow');
      }
    }));

    this.menu.append(new MenuItem({
      label: __('Select Previous Row'),
      accelerator: 'Shift + Enter',
      enabled: this.opts.state.dmnRuleEditing,
      click: ()=>{
        app.emit('menu:action', 'selectPreviousRow');
      }
    }));

    this.appendSeparator();

    this.menu.append(new MenuItem({
      label: __('Toggle Editing Mode'),
      accelerator: 'CommandOrControl + M',
      click: ()=>{
        app.emit('menu:action', 'toggleEditingMode');
      }
    }));
  }

  return this;
};


MenuBuilder.prototype.appendSearchActions = function() {
  this.menu.append(new MenuItem({
    label: __('Find'),
    accelerator: 'CommandOrControl + F',
    click: ()=>{
      app.emit('menu:action', 'find');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Find Next'),
    accelerator: 'Shift + CommandOrControl + N',
    click: ()=>{
      app.emit('menu:action', 'findNext');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Find Previous'),
    accelerator: 'Shift + CommandOrControl + P',
    click: ()=>{
      app.emit('menu:action', 'findPrev');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Replace'),
    accelerator: 'Shift + CommandOrControl + F',
    click: ()=>{
      app.emit('menu:action', 'replace');
    }
  }));
};

MenuBuilder.prototype.appendEditMenu = function() {
  if (this.opts.state.editable) {
    const builder = new this.constructor(this.opts).appendBaseEditActions();

    if (this.opts.state.bpmn) {
      builder.appendSeparator();

      builder.appendBpmnActions();
    }

    if (this.opts.state.dmn) {
      builder.appendDmnActions();
    }

    if (this.opts.state.cmmn) {
      builder.appendSeparator();

      builder.appendCmmnActions();
    }

    if (this.opts.state.searchable) {
      builder.appendSeparator();

      builder.appendSearchActions();
    }

    this.menu.append(new MenuItem({
      label: __('Edit'),
      submenu: builder.get()
    }));
  }

  return this;
};

MenuBuilder.prototype.appendWindowMenu = function() {

  const submenu = [];

  if (this.opts.state.zoom) {
    submenu.push({
      label: __('Zoom In'),
      accelerator: 'CommandOrControl+=',
      click: ()=>{
        app.emit('menu:action', 'zoomIn');
      }
    }, {
      label: __('Zoom Out'),
      accelerator: 'CommandOrControl+-',
      click: ()=>{
        app.emit('menu:action', 'zoomOut');
      }
    }, {
      label: __('Zoom to Actual Size'),
      accelerator: 'CommandOrControl+0',
      click: ()=>{
        app.emit('menu:action', 'zoom');
      }
    }, {
      label: __('Zoom to Fit Diagram'),
      accelerator: 'CommandOrControl+1',
      click: ()=>{
        app.emit('menu:action', 'zoomFit');
      }
    }, {
      type: 'separator'
    });
  }

  if (this.opts.state.development || this.opts.state.devtools) {
    submenu.push({
      label: __('Reload'),
      accelerator: 'CommandOrControl+R',
      click: function(menuItem, browserWindow) {
        browserWindow.reload();
      }
    });
  }

  submenu.push({
    label: __('Toggle DevTools'),
    accelerator: 'F12',
    click: (menuItem, browserWindow) => {

      const isDevToolsOpened = browserWindow.isDevToolsOpened();

      if (isDevToolsOpened) {

        app.mainWindow.once('devtools-closed', () => {
          app.emit('menu:update', assign({}, this.opts.state, {
            devtools: false
          }));
        });

        browserWindow.closeDevTools();
      } else {

        app.mainWindow.once('devtools-opened', () => {
          app.emit('menu:update', assign({}, this.opts.state, {
            devtools: true
          }));
        });

        browserWindow.openDevTools();
      }
    }
  }, {
    label: __('Fullscreen'),
    accelerator: 'F11',
    click: function(menuItem, browserWindow) {
      if (browserWindow.isFullScreen()) {
        return browserWindow.setFullScreen(false);
      }

      browserWindow.setFullScreen(true);
    }
  });


  if (app.mainWindow) {
    this.menu.append(new MenuItem({
      label: __('Window'),
      submenu: Menu.buildFromTemplate(submenu)
    }));
  }
  return this;
};

MenuBuilder.prototype.appendHelpMenu = function(submenu) {
  this.menu.append(new MenuItem({
    label: __('Help'),
    submenu: submenu || Menu.buildFromTemplate([
      {
        label: __('Documentation'),
        click: ()=>{
          browserOpen('https://docs.camunda.org/manual/latest/modeler/camunda-modeler');
        }
      },
      /*
      {
        label: 'User Forum',
        click: ()=>{
          browserOpen('https://forum.camunda.org/c/modeler');
        }
      },*/
      {
        label: __('Keyboard Shortcuts'),
        click: function(menuItem, browserWindow) {
          app.emit('menu:action', 'show-shortcuts');
        }
      },
      {
        type: 'separator'
      },
      /*
      {
        label: 'BPMN 2.0 Tutorial',
        click: ()=>{
          browserOpen('https://camunda.org/bpmn/tutorial/');
        }
      },
      {
        label: 'BPMN Modeling Reference',
        click: ()=>{
          browserOpen('https://camunda.org/bpmn/reference/');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'DMN 1.1 Tutorial',
        click: ()=>{
          browserOpen('https://camunda.org/dmn/tutorial/');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'CMMN 1.1 Tutorial',
        click: ()=>{
          browserOpen('https://docs.camunda.org/get-started/cmmn11/');
        }
      },
      {
        label: 'CMMN Modeling Reference',
        click: ()=>{
          browserOpen('https://docs.camunda.org/manual/latest/reference/cmmn11/');
        }
      },
      {
        type: 'separator'
      },
      */
      {
        label: __('Version ') + app.version,
        enabled: false
      }
    ])
  }));

  return this;
};

MenuBuilder.prototype.appendSeparator = function() {
  this.menu.append(new MenuItem({
    type: 'separator'
  }));

  return this;
};

MenuBuilder.prototype.get = function() {
  return this.menu;
};

MenuBuilder.prototype.build = function() {
  return this.appendFileMenu(
      new this.constructor(this.opts)
        .appendNewFile()
        .appendOpen()
        .appendSeparator()
        .appendSwitchTab()
        .appendSaveFile()
        .appendSaveAsFile()
        .appendSaveAllFiles()
        .appendSeparator()
        .appendExportAs()
        .appendCloseTab()
        .appendSeparator()
        .appendQuit()
        .get()
    )
    .appendEditMenu()
    .appendWindowMenu()
    .appendHelpMenu()
    .setMenu();
};

MenuBuilder.prototype.setMenu = function() {
  Menu.setApplicationMenu(this.menu);
  return this;
};

MenuBuilder.prototype.appendContextCloseTab = function(attrs) {
  this.menu.append(new MenuItem({
    label: __('Close Tab'),
    enabled: this.opts.state.closable,
    accelerator: 'CommandOrControl+W',
    click: ()=>{
      app.emit('menu:action', 'close-tab', attrs);
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Close All Tabs'),
    enabled: this.opts.state.closable,
    click: ()=>{
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: __('Close Other Tabs'),
    enabled: this.opts.state.closable,
    click: ()=>{
      app.emit('menu:action', 'close-other-tabs', attrs);
    }
  }));

  return this;
};

MenuBuilder.prototype.buildContextMenu = function(type, attrs) {
  if (type === 'bpmn') {
    return this.appendCopyPaste();
  }

  if (type === 'tab') {
    return this.appendNewFile()
      .appendSeparator()
      .appendContextCloseTab(attrs)
      .appendSeparator()
      .appendReopenLastTab();
  }
};

MenuBuilder.prototype.openPopup = function() {
  return this.menu.popup();
};
