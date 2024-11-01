$(document).ready(function () {
    const $preview = $("<div id='image-preview'></div>").appendTo("#main");
    const $img = $("<img>").appendTo($preview);

    let currentImgIndex = 0;
    let scale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let imgStartLeft = 0;
    let imgStartTop = 0;
    let dx = 0;
    let dy = 0;
    let animationFrameId = null;
    const images = [];

    // 初始化图片预览
    function initPreview(src, index) {
        $img.attr("src", src).on("error", () => alert("图片加载失败"));
        currentImgIndex = index;
        scale = 1;
        $img.css({
            transform: `scale(${scale})`,
            position: "absolute"
        });
        $preview.fadeIn(300);
        enableKeyboardShortcuts();
    }

    // 关闭图片预览
    function closePreview() {
        $preview.fadeOut(300);
        disableKeyboardShortcuts();
    }

    // 切换图片
    function switchImage(direction) {
        const total = images.length;
        if (total === 0) return;
        scale = 1;
        currentImgIndex = (currentImgIndex + direction + total) % total;
        const nextSrc = $(images[currentImgIndex]).attr("src");
        $img.attr("src", nextSrc);

        // 预加载相邻图片
        const preloadNext = $(images[(currentImgIndex + 1) % total]).attr("src");
        const preloadPrev = $(images[(currentImgIndex - 1 + total) % total]).attr("src");
        new Image().src = preloadNext;
        new Image().src = preloadPrev;
    }

    // 缩放图片
    let zoomTimeout;
    function zoomImage(delta) {
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
            scale = Math.max(0.1, Math.min(3, scale + delta));
            $img.css({
                transform: `scale(${scale})`
            });
        }, 50);
    }

    // 开始拖拽
    function startDrag(e) {
        if (e.pageX !== 0 && e.pageY !== 0) {
            isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
            imgStartLeft = parseFloat($img.css("left")) || 0;
            imgStartTop = parseFloat($img.css("top")) || 0;
            $img.css("cursor", "grabbing");

            $(document).on("mousemove", dragImage);
            $(document).on("mouseup", stopDrag);

            e.preventDefault();
        } else {
            closePreview();
        }
    }

    // 拖拽图片
    function dragImage(e) {
        if (!isDragging) return;
        dx = e.pageX - startX;
        dy = e.pageY - startY;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
                $img.css({
                    left: `${imgStartLeft + dx}px`,
                    top: `${imgStartTop + dy}px`,
                });
                animationFrameId = null;
            });
        }
    }

    // 停止拖拽
    function stopDrag() {
        isDragging = false;
        $img.css("cursor", "grab");

        $(document).off("mousemove", dragImage);
        $(document).off("mouseup", stopDrag);
    }

    // 启用键盘快捷键
    function enableKeyboardShortcuts() {
        $(document).on("keydown", handleKeydown);
    }

    // 禁用键盘快捷键
    function disableKeyboardShortcuts() {
        $(document).off("keydown", handleKeydown);
    }

    // 键盘事件处理
    function handleKeydown(e) {
        if ($preview.is(":visible")) {
            switch (e.key) {
                case "Escape":
                    closePreview();
                    break;
                case "ArrowLeft":
                case "ArrowUp":
                    switchImage(-1);
                    break;
                case "ArrowRight":
                case "ArrowDown":
                    switchImage(1);
                    break;
                case "+":
                    zoomImage(0.1);
                    break;
                case "-":
                    zoomImage(-0.1);
                    break;
                default:
                    break;
            }
        }
    }

    // 绑定缩略图点击事件
    const $contentImages = $(".content img:not(#image-preview img, .footer img)");
    $("div.content").on("click", "img:not(#image-preview img)", function (e) {
        e.stopPropagation();
        const index = $contentImages.index(this);
        images.splice(0, images.length, ...$contentImages);
        initPreview(this.src, index);
    });

    // 预览框交互
    $preview.on("click", function (e) {
        if (e.target === $img[0]) return;
        closePreview();
    });

    $(window).on("resize", closePreview);

    $preview.on("wheel", function (e) {
        e.preventDefault();
        const delta = e.originalEvent.deltaY > 0 ? -0.1 : 0.1;
        zoomImage(delta);
    });

    $preview.on("mousedown", startDrag);
});
