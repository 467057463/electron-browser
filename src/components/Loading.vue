<template lang="pug">
  .loading-wrapper
    .loading
      span
      span
      span
      span
      span
    .message {{message}}  
</template>


<script>
export default {
  props: {
    message: {
      type: String,
      default: '内容正在加载中...'
    }
  }
}
</script>

<style lang="scss">
.loading-wrapper{
  position: absolute;
  // z-index: 2;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  .message{
    margin-top: 40px;
  }
}
.loading{
  width: 80px;
  height: 40px;
  display: flex;
  justify-content: space-evenly;
}
.loading span{
  display: inline-block;
  width: 8px;
  height: 100%;
  border-radius: 4px;
  background: #e9d6f5;
  animation: load 1s ease infinite;
}
@keyframes load{
  0%,100%{
      height: 40px;
      background: #e9d6f5;
  }
  50%{
      height: 70px;
      margin: -15px 0;
      background: lightblue;
  }
}
.loading span:nth-child(2){
  animation-delay:0.2s;
}
.loading span:nth-child(3){
  animation-delay:0.4s;
}
.loading span:nth-child(4){
  animation-delay:0.6s;
}
.loading span:nth-child(5){
  animation-delay:0.8s;
}
</style>