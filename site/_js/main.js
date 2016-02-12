(function (doc, win) {
  "use strict";

  // here is a block of scripts that's only useful on the homepage.
  if (document.body.className.indexOf('homepage') !== -1) {
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

    // Preloading & fading in David background
    var url = '/images/homepage/david-by-michelangelo.jpg';
    var image = new Image();
    image.src = url;
    image.onload = function() {
      document.querySelector('.david-by-michelangelo').className += ' loaded ';
    }

    // Mobile navigation
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

    // make the projects section clickable
    var dls = document.querySelectorAll('dl:not(.other)');

    for (var i = 0; i < dls.length; i++)
      dls[i].addEventListener('click', function(e) {
        e.preventDefault();
        window.open(this.querySelector('a').href);
      });

  } else {  // the hashChange thing only matters for "inner" pages.
            // we shall nudge inline links so the fixed header won't partially obscure them
    var hashChange = function () {
      if (window.location.hash == '#signup')
        new OrgSignupController();
      else if (window.location.hash != '#' && window.location.hash != '')
        if (document.getElementById(window.location.hash.substr(1)))
          setTimeout(function() {
            var doc = document.documentElement;
            var top = (window.pageYOffset || doc.scrollTop)-(doc.clientTop || 0);
            scrollTo(0, top-75);
          }, 10);
    }
    window.onhashchange = hashChange;
    hashChange();
  }

})(document, window);
