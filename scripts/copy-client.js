// collect duino-klutch-client distribution
const fs = require('fs-extra')
const path = require('path')

const dstDir = path.resolve(__dirname, '../public')
const srcDir = path.resolve(__dirname, '../../duino-klutch-client/dist')

fs.emptyDirSync(dstDir)
fs.copySync(srcDir, dstDir)
