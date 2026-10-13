/**
 * Composables - 可复用函数
 */

// useHome - 首页背景和交互功能
const useHome = () => {
  const menuColor = Vue.ref(true);
  const homeBackground = Vue.ref(null);

  const initHomeBackground = () => {
    if (!homeBackground.value) return;
    
    const images = homeBackground.value.dataset.images.split(",");
    const id = Math.floor(Math.random() * images.length);
    homeBackground.value.style.backgroundImage = `url('${images[id]}')`;
  };

  const homeClick = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  Vue.onMounted(() => {
    initHomeBackground();
  });

  return {
    menuColor,
    homeBackground,
    homeClick
  };
};

// useSearch - 搜索功能
const useSearch = () => {
  const rawSearch = Vue.ref("");
  const timeline = Vue.ref(null);

  const search = Vue.computed(() => {
    return rawSearch.value.toLowerCase().replace(/\s+/g, "");
  });

  Vue.watch(search, (value) => {
    if (!timeline.value) return;
    
    const timelineNodes = timeline.value.childNodes;
    for (let i of timelineNodes) {
      if (!value || i.dataset.title.includes(value)) {
        i.style.opacity = 1;
        i.style.visibility = "visible";
        i.style.marginTop = 0;
      } else {
        i.style.opacity = 0;
        i.style.visibility = "hidden";
        i.style.marginTop = -i.offsetHeight - 30 + "px";
      }
    }
  });

  return {
    rawSearch,
    timeline
  };
};

// usePreview - 图片预览功能
const usePreview = () => {
  const previewShow = Vue.ref(false);
  const preview = Vue.ref(null);
  const previewContent = Vue.ref(null);

  const initPreview = () => {
    const images = document.querySelectorAll("img");
    for (let i of images) {
      i.addEventListener("click", () => {
        if (previewContent.value) {
          previewContent.value.alt = i.alt;
          previewContent.value.src = i.src;
        }
        previewShow.value = true;
      });
    }

    if (preview.value) {
      preview.value.addEventListener("click", () => {
        previewShow.value = false;
      });
    }

    window.addEventListener("resize", () => {
      previewShow.value = false;
    });
  };

  return {
    previewShow,
    preview,
    previewContent,
    initPreview
  };
};

// useMath - 数学公式渲染功能
const useMath = () => {
  const renderMath = () => {
    if (typeof renderMathInElement === 'undefined') return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
    });
  };

  return {
    renderMath
  };
};

// useCrypto - 文章加密功能
const useCrypto = () => {
  const crypto = Vue.ref("");
  const cryptoStatus = Vue.ref("");
  const cryptoInput = Vue.ref(null);
  const content = Vue.ref(null);

  Vue.watch(crypto, (value) => {
    if (!cryptoInput.value || !content.value) return;
    if (typeof CryptoJS === 'undefined') return;
    
    const { encrypted, shasum } = cryptoInput.value.dataset;
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, value).toString(CryptoJS.enc.Utf8);
      if (CryptoJS.SHA256(decrypted).toString() === shasum) {
        cryptoStatus.value = "success";
        content.value.innerHTML = decrypted;
      } else {
        cryptoStatus.value = "failure";
      }
    } catch {
      cryptoStatus.value = "failure";
    }
  });

  return {
    crypto,
    cryptoStatus,
    cryptoInput,
    content
  };
};

// 代码高亮由 Hexo 原生 syntax_highlighter(PrismJS) 负责；
// 主题自定义的 hljs 高亮模块已移除（此前提及的 useHighlight 为永不执行的死代码）。

/**
 * 主应用入口
 * 使用 Vue 3 Composition API 构建交互式界面
 */
const app = Vue.createApp({
  setup() {
    const loading = Vue.ref(true);
    const hiddenMenu = Vue.ref(false);
    const showMenuItems = Vue.ref(false);
    const menuColor = Vue.ref(false);
    const scrollTopValue = Vue.ref(0);
    const scrollPercent = Vue.ref(0);
    const ticking = Vue.ref(false);
    const lastScrollTime = Vue.ref(0);
    const scrollThreshold = Vue.ref(22);
    const renderers = Vue.ref([]);
    const homePostsWrap = Vue.ref(null);

    const { menuColor: homeMenuColor, homeBackground, homeClick } = useHome();
    const { rawSearch, timeline } = useSearch();
    const { previewShow, preview, previewContent, initPreview } = usePreview();
    const { renderMath } = useMath();
    const { crypto, cryptoStatus, cryptoInput, content } = useCrypto();

    const render = () => {
      renderers.value.forEach(renderer => {
        if (typeof renderer === 'function') {
          renderer();
        }
      });
    };

    const getScrollPercent = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollableHeight = scrollHeight - windowHeight;
      
      if (scrollableHeight <= 0) return 0;
      
      return Math.min(Math.max((scrollTop / scrollableHeight) * 100, 0), 100);
    };

    const handleScroll = () => {
      if (!ticking.value) {
        ticking.value = true;
        requestAnimationFrame(() => {
          updateScrollState();
          ticking.value = false;
        });
      }
    };

    const updateScrollState = () => {
      const newScrollTop = document.documentElement.scrollTop;
      
      scrollPercent.value = getScrollPercent();
      handleMenuVisibility(newScrollTop);
      handleMenuColor(newScrollTop);
      handleHomePostsPosition(newScrollTop);
      scrollTopValue.value = newScrollTop;
    };

    const handleMenuVisibility = (scrollTop) => {
      if (scrollTop > scrollTopValue.value) {
        hiddenMenu.value = true;
        showMenuItems.value = false;
      } else {
        hiddenMenu.value = false;
      }
    };

    const handleMenuColor = (scrollTop) => {
      if (homePostsWrap.value) {
        menuColor.value = scrollTop <= window.innerHeight - 100;
      }
    };

    const handleHomePostsPosition = (scrollTop) => {
      if (homePostsWrap.value) {
        if (scrollTop <= 400) {
          homePostsWrap.value.style.top = `-${scrollTop / 5}px`;
        } else {
          homePostsWrap.value.style.top = "-80px";
        }
      }
    };

    const scrollToTop = () => {
      window.scrollTo({ 
        top: 0, 
        behavior: "smooth" 
      });
    };

    const toggleMobileMenu = () => {
      showMenuItems.value = !showMenuItems.value;
    };

    const hideMobileMenu = () => {
      showMenuItems.value = false;
    };

    Vue.onMounted(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
      
      window.addEventListener("load", () => {
        loading.value = false;
        handleScroll();
        
        if (typeof renderMathInElement !== 'undefined') {
          renderers.value.push(renderMath);
        }
        
        renderers.value.push(initPreview);
        
        render();
      });
    });

    Vue.onBeforeUnmount(() => {
      window.removeEventListener("scroll", handleScroll);
    });

    return {
      loading,
      hiddenMenu,
      showMenuItems,
      menuColor,
      scrollTopValue,
      scrollPercent,
      homePostsWrap,
      homeBackground,
      homeClick,
      rawSearch,
      timeline,
      previewShow,
      preview,
      previewContent,
      crypto,
      cryptoStatus,
      cryptoInput,
      content,
      scrollToTop,
      toggleMobileMenu,
      hideMobileMenu
    };
  }
});

app.mount("#layout");
