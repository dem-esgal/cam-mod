const canvg = require('canvg-browser');

// list of defined encodings
const ENCODINGS = [ 'image/png', 'image/jpeg' ];
const __ = require('./../../../locales/').__;


function generateImage(type, svg) {
  const encoding = 'image/' + type,
        canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> '+__('is an unknown type for converting svg to image'));
  }

  canvg(canvas, svg);

  // make the background white for every format

  context.globalCompositeOperation = 'destination-over';

  context.fillStyle = 'white';

  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(encoding);
}

module.exports = generateImage;
