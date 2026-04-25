const fs = require('fs')
const path = require('path')

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)
const newPatch = patch + 1
const newVersion = `${major}.${minor}.${newPatch}`

// versionCode = integer built from version: 1.0.0 → 10000, 1.0.42 → 10042
const versionCode = major * 10000 + minor * 1000 + newPatch

pkg.version = newVersion
fs.writeFileSync(path.join(__dirname, '../package.json'), JSON.stringify(pkg, null, 2) + '\n')

const androidGradle = path.join(__dirname, '../android/app/build.gradle')
if (fs.existsSync(androidGradle)) {
  let gradle = fs.readFileSync(androidGradle, 'utf8')
  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`)
  fs.writeFileSync(androidGradle, gradle)
  console.log(`Android: versionCode=${versionCode} versionName=${newVersion}`)
}

const iosPlist = path.join(__dirname, '../ios/App/App/Info.plist')
if (fs.existsSync(iosPlist)) {
  let plist = fs.readFileSync(iosPlist, 'utf8')
  plist = plist
    .replace(/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${newVersion}$2`)
    .replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${versionCode}$2`)
  fs.writeFileSync(iosPlist, plist)
  console.log(`iOS: CFBundleShortVersionString=${newVersion} CFBundleVersion=${versionCode}`)
}

console.log(`\nVersion bumped: ${pkg.version.replace(`.${patch}`, `.${patch}`)} → ${newVersion}`)
