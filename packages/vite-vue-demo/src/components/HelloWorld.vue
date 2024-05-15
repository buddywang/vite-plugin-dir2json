<script setup lang="ts">
import { ref } from "vue";
import homeJson from "../assets/home?dir2json";
// When the directory names are the same, add `&1` to distinguish different types
import otherHomeJson from "../assets/test/home?dir2json&1";

defineProps<{ msg: string }>();

const isMobile = () => {
  let userAgentInfo = navigator.userAgent;
  let Agents = [
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod",
  ];
  let getArr = Agents.filter((i) => userAgentInfo.includes(i));
  return getArr.length ? true : false;
};

const videoData = isMobile() ? homeJson.h5 : homeJson.pc;

const count = ref(0);
</script>

<template>
  <video
    autoplay
    muted
    :src="videoData.home1.home1"
    style="width: 100%"
  ></video>

  <h1>{{ msg }}</h1>
  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
