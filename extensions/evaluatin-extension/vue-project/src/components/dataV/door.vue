<!--
 * @Date: 2022-03-11 14:49:29
 * @Description: 准备中的全屏组件
-->
<template>
  <div class="ju-sp" style="position: fixed; top: 0; left: 0; z-index: 9999">
    <transition
      mode="out-in"
      enter-active-class="animate__animated animate__bounceInLeft animate__faster"
      leave-active-class="animate__animated animate__bounceOutLeft "
    >
      <div v-if="visible" class="left-door">
        <div class="name">
          QUDOOR
          <dv-decoration-6 style="width: 300px; height: 30px" />
        </div>
      </div>
    </transition>
    <transition
      mode="out-in"
      enter-active-class="animate__animated animate__bounceInRight animate__faster"
      leave-active-class="animate__animated animate__bounceOutRight"
    >
      <div v-if="visible" class="right-door">
        <div class="center-icon">
          <dv-decoration-12
            style="width: 150px; height: 150px; background: rgb(0, 5, 28, 0.8); border-radius: 150px"
          />
          <div>准备中</div>
        </div>
        <div class="name">启科量子</div>
      </div>
    </transition>
  </div>
</template>
<script lang="ts" setup>
interface propsINF {
  visible: boolean
}
defineProps<propsINF>()
</script>
<style lang="less" scoped>
.name {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 0 10px cyan;
  text-align: center;
}
.center-icon {
  position: absolute;
  left: -75px;
  top: 40vh;
  z-index: 9999;
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 0, 0.2);
}
.one-door {
  width: 50vw;
  height: 100vh;
  background: rgb(0, 5, 28);

  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}
.left-door {
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 3px;
    background: rgb(124, 231, 253);
    height: 100vh;
    box-shadow: -10px 0px 30px 5px rgb(124, 231, 253, 0.5);
  }
  .one-door();
}
.right-door {
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    background: rgb(124, 231, 253);
    height: 100vh;
    box-shadow: 10px 0px 30px 5px rgb(124, 231, 253, 0.5);
  }
  .one-door();
}
</style>
