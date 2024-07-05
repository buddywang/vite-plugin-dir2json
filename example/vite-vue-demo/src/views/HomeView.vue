<script setup lang="ts">
import homeJson from "../assets/home?dir2json";
// When the directory names are the same, add `&1` to distinguish different types
import otherHomeJson from "../assets/test/home?dir2json&1";

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
</script>

<template>
  <main>
    <video
      autoplay
      muted
      :src="videoData.home1.home1"
      style="width: 100%"
    ></video>
  </main>
</template>
