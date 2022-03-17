<template>
  <div class="leo_drawer">
    <div class="player no_select">
      <div class="player__header">
        <div class="player__img player__img--absolute slider">
          <button class="player__button player__button--absolute--nw playlist" @click="transformPlayer">
            <img src="./assets/images/playlist.svg" alt="playlist-icon">
          </button>
          <button class="player__button player__button--absolute--center play" @click="playOrPause">
            <img v-if="isPlay" src="./assets/images/pause.svg" alt="pause-icon">
            <img v-else src="./assets/images/play.svg" alt="play-icon">
          </button>
          <div class="slider__content" style="transform: translate3d(0%, 0px, 0px);">
            <img v-for="(item, index) in songs" v-bind:key="index" class="img slider__img" :src="item.cover" alt="cover">
          </div>
        </div>
        <div class="tool_bar">
          <img v-if="lrcShow" class="lrc_btn show" src="./assets/images/lyric.svg" alt="" @click="showLyric">
          <img v-else class="lrc_btn" src="./assets/images/lyric.svg" alt="" @click="showLyric">
          <div class="speaker">
            <img class="s" src="./assets/images/speaker.svg" alt="speaker">
            <div class="tp">
              <div class="tp_filled" :style="volume"></div>
            </div>
          </div>
        </div>
        <div class="player__controls">
          <button class="player__button back" @click="prev">
            <img class="img" src="./assets/images/back.svg" alt="back-icon">
          </button>
          <p class="player__context slider__context" @click="transformPlayer">
            <strong class="slider__name">{{ songs[current]&&songs[current].name }}</strong>
            <span class="player__title slider__title">{{ songs[current]&&songs[current].singer }}</span>
          </p>
          <button class="player__button next" @click="next">
            <img class="img" src="./assets/images/next.svg" alt="next-icon">
          </button>
          <div class="progress show" v-if="lrcShow">
            <div class="progress__filled"></div>
            <div class="lrc">{{ this.current_l }}</div>
          </div>
          <div class="progress" v-else>
            <div class="progress__filled"></div>
          </div>
        </div>
        <img v-if="loading" class="loading" src="./assets/images/loading.svg" alt="loading">
      </div>
      <ul class="player__playlist list">
        <li class="player__song" v-for="(item, index) in songs" v-bind:key="index" @click="selectSong(item, index)">
          <img class="player__img img" :src="item.cover" alt="cover">
          <p class="player__context">
            <b class="player__song-name">{{item.name}}</b>
            <span class="flex">
                <span class="player__title">{{item.singer}}</span>
                <span class="player__song-time"><span v-if="index === current">{{progress_time}}/</span>{{item.duration}}</span>
              </span>
          </p>
        </li>
        <audio class="audio" id="audio" src=""></audio>
        <div style="height: 124px"></div>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "LeoPlayer",
  props: {
    radar: {
      type: String,
      default() {
        return './assets/images/player.png'
      }
    },
    songs: {
      type: Array,
      default() {
        return [];
      }
    },
    bgColor: {
      type: Array,
      default() {
        return ["#f8ded3", "#ffc382", "#f5eda6", "#ffcbdc", "#dcf3f3"]
      }
    }
  },
  mounted() {
    this.init()
  },
  data() {
    return {
      loading: false,
      isPlay: false,
      lrcShow: true,
      lrcArr: [],
      volume:  { width: '100%'},
      current: 0,
      current_time: 0,
      current_l: '',
      progress_time: '00:00',
      drawer: false,
      t1: null,
      sliderWidth: 100,
      status: 1,
      isMove: false,
      tuning: false,
    }
  },
  methods: {
    // 切换播放器形态
    transformPlayer() {
      const playerHeader = document.querySelector(".player__header");
      const playerControls = document.querySelector(".player__controls");
      const slider = document.querySelector(".slider");
      const sliderContext = document.querySelector(".slider__context");
      sliderContext.addEventListener("animationend", () => sliderContext.style.animationName ='');
      if (this.status === 1) {
        playerHeader.classList.add("open-header");
        playerControls.classList.add("move");
        slider.classList.add("open-slider");
        this.status = 2
      } else {
        playerHeader.classList.remove("open-header");
        playerControls.classList.remove("move");
        slider.classList.remove("open-slider");
        this.status = 1
      }
    },

    init() {
      this.changeBg(0);
      const recover = JSON.parse(localStorage.getItem('s'))
      if (recover) {
        this.isPlay = true
        this.lrcShow = recover.lrcShow
        this.volume = recover.volume
        this.selectSong(this.songs[recover.current], recover.current, recover.cur, recover.volume)
      } else {
        this.selectSong(this.songs[0], 0)
      }
      this.initProgressBar()
    },
    // 播放器容器背景颜色切换
    changeBg(target) {
      const player_container = document.querySelector('.leo_drawer');
      player_container.style.backgroundColor = this.bgColor[target];
    },
    // 处理头部图片切换
    changeHeaderImg(target) {
      if (target === this.current) return
      const sliderContent = document.querySelector(".slider__content");
      let offset = -target*this.sliderWidth;
      sliderContent.style.transform = `translate3d(${offset}%, 0, 0)`;
    },

    /**
     * 公共方法 1. 初始化 2. 点选列表 3. 上一曲下一曲
     * @param item
     * @param index
     * @param cur
     * @param v
     */
    selectSong(item, index, cur, v) {
      console.log("歌曲加载中...")
      // 1. 处理播放器歌曲切换状态(头图、容器背景色)
      this.changeHeaderImg(index)
      this.changeBg(index)

      this.current = index
      // 2. 处理歌词
      if (this.songs[this.current].lyric) {
        this.lrcArr = this.reverseLrcArr(this.songs[this.current].lyric || '')
      } else {
        this.current_l = '暂无歌词'
        this.lrcArr = []
      }
      // 3. 监听歌曲事件
      let th = this
      const song = document.getElementById('audio')
      song.setAttribute('src', item.url)
      song.addEventListener("timeupdate" , this.progressUpdate);
      song.addEventListener("play", function () {
        th.isPlay = true
      })
      song.addEventListener("pause", function () {
        th.isPlay = false
      })
      song.addEventListener("waiting", function () {
        th.loading = true
      })
      song.addEventListener("playing", function () {
        th.loading = false
      })
      if (cur) song.currentTime = cur+0.4
      if (v) {
        song.volume = v.width.split('%')[0]/100
      }
      if (this.isPlay) {
        song.play()
        this.updateTime()
      }
    },

    progressUpdate() {
      const song = document.getElementById('audio')
      const progressFilled = document.querySelector(".progress__filled");
      progressFilled.style.width = (song.currentTime / song.duration) * 100 + "%";
      this.current_time = song.currentTime

      // 处理播放下一曲逻辑
      if (this.isPlay && song.duration === song.currentTime) {
        this.next();
      }
      // 最后一首播放完暂停
      if (this.current === (this.songs.length-1) && song.currentTime === song.duration) {
        this.isPlay = false;
      }
      // 处理播放歌词
      if (this.lrcShow && this.lrcArr.length) {
        let cl = this.lrcArr.find(item => item.time < this.current_time) || { words: ''}
        this.current_l = cl.words
      }
    },

    playOrPause() {
      const song = document.getElementById('audio')
      if (this.isPlay) {
        song.pause()
        this.isPlay = false
        localStorage.removeItem('s');
        clearInterval(this.t1)
      } else {
        song.play()
        this.isPlay = true
        this.updateTime()
      }
    },
    next() {
      if (this.current === (this.songs.length-1)) return
      this.selectSong(this.songs[this.current+1], this.current+1)
    },
    prev() {
      if (this.current === 0) return
      this.selectSong(this.songs[this.current-1], this.current-1)
    },

    // 初始化进度条、音量条
    initProgressBar() {
      const progress = document.querySelector(".progress");
      const voice = document.querySelector(".tp");
      const song = document.getElementById('audio');
      let th = this;
      function scrub(e) {
        // If we use e.offsetX, we have trouble setting the song time, when the mousemove is running
        const currentTime = ( (e.clientX - progress.getBoundingClientRect().left) / progress.offsetWidth ) * song.duration;
        song.currentTime = currentTime;
      }
      function tuning(e) {
        let val = ((e.clientX - voice.getBoundingClientRect().left) / voice.offsetWidth)
        if (val > 1) val = 1
        if (val < 0) val = 0
        song.volume = val
        th.volume = { width: `${val*100}%`}
      }
      progress.addEventListener("pointerdown", (e) => {
        scrub(e);
        this.isMove = true;
      });
      voice.addEventListener("pointerdown", (e) => {
        tuning(e);
        this.tuning = true;
      })

      document.addEventListener("pointermove", (e) => {
        if (this.isMove) {
          scrub(e);
          song.muted = true;
        }
        if (this.tuning) {
          tuning(e)
        }
      });

      document.addEventListener("pointerup", () => {
        this.isMove = false;
        song.muted = false;
        this.tuning = false;
      });
    },

    // 歌词展示控制
    showLyric() {
      if (this.lrcShow) {
        this.lrcShow = false
      } else {
        this.lrcShow = true
        this.lrcArr = this.reverseLrcArr(this.songs[this.current].lyric || '')
      }
    },

    // 更新当前播放歌曲的播放时间
    updateTime() {
      this.t1 = setInterval(() => {
        this.progress_time = this.formatTime(Math.round(this.current_time))
      }, 1000)
    },

    reverseLrcArr(lrcStr = '') {
      let parts = lrcStr.split("\n");
      for(let i = 0; i < parts.length; i ++) {
        parts[i] = getLrcObj(parts[i]);
      }
      return parts.reverse();

      function getLrcObj(content) {
        let twoParts = content.split("]");
        let time = twoParts[0].substr(1);
        let timeParts = time.split(":");
        let minute = +timeParts[0];
        let seconds = +timeParts[1];
        time = minute * 60 + seconds;
        let words = twoParts[1];

        return {
          time: time,
          words: words,
        };
      }
    },
    formatTime(t) {
      let mm = parseInt(t / 60);
      if(mm<10) mm = "0" + mm;
      let ss = parseInt((t - mm * 60) % 60);
      if(ss<10) ss = "0" + ss;
      const length = mm + ":" + ss;
      if(t>0){
        return length;
      }else{
        return "00:00";
      }
    },
  }
}
</script>

