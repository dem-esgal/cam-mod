const path = require('path'),
      map = require('lodash/collection/map'),
      filterExtensions = require('./util/filter-extensions'),
      ensureOptions = require('./util/ensure-opts'),
      __ = require('./locales/').__;

/**
 * Interface for handling dialogs.
 *
 * @param  {Object} Options
 */
function Dialog(options) {
  ensureOptions([ 'dialog', 'config', 'userDesktopPath' ], options);

  this.dialog = options.dialog;
  this.config = options.config;

  this.userDesktopPath = options.userDesktopPath;
}

module.exports = Dialog;


Dialog.prototype.getDialogOptions = function(type, opts) {
  const config = this.config,
        userDesktopPath = this.userDesktopPath;
  let defaultPath;

  // filepath is passed if a saved file is focused
  if (opts && opts.filePath) {
    defaultPath = path.dirname(opts.filePath);
  } else {
    defaultPath = config.get('defaultPath', userDesktopPath);
  }

  this._dialogs = {
    contentChanged: ()=>{
      return {
        title: __('File changed'),
        message: __('FILE_CHANGED_MSG'),
        type: 'question',
        buttons: [
          { id: 'ok', label: __('Reload') },
          { id: 'cancel', label: __('Cancel') }
        ]
      };
    },
    open: ()=>{
      return {
        title: __('Open diagram'),
        defaultPath: defaultPath,
        properties: [ 'openFile', 'multiSelections' ],
        filters: filterExtensions([ 'supported', 'bpmn', 'dmn', 'cmmn', 'all','war' ])
      };
    },
    save: function(options) {
      ensureOptions([ 'name', 'fileType' ], options);

      return {
        title: __('Save ') + options.name + __('AS'),
        defaultPath: defaultPath + '/' + options.name,
        filters: filterExtensions([ options.fileType, 'all' ])
      };
    },
    close: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        title: __('Close diagram'),
        message: __('Save changes to ') + options.name + __(' before closing?'),
        type: 'question',
        buttons: [
          { id: 'cancel', label: __('Cancel') },
          { id: 'save', label: __('Save') },
          { id: 'discard', label: __('Don\'t Save') }
        ]
      };
    },
    importError: function(options) {
      ensureOptions([ 'name', 'errorDetails' ], options);

      return {
        type: 'error',
        title: __('Importing Error'),
        buttons: [
          { id: 'cancel', label: __('Close') },
          { id: 'ask-forum', label: __('Ask in Forum') }
        ],
        message: __('Ooops, we could not display this diagram!'),
        detail: [
          options.errorDetails,
          '',
          __('Do you believe "') + options.name + __('" is valid BPMN or DMN diagram?'),
          '',
          ''
        ].join('\n')
      };
    },
    unrecognizedFile: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        type: 'warning',
        title: __('Unrecognized file format'),
        buttons: [
          { id: 'cancel', label: 'Close' }
        ],
        message: __('The file "') + options.name + __('" is not a BPMN, DMN or CMMN file.')
      };
    },
    existingFile: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        type: 'warning',
        title: __('Existing file'),
        buttons: [
          { id: 'cancel', label: __('Cancel') },
          { id: 'no-overwrite', label: __('No') },
          { id: 'overwrite', label: __('Overwrite') }
        ],
        message: __('The file "') + options.name + __('" already exists. Do you want to overwrite it?')
      };
    },
    namespace: function(options) {
      let oldNs = '',
          newNs = '',
          details = [];

      ensureOptions([ 'type' ], options);

      if (options.type === 'bpmn') {
        oldNs = '<activiti>';
        newNs = '<camunda>';

        details = [
          __('This will allow you to maintain execution related properties.'),
          '',
          __('<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.')
        ];
      }

      if (options.type === 'dmn') {
        oldNs = 'DMN';
        newNs = 'new DMN';
      }

      return {
        type: 'warning',
        title: __('Deprecated ') + oldNs + __(' namespace detected'),
        buttons: [
          { id: 'cancel', label: __('Cancel') },
          { id: 'no', label: __('No') },
          { id: 'yes', label: __('Yes') }
        ],
        message: __('DEPRECATED_NS',{ newNs:newNs }),
        detail: details.join('\n')
      };
    },
    savingDenied: function(options) {
      return {
        type: 'warning',
        title: __('Cannot save file'),
        buttons: [
          { id: 'cancel', label: __('Cancel') },
          { id: 'save-as', label: __('SAVE_FILE_AS') }
        ],
        message: [
          __('We cannot save or overwrite the current file.'),
          __('SAVE_FILE_CONFIRM')
        ].join('\n')
      };
    }
  };

  return this._dialogs[type](opts);
};

Dialog.prototype.setDefaultPath = function(filenames) {
  let config = this.config,
      defaultPath,
      dirname;

  if (Array.isArray(filenames)) {
    defaultPath = filenames[0];
  } else {
    defaultPath = filenames;
  }

  if (this.defaultPath && this.defaultPath === defaultPath) {
    return this.defaultPath;
  }

  dirname = path.dirname(defaultPath);

  config.set('defaultPath', dirname);

  this.defaultPath = dirname;
};

Dialog.prototype.showDialog = function(type, opts, done) {
  const self = this;

  if (typeof opts === 'function') {
    done = opts;
    opts = undefined;
  }

  const dialog = this.dialog,
        dialogOptions = this.getDialogOptions(type, opts),
        buttons = dialogOptions.buttons;

  // windows needs this property
  dialogOptions.noLink = true;

  if (dialogOptions.buttons) {
    dialogOptions.buttons = map(buttons, function(button) {
      return button.label;
    });
  }

  done = done || function(err, result) {
    console.log(result);
  };

  function dialogCallback(answer) {
    let result;

    if (type !== 'open' && type !== 'save') {
      // get the button ID according to the result
      result = buttons[answer].id;
    } else {
      result = answer;
    }

    // save last used path to config
    if (result && (type === 'open' || type === 'save')) {
      self.setDefaultPath(result);
    }

    done(null, result);
  }

  if (type === 'open') {
    dialog.showOpenDialog(dialogOptions, dialogCallback);

  } else
  if (type === 'save') {
    dialog.showSaveDialog(dialogOptions, dialogCallback);

  } else {
    dialog.showMessageBox(dialogOptions, dialogCallback);
  }
};

Dialog.prototype.showGeneralErrorDialog = ()=>{
  const dialog = this.dialog;

  dialog.showErrorBox('Error', __('There was an internal error.') + '\n' + __('Please try again.'));
};
