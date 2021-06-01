<template lang="pug">
  #app(
    :class="[winIsMax ? 'is-max' : 'un-max']"
  )
    //- chrome tabs
    .chrome-tabs
      .tabs-wraper
        .chrome-tabs-content
        .actions
          span(@click="winMin")
            svg-icon(iconClass="minus")          
          span(v-if="winIsMax" @click="winUnMax")
            svg-icon(iconClass="clone")
          span(v-else @click="winMax")
            svg-icon(iconClass="square")
          span.close(@click="winClose")
            svg-icon(iconClass="close")

      //- tab 底部那条线
      .chrome-tabs-bottom-bar
    //- electron tab
    .etabs-tabgroup(v-show="false")
      .etabs-tabs
      .etabs-buttons
    .etabs-views
      loading(v-show="isLoading")
    
    //- 右键菜单遮罩
    //- 用来解决点击无法关闭菜单
    .lucency(v-show="showLucency" @click.stop="showLucency = false")
</template>

<script>
import { ipcRenderer } from 'electron';
import path from 'path';
import TabGroup from 'electron-tabs';
import ChromeTabs from '@/lib/chrome-tabs';
import Loading from '@/components/Loading';
import logo from '@/assets/favicon.png';

let preloadPth = '';
if (process.env.NODE_ENV === 'development') {
  let rootDirectory = process.cwd();
  preloadPth =
    'file://' + path.join(rootDirectory, '/public/static/preload.js');
} else {
  preloadPth = `file://${__dirname}/static/preload.js`;
}


export default {
  name: 'App',
  
  components: {
    Loading
  },

  data(){
    return{
      isLoading: true,
      winIsMax: true,
      showLucency: false,
      preloadPth,
      tabGroup: null,
      chromeTabs: null,
    }
  },

  methods: {
    // 添加标签
    addTab(params){
      // electron-tabs 添加
      const tab = this.tabGroup.addTab({
        title: params.title,
        src: process.env.VUE_APP_HOST + params.href,
        active: true,
        webviewAttributes: {
          nodeintegration: true,
          enableremotemodule: true,
          plugins: true,
          allowpopups: true,
          preload: preloadPth
        },
        ready(tab){
          this.isLoading = true;
          let webview = tab.webview;
          webview.addEventListener('did-stop-loading', () => {   
            this.isLoading = false;
          })
          webview.addEventListener('page-title-updated', () => {
            const title = webview.getTitle();
            const selector = `.chrome-tab[data-id='${tab.id}'] .chrome-tab-title`
            const $title = document.querySelector(selector);
            tab.setTitle(title)
            $title.innerText = title; 
          })
          if (process.env.NODE_ENV === 'development'){
            webview.addEventListener('dom-ready', () => {
              webview.openDevTools()
            })
          }
        }
      });
      // chrome tabs 添加
      this.chromeTabs.addTab({
        title: params.title,
        favicon: logo
      }, {
        id: tab.id
      })
    },
    // 关闭标签
    removeTab(id){
      this.tabGroup.getTab(id).close()
    },
    // 点击标签
    activeTab(id){
      this.tabGroup.getTab(id).activate()
    },
    // 刷新标签
    refreshTab(id){
      this.tabGroup.getTab(id).webview.reload();
    },
    // 最小化
    winMin(){
      ipcRenderer.send('WIN_MIN')
    },
    // 最大化
    winMax(){
      ipcRenderer.send('WIN_MAX')
    },
    // 关闭
    winClose(){
      ipcRenderer.send('WIN_CLOSE')
    },
    // 缩放 
    winUnMax(){
      ipcRenderer.send('WIN_UNMAX')
    },
    // 显示标签右键菜单
    showContentMeni($tab, event){
      const hasNext = !!$tab.nextElementSibling;
      const hasOther = $tab.parentElement.childElementCount > 1
      this.$contextmenu({
        items: [
          {
            label: "刷新",
            divided: true,
            icon: "el-icon-refresh",
            onClick: () => {
              this.refreshTab(+$tab.dataset.id)
              this.showLucency = false;
            }
          },
          {
            label: "关闭",
            onClick: () => {
              this.chromeTabs.removeTab($tab)
              this.showLucency = false;
            },
            disabled: !hasOther
          },
          { 
            label: "关闭其他标签页", 
            onClick: () => {
              [...$tab.parentElement.children].forEach(item => {
                if(item != $tab){
                  setTimeout(() => {
                    this.chromeTabs.removeTab(item)
                  }, 300)
                }
              })
              this.showLucency = false;
            },
            disabled: !hasOther
          },
          { 
            label: "关闭右侧标签页", 
            onClick: () => {
              while($tab.nextElementSibling){
                this.chromeTabs.removeTab($tab.nextElementSibling)
              }
              this.showLucency = false;
            },
            disabled: !hasNext 
          },
        ],
        event,
        customClass: "tab-menu",
        zIndex: 9999,
        minWidth: 230
      })
      return false;
    }
  },

  async mounted(){
    const winIsMax = await ipcRenderer.invoke('WIN_IS_MAX')
    this.winIsMax = winIsMax;

    // chrome Tab
    const $tab = document.querySelector('.chrome-tabs')
    this.chromeTabs = new ChromeTabs()
    this.chromeTabs.init($tab)
    // 监听标签关闭
    $tab.addEventListener('tabRemove', ({ detail }) => {
      const id = detail.tabEl.dataset.id;
      this.removeTab(+id)
    })
    // 监听标签点击
    $tab.addEventListener('activeTabChange', ({ detail }) => {
      const id = detail.tabEl.dataset.id;
      this.activeTab(+id)
    })
    // 标签右键点击
    $tab.addEventListener('contextmenu', (event) => {
      let isTriggerTab = false;
      let $tab;
      for(let item of event.path){
        if(item.nodeType == 9){
          break;
        }
        if(item.classList.contains('chrome-tab')){
          isTriggerTab = true;
          $tab = item;
          break;
        }
        
      }
      if(!isTriggerTab){
        return false;
      }

      this.showLucency = true;
      this.showContentMeni($tab, event)
    })  

    // electron tab
    this.tabGroup = new TabGroup();
    // 打开登录页
    this.addTab({
      title: 'SHOPEE销售系统',
      href: '',
    })

    // 进程通信
    ipcRenderer.on('ADD_TAB', (event, params) => {
      this.addTab(params)
    })  

    ipcRenderer.on('CHANGE_WIN', (event, params) => {
      this.winIsMax = params;
    })
  }
}
</script>

<style lang='scss'> 
#app{
  &.is-max{
    .chrome-tabs{
      padding-top: 0;
      height: 38px;
    }
    .etabs-views{
      height: calc(100vh - 39px);
    }
  }
  &.un-max{
    .actions{
      transform: translateY(-8px);
    }
  }
}

.tabs-wraper{
  display: flex;
  height: 100%;
  -webkit-app-region: drag;
  .chrome-tabs-content{
    flex: 1 1 auto;
    .chrome-tab{
      -webkit-app-region: no-drag;
    }
  }
  .actions{
    width: 154px;
    margin-left: 80px;
    align-self: stretch;
    display: flex;
    padding-bottom: 4px;
    -webkit-app-region: no-drag;
    span{
      flex: 1 1 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: default;
      color: #000000;
    }
    span:hover{
      background: #c7cacf;
      color: #000;
    }
    span.close:hover{
      color: white;
      background: #e81123;
    }
  }
}
.lucency{
  z-index: 9998;
  background: transparent;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  -webkit-app-region: no-drag;
}
</style>
