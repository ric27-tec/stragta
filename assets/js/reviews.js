

    (function(){
      const track  = document.getElementById('reviews-track');
      const dotsEl = document.getElementById('reviews-dots');
      const cards  = track.querySelectorAll('.rev-card');
      const total  = cards.length;

      // How many cards visible at once
      function visibleCount(){
        return window.innerWidth < 900 ? 1 : 3;
      }

      let current = 0;
      const maxIndex = () => total - visibleCount();

      // Build dots
      function buildDots(){
        dotsEl.innerHTML = '';
        const steps = maxIndex() + 1;
        for(let i = 0; i < steps; i++){
          const btn = document.createElement('button');
          btn.className = 'rev-dot' + (i === current ? ' active' : '');
          btn.setAttribute('aria-label', 'Review ' + (i+1));
          btn.addEventListener('click', () => goTo(i));
          dotsEl.appendChild(btn);
        }
      }

      function updateDots(){
        dotsEl.querySelectorAll('.rev-dot').forEach((d,i) => {
          d.classList.toggle('active', i === current);
        });
      }

      function goTo(idx){
        current = Math.max(0, Math.min(idx, maxIndex()));
        const cardW = cards[0].getBoundingClientRect().width;
        const gap   = 22; // matches 1.4rem gap
        track.style.transform = `translateX(-${current * (cardW + gap)}px)`;
        updateDots();
      }

      document.getElementById('rev-prev').addEventListener('click', () => goTo(current - 1));
      document.getElementById('rev-next').addEventListener('click', () => goTo(current + 1));

      // Touch/swipe support
      let touchStartX = 0;
      track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive:true});
      track.addEventListener('touchend',   e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if(Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
      }, {passive:true});

      // Auto-advance every 6 seconds
      let timer = setInterval(() => {
        goTo(current >= maxIndex() ? 0 : current + 1);
      }, 6000);
      track.addEventListener('mouseenter', () => clearInterval(timer));
      track.addEventListener('mouseleave', () => {
        timer = setInterval(() => {
          goTo(current >= maxIndex() ? 0 : current + 1);
        }, 6000);
      });

      buildDots();
      window.addEventListener('resize', () => { buildDots(); goTo(current); });
    })();