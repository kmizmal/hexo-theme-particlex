document.addEventListener("DOMContentLoaded", () => {
    (function (w, d) {
      const progressBar = d.createElement('div');
      progressBar.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 0; 
        height: 3px; 
        box-shadow: 0 0 3px #999; 
        background: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet); 
        z-index: 999999; 
        transition: width 0.3s linear;
      `;
  
      d.body.appendChild(progressBar);
  
      const viewportHeight = w.innerHeight || d.documentElement.clientHeight || d.body.clientHeight;
  
      w.addEventListener('scroll', () => {
        const scrollableHeight = d.body.offsetHeight - viewportHeight;
        const scrollPercent = (scrollY / scrollableHeight) * 100;
        progressBar.style.width = Math.min(Math.max(scrollPercent, 0), 100) + '%';
      }, false);
    })(window, document);
  });
  