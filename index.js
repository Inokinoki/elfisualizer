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

app.whenReady().then(() => {
  createWindow()

  ipcMain.handle('load-file', (event, arg) => {
      const filename = dialog.showOpenDialogSync({ properties: ['openFile'] })
      if (filename && filename.length > 0) {
        // read the file into a buffer
        const elf_bytes = fs.readFileSync(filename[0])

        // parse the data
        const elf = elf_tools.parse(elf_bytes)
        // FIXME: Use real data
        // TODO: Use typescript
        return {
          elf: elf,
          elf_info: {
            size: elf_bytes.length,
            name: filename[0],
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
  })

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
