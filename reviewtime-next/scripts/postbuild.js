const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '..', 'out')
const enDir = path.join(outDir, 'en')

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function run() {
  if (!fs.existsSync(outDir)) {
    console.warn('[postbuild] out directory does not exist, skipping.')
    return
  }

  // 1. Copy out/en.html -> out/index.html
  const enHtml = path.join(outDir, 'en.html')
  const indexHtml = path.join(outDir, 'index.html')
  if (fs.existsSync(enHtml)) {
    fs.copyFileSync(enHtml, indexHtml)
    console.log('[postbuild] Copied out/en.html -> out/index.html')
  }

  const enTxt = path.join(outDir, 'en.txt')
  const indexTxt = path.join(outDir, 'index.txt')
  if (fs.existsSync(enTxt)) {
    fs.copyFileSync(enTxt, indexTxt)
    console.log('[postbuild] Copied out/en.txt -> out/index.txt')
  }

  // 2. Synchronize out/en/* to out/ (so /journals, /statistics, /about etc. exist at root)
  if (fs.existsSync(enDir)) {
    copyRecursive(enDir, outDir)
    console.log('[postbuild] Synchronized out/en/* to out/ root.')
  }

  console.log('[postbuild] Completed postbuild static asset synchronization.')
}

run()
