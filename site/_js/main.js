(function (doc, win) {
  "use strict";

  if (document.body.className.indexOf('homepage') !== -1) {
    (function() {

      var headerElement = document.querySelector('header');
      var zoomElement = document.querySelector('.zoom-out-intro');

      var oldOpacity = 1;

      var onScroll = function() {
        var newOpacity = Math.max(1 - (window.pageYOffset / 320), 0);

        if (newOpacity === oldOpacity)
          return;

        var newScale = (5 / 6) + (newOpacity / 6);

        headerElement.style.opacity = newOpacity;
        zoomElement.style.opacity = newOpacity;
        zoomElement.style.transition = 'none';
        zoomElement.style.transform = 'scale(' + newScale + ')';
        zoomElement.style.webkitTransform = 'scale(' + newScale + ')';

        oldOpacity = newOpacity;
      }

      window.addEventListener('scroll', onScroll, false);
    })();



    // Preloading & fading in David background
    (function() {
      var url = 'homepage/images/david-by-michelangelo.jpg';
      var image = new Image();
      image.src = url;
      image.onload = function() {
        document.querySelector('.david-by-michelangelo').className += ' loaded ';
      }
    })();

    // Mobile navigation
    (function() {
      var cheeseburger = document.querySelector('.cheeseburger');
      var navElement = document.querySelector('nav.top');
      var mobileNavElement = document.querySelector('.mobile-nav');
      var mobileNavigationIsExpanded = false;

      cheeseburger.addEventListener('click', function(e) {
        if (mobileNavigationIsExpanded) {
          navElement.className = navElement.className.replace(' expanded ', '');
          mobileNavElement.className = mobileNavElement.className.replace(' expanded ', '');
        } else {
          navElement.className += ' expanded ';
          mobileNavElement.className += ' expanded ';
        }
        mobileNavigationIsExpanded = !mobileNavigationIsExpanded;
      }, false);
    })();
  }

})(document, window);
