import { NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

const EXCLUDE_DIRS = ['node_modules','.next','.git','memory','.vercel','dist','build','out','.cache','coverage','test_reports','tests','__pycache__','.emergent']
const EXCLUDE_FILES = ['.env','.DS_Store','npm-debug.log','yarn-debug.log','yarn-error.log']
const EXCLUDE_EXTENSIONS = ['.log','.pyc','.pem','.pack','.deb','.dylib','.node','.png','.jpg','.jpeg','.gif','.ico','.svg','.woff','.woff2','.ttf','.eot','.zip','.tar','.gz','.tgz']

async function getAllFiles(dir, baseDir = dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = fullPath.replace(baseDir + '/', '')
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some(excluded => relativePath.includes(excluded))) continue
      await getAllFiles(fullPath, baseDir, files)
    } else {
      if (EXCLUDE_FILES.includes(entry.name)) continue
      const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase()
      if (EXCLUDE_EXTENSIONS.includes(ext)) continue
      if (entry.name.startsWith('.') && !['.gitignore', '.env.example'].includes(entry.name)) continue
      files.push(relativePath)
    }
  }
  return files
}

export async function GET() {
  try {
    const appDir = process.cwd()
    const filePaths = await getAllFiles(appDir, appDir)
    const files = []
    for (const filePath of filePaths) {
      try {
        const fullPath = join(appDir, filePath)
        const content = await readFile(fullPath, 'utf-8')
        files.push({ path: filePath, content })
      } catch (err) { console.log(`Skipping ${filePath}: ${err.message}`) }
    }
    return NextResponse.json({ success: true, totalFiles: files.length, files, timestamp: new Date().toISOString(), message: 'All source files exported successfully' })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