<style scoped>
.list {
  margin: 0 ;
  padding: 0 ;
  list-style-type: none ;
}
.player {
  width: 17.15em ;
  overflow: hidden ;
  font-size: 1.22em ;
  border-radius: 1.35em ;
  background-color: white ;
  height: 20em;
  margin: 15% auto;
}
.player__header {
  z-index: 1 ;
  gap: 0 .4em ;
  width: 100% ;
  display: flex;
  height: 5.85em ;
  flex-shrink: 0 ;
  position: relative;
  align-items: flex-start ;
  border-radius: inherit ;
  justify-content: flex-end ;
  background-color: white  ;
  padding: .95em 0.6em 0 1.2em ;
  box-shadow: 0 2px 6px 1px #0000001f ;
  transition: height 1s cubic-bezier(0.71, 0.21, 0.3, 0.95), box-shadow 1s, padding 1s ease-in-out ;
  box-sizing: border-box;
}
.player__header.open-header {
  height: 100% ;
  padding-left: 0 ;
  padding-right: 0 ;
  box-shadow: unset ;
}
.player__header .loading {
  position: absolute;
  bottom: 5px;
  right: 15px;
  color: #827d7b;
  animation: _loading 1.5s infinite;
}
.player__img {
  width: 3.22em !important;
  height: 3.22em ;
  border-radius: 1.32em ;
}
.player__header.open-header .player__img {
  width: 100%!important;
}
.player__img--absolute {
  top: 1.4em ;
  left: 1.2em ;
  position: absolute ;
}
.slider {
  flex-shrink: 0 ;
  overflow: hidden ;
  transition: all 1s cubic-bezier(0.71, 0.21, 0.3, 0.95);
}
.slider.open-slider{
  top: 0 ;
  left: 0 ;
  width: 100% ;
  height: 14.6em ;
}
.slider__content {
  height: 100% ;
  will-change : transform ;
  /*transition: transform var(--cubic-slider);*/
  transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  word-spacing: -6px;
}
.slider__img {
  filter: brightness(75%) ;
  width: 100%!important;
  height: 100%;
}
.slider__name,
.slider__title {
  overflow: hidden ;
  white-space: nowrap ;
}
.player__button {
  all: unset ;
  z-index: 100 ;
  width: 2.5em ;
  height: 2.5em ;
  cursor: pointer ;
}
.player__button img {
  width: 100%!important;
}
.playlist {
  transform: scale(0) ;
  transition: transform .5s;
}
.slider.open-slider .playlist {
  transform: scale(1) ;
  transition: transform .35s 1s cubic-bezier(0, 0.85, 0.11, 1.64) ;
}
.player__button--absolute--nw {
  top: 5.5% ;
  left: 5.5% ;
  position: absolute ;
}
.player__button--absolute--center {
  top: 0 ;
  left: 0 ;
  right: 0 ;
  bottom: 0 ;
  margin: auto ;
  position: absolute ;
}
.player__controls {
  width: 77% ;
  gap: .5em 0 ;
  display: flex ;
  flex-wrap: wrap ;
  align-items: center ;
  will-change: contents ;
  align-content: center ;
  justify-content: center ;
  transition: all 1s cubic-bezier(0.71, 0.21, 0.3, 0.95);
}
.player__controls.move {
  width: 88% ;
  transform: translate3d(-.6em , calc(20em - 153%) , 0) ;
}
.player__context {
  margin: 0 ;
  width: 100% ;
  display: flex ;
  line-height: 1.8 ;
  flex-direction: column ;
  justify-content: center ;
  text-transform: capitalize ;
}
.slider__context {
  width: 56.28% ;
  cursor: pointer ;
  text-align: center ;
  padding-bottom: .2em ;
  will-change: contents ;
  transition: width 1s cubic-bezier(0.71, 0.21, 0.3, 0.95);
  animation: 1s cubic-bezier(1, -0.01, 1, 1.01);
}
.player__controls.move .slider__context{
  width: 49.48% ;
}
.player__title {
  font-size: .7em ;
  font-weight: bold ;
  color: #00000086 ;
}
.progress {
  width: 82% ;
  height: .25em ;
  cursor: pointer ;
  border-radius: 1em ;
  touch-action : none ;
  background-color: #e5e7ea ;
  transition: all 1s cubic-bezier(0.71, 0.21, 0.3, 0.95) ;
  position: relative;
}
.progress.show {
  /*top: -12px;*/
  transform: translateY(-12px);
}
.player__controls.move .progress{
  width: 90% ;
}
.progress__filled {
  width: 0% ;
  height: 100% ;
  display: flex ;
  position: relative ;
  align-items: center ;
  border-radius: inherit ;
  background-color: #78adfe ;
}
.progress__filled::before {
  right: 0 ;
  width: .35em ;
  content: " " ;
  height: .35em ;
  border-radius: 50% ;
  position: absolute ;
  background-color: #5781bd ;
}
.player__playlist {
  height: 100% ;
  overflow: auto ;
  padding: 1.05em .9em 0 1.2em ;
}
.player__playlist::-webkit-scrollbar {
  width: 0 ;
}
.player__song {
  /*     gap: 0 .65em ; */
  display: flex ;
  cursor: pointer ;
  margin-bottom: .5em ;
  padding-bottom: .7em ;
  border-bottom: .1em solid #d8d8d859 ;
}
.player__song .player__context {
  line-height: 1.5 ;
  margin-left: .65em ;
}
.player__song-name {
  font-size: .88em ;
  text-align: left;
}
.player__song-time {
  font-size: .65em ;
  font-weight: bold ;
  color: #00000079 ;
  height: fit-content ;
  align-self: flex-end ;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.audio {
  display: none !important ;
}

.leo_drawer {
  position: fixed;
  width: 100%;
  height: 100%;
  right: 0;
  top: 0;
  background-color: #fff;
  z-index: 10;
  transition: all .3s ease-in-out;
}
.lrc {
  position: relative;
  top: 7px;
  font-size: 12px;
  color: rgba(0,0,0,0.52549);
  text-align: center;
}
.open-header .tool_bar {
  display: none;
}
.tool_bar {
  position: absolute;
  left: 22px;
  bottom: 0;
  width: 100px;
  text-align: left;
}
.tool_bar img {
  cursor: pointer;
}
.lrc_btn {
  filter: brightness(.5);
}
.lrc_btn.show {
  filter: brightness(1);
}
.tool_bar .speaker {
  display: inline-block;
  filter: brightness(.5);
}
.tool_bar .tp {
  width: 0px;
  height: .2em ;
  cursor: pointer ;
  border-radius: 1em ;
  touch-action : none ;
  background-color: #e5e7ea ;
  transition: all 1s cubic-bezier(0.71, 0.21, 0.3, 0.95);
  display: inline-block;
  margin-bottom: 6px;
}
.tool_bar .tp_filled {
  background-color: #78adfe;
  height: 100%;
  border-radius: 1em ;
}
.tool_bar .speaker:hover{
  filter: brightness(1);
}
.tool_bar .speaker:hover .tp {
  width: 50px;
}
.no_select {
  user-select: none;
}

@keyframes text-wrap {
  75%{
    transform: translate3d(-51.5%, 0, 0) ;
  }
  100%{
    transform: translate3d(-51.5%, 0, 0) ;
  }
}
@keyframes opacity {
  0% {
    opacity: 0 ;
  }
  90%{
    opacity: 1 ;
  }
}
@keyframes _13ual7k {
  0% {
    transform: scale(.9);
    opacity: .5;
  }
  100% {
    transform: scale(3.5);
    opacity: 0;
  }
}
@keyframes _1mbhho {
  0% {
    transform: scale(1);
    opacity: .5;
  }
  100% {
    transform: scale(3.5);
    opacity: 0;
  }
}
@keyframes _loading  {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
