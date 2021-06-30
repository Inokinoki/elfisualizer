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
        return {
          elf: elf,
          size: elf_bytes.length,
          name: filename[0]
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
