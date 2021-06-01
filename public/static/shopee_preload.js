const { ipcRenderer } = require('electron');
const crypto = require('crypto');

// window.addEventListener('contextmenu', function (e) {
//   console.log('ssssss')
//   ipcRenderer.send('CONTEXT_MENU')
//   // 要阻止默认鼠标右键的事件，然后处理自身的逻辑
//   e.preventDefault();
//   // menu.popup(remote.getCurrentWindow());
// }, false)


// 触发方法
function trigger(elem, event) {
  if (document.all) {
    elem.fireEvent('on' + event);
  } else {
    var evt = document.createEvent('Events');
    evt.initEvent(event, true, true);
    elem.dispatchEvent(evt);
  }
}

// 密码解密
const iv = 'lzAHsaPPugxr4xH2';
const secret_key = 'O9IWKxrDnfWWuimCCxnwKxi0f1NWOaPA'


function decode(cryptkey, iv, secretdata) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', cryptkey, iv);
  let decoded = decipher.update(secretdata, 'base64', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
}

// 模拟登录
function doLogin(account){  
  setTimeout(()=>{
    let inputs = document.querySelectorAll('.shopee-input__input');
    let rememberCheckbox = document.querySelector('.shopee-checkbox');
    let loginBtn = document.querySelector('button.shopee-button');
    if(inputs.length && rememberCheckbox && loginBtn){
      let accountInput = inputs[0];
      let passwordInput = inputs[1];
      accountInput.value = account.shop_name;
      passwordInput.value = decode(secret_key, iv, account.password);

      trigger(accountInput, 'input');
      trigger(passwordInput, 'input');

      rememberCheckbox.click();
      loginBtn.click();
    }else{
      doLogin(account)
    }
  }, 1000)
}

ipcRenderer.on('DOM_READY', (event, account) => {
  if(location.pathname === '/account/signin'){
    doLogin(account)
  }
})