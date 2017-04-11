'use strict';
const AdmZip = require('adm-zip');
const Buffer = global.Buffer;

function generateWar(newXml, bpmn20) {
  //let zip = new AdmZip('resources/files.zip');
  let zip = new AdmZip();
  zip.addLocalFolder('resources/deploy/');
  zip.addFile('WEB-INF/classes/process.properties', new Buffer('process.name=my first'), '');
  zip.addFile('WEB-INF/classes/'+bpmn20.name, new Buffer(newXml), '');
  //zip.writeZip(/*target file name*/"files.war");
  return zip.toBuffer();
}

module.exports = generateWar;
