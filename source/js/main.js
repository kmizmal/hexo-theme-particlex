const app = Vue.createApp({
  mixins: Object.values(mixins),
  data() {
    return {
      loading: true,
      hiddenMenu: false,
      showMenuItems: false,
      menuColor: false,
      scrollTopValue: 0,
      scrollPercent: 0, // 滚动百分比
      renderers: [],
    };
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll, true);
    window.addEventListener("load", () => {
      this.loading = false;
      this.handleScroll();
    });
    this.render();
  },
  methods: {
    render() {
      for (let i of this.renderers) i();
    },
    getScrollPercent() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      return (scrollTop / (scrollHeight - windowHeight)) * 100;
    },
    handleScroll() {
      const newScrollTop = document.documentElement.scrollTop;

      this.scrollPercent = this.getScrollPercent();
    //   console.log("scrollPercent:", this.scrollPercent);

      let wrap = this.$refs.homePostsWrap;
      if (this.scrollTopValue < newScrollTop) {
        this.hiddenMenu = true;
        this.showMenuItems = false;
      } else {
        this.hiddenMenu = false;
      }

      if (wrap) {
        if (newScrollTop <= window.innerHeight - 100) this.menuColor = true;
        else this.menuColor = false;
        if (newScrollTop <= 400) wrap.style.top = "-" + newScrollTop / 5 + "px";
        else wrap.style.top = "-80px";
      }

      this.scrollTopValue = newScrollTop;

    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
});
app.mount("#layout");