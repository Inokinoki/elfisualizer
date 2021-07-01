const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

const elf_tools = require('elf-tools')
const fs = require('fs');


function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.loadFile('elfisualizer.html')
  win.webContents.openDevTools()
}

let cached_elf_files = {}

function load_file(event, filename) {
  // Read the file into a buffer
  if (!cached_elf_files[filename].bytes) {
    cached_elf_files[filename].bytes = fs.readFileSync(filename)
  }
  // TODO: Add a watchdog on the file
  const elf_bytes = cached_elf_files[filename].bytes

  return elf_bytes;
}

function load_elf(event, filename) {
  if (cached_elf_files[filename]) {
    // Parse the data if not yet
    if (!cached_elf_files[filename].elf) {
      // Load the file if not yet
      if (!cached_elf_files[filename].bytes) {
        load_file(null, filename)
      }
      const elf_bytes = cached_elf_files[filename].bytes
      cached_elf_files[filename].elf = elf_tools.parse(elf_bytes)
    }
    const elf = cached_elf_files[filename].elf
    // FIXME: Use real data
    // TODO: Use typescript
    return {
      elf: elf,
      elf_info: {
        size: cached_elf_files[filename].bytes.length,
        name: filename,
        class: 0,
        encoding: 1,
        abi: 0,
        file_type: 0,
        arch: 0,
        entry_point: 64,
        program_header_info: {
          num: 5,
          size: 64,
          offset: 64
        },
        section_header_info: {
          num: 5,
          size: 64,
          offset: 64
        }
      }
    };
  }
  return null;
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.handle('open-file', (event, arg) => {
      const filename = dialog.showOpenDialogSync({ properties: ['openFile'] })
      if (filename && filename.length > 0) {
        cached_elf_files[filename[0]] = {}  // Make a cache entry
        return filename[0];
      }
  })
  ipcMain.handle('load-file', load_file)    // Load file content
  ipcMain.handle('elfhead-info', load_elf)  // Load basic information
  // ipcMain.handle('section-info', load_file)
  // ipcMain.handle('program-info', load_file)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
