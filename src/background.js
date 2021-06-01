'use strict'

import { 
  app, 
  protocol, 
  BrowserWindow, 
  Menu, 
  MenuItem, 
  ipcMain, 
  session 
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import path from 'path';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])



let win;
async function createWindow() {
  // Create the browser window.
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    titleBarStyle: 'hidden',
    icon: path.join(__static, 'favicon.png'),
    frame: false,
    webPreferences: {
      // preload: path.join(__static, 'preload.js'),
      // preload: path.join(process.cwd(), '/static/preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webviewTag: true
    }
  })

  // if (process.env.WEBPACK_DEV_SERVER_URL) {
  //   // Load the url of the dev server if in development mode
  //   await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
  //   if (!process.env.IS_TEST) win.webContents.openDevTools()
  // } else {
  //   createProtocol('app')
  //   // Load the index.html when not in development
  //   win.loadURL('app://./index.html')
  // }

  if(process.env.NODE_ENV === 'development'){
    // win.loadFile(path.join(__static, '/home.html'))
    // win.loadURL('http://localhost:8088/')
    win.loadURL('http://localhost:8080/')
    // win.loadURL('http://172.168.20.14:6002/')
    win.webContents.openDevTools()
  }else{
    // win.loadURL('http://172.168.20.14:6002/')
    // win.loadURL('http://shopee.erp.idealhere.com/')
    // win.webContents.openDevTools()
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  win.maximize()
  win.once('ready-to-show', () => {
    win.show()
  })  
  win.on('maximize', () => {
    win.webContents.send('CHANGE_WIN', win.isMaximized())
  })
  win.on('unmaximize', () => {
    win.webContents.send('CHANGE_WIN', win.isMaximized())
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS)
  //   } catch (e) {
  //     console.error('Vue Devtools failed to install:', e.toString())
  //   }
  // }

  try {
    if (isDevelopment) {
      // 使用本地插件
      // const vueDevToolsPath = `C:\\Users\\asus\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\nhdogjmejiglipccpnnnanhbledajbpd\\5.3.3_0`;
      // BrowserWindow.addDevToolsExtension(vueDevToolsPath);
      const vueDevToolsPath = `C:\\Users\\admin\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\nhdogjmejiglipccpnnnanhbledajbpd\\5.3.4_0`;
      const ext = await session.defaultSession.loadExtension(vueDevToolsPath)
      await installExtension(ext)
      // console.log(`Added Extension:  ${installedExt.name}`);
    }
  } catch (err) {}

  createWindow()
})

// 打开 shopee 根据 url 打开不同页面
function createShopeeWindow(account, url){
  const WINDOW_WIDHT = 1440;
  const WINDOW_HEIGHT = 900;
  const MIN_WINDOW_WIDHT = 1369;
  const MIN_WINDOW_HEIGHT = 700;
  const sessionName =  `persist:broswermjb_app_${account.id}`
  // const url = `https://seller.${account.site}.shopee.cn/`;

  Menu.setApplicationMenu(null)
  const win = new BrowserWindow({
    minWidth: MIN_WINDOW_WIDHT,
    minHeight: MIN_WINDOW_HEIGHT,
    width: WINDOW_WIDHT,
    height: WINDOW_HEIGHT,
    // show: false,
    icon: path.join(__static, '/static/favicon.png'),
    // preload: path.join(process.cwd(), '/static/favicon.png'),
    webPreferences: {
      preload: path.join(__static, '/static/shopee_preload.js'),
      // preload: path.join(process.cwd(), '/static/shopee_preload.js'),
      partition: sessionName,
    }
  })
  const ses = session.fromPartition(sessionName);

  if(account.cookies === null){
    ses.clearStorageData({
      origin: url,
      storages: ['cookies']
    })
  }else{
    for(let [name, value] of Object.entries(account.cookies)){
      ses.cookies.set({
        url,
        name,
        value
      })    
    }
  }
  win.loadURL(url)
  if(process.env.NODE_ENV === 'development'){
    win.webContents.openDevTools()
  }
  // win.once('ready-to-show', () => {
  //   win.show()    
  // })
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('DOM_READY', account);
  })  
  win.on('close', () => {
    win.destroy()
  })
}

ipcMain.on('SHOW_SHOPEE', function(event, account, url){
  createShopeeWindow(account, url)
})



// // 定制右键菜单
// const menu = new Menu();
// menu.append(
//   new MenuItem({ 
//     label: 'MenuItem1',
//     click: function() { 
//       console.log('item 1 clicked'); 
//     } 
//   })
// );

// // 分割线
// menu.append(
//   new MenuItem({ 
//     type: 'separator' 
//   })
// );

// // 多选，是被选中的状态
// menu.append(
//   new MenuItem({ 
//     label: 'MenuItem2', 
//     type: 'checkbox', 
//     checked: true 
//   })
// );

// ipcMain.on('CONTEXT_MENU', function(event, account, url){
//   menu.popup(event.sender);
// })

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('OPEN_NEW_TAB', (event, params) => {
  win.webContents.send('ADD_TAB', params)
})

ipcMain.on("WIN_MIN", () => {
  win.minimize();
})

ipcMain.on('WIN_MAX', () => {
  win.maximize();
})

ipcMain.on('WIN_CLOSE', () => {
  win.close();
})

ipcMain.on('WIN_UNMAX', () => {
  win.unmaximize();
})

ipcMain.handle('WIN_IS_MAX', () => {
  return win.isMaximized();
})