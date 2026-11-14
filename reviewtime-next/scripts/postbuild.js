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

function setHtmlLang(target, lang) {
  if (!fs.existsSync(target)) return
  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      setHtmlLang(path.join(target, entry), lang)
    }
    return
  }
  if (!target.endsWith('.html')) return

  const html = fs.readFileSync(target, 'utf8')
  const localized = /<html\b[^>]*\blang="[^"]*"/i.test(html)
    ? html.replace(/\blang="[^"]*"/i, `lang="${lang}"`)
    : html.replace(/<html\b/i, `<html lang="${lang}"`)
  if (localized !== html) fs.writeFileSync(target, localized)
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

  // Next's root layout is emitted with the default language. Rewrite the
  // localized static HTML so user agents see the correct language immediately.
  setHtmlLang(path.join(outDir, 'zh.html'), 'zh')
  setHtmlLang(path.join(outDir, 'zh'), 'zh')
  console.log('[postbuild] Set lang="zh" on Chinese HTML exports.')

  console.log('[postbuild] Completed postbuild static asset synchronization.')
}

run()
