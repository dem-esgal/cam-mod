var i18n = require('i18next');

var RU = require('./ru/');
var EN = require('./en/');

i18n.init({
  fallbackLng: 'ru'
}, function() {
  i18n.addResourceBundle('en','modeller',EN['modeller']);
  i18n.addResourceBundle('ru','modeller',RU['modeller']);

});
module.exports = {
  __ : function(word) {
    return i18n.t('modeller:' + word);
  }
};
