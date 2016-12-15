;
(function () {

    'use strict';

    // iPad and iPod detection	
    var isiPad = function () {
        return (navigator.platform.indexOf("iPad") != -1);
    };

    var isiPhone = function () {
        return (
            (navigator.platform.indexOf("iPhone") != -1) ||
            (navigator.platform.indexOf("iPod") != -1)
        );
    };

    // Carousel Feature Slide
    var owlCrouselFeatureSlide = function () {

        var owl = $('.owl-carousel');

        owl.on('initialized.owl.carousel change.owl.carousel', function (elem) {
            var current = elem.item.index;
            $(elem.target).find(".owl-item").eq(current).find(".to-animate").removeClass('fadeInUp animated');
            $(elem.target).find(".owl-item").eq(current).find(".to-animate-2").removeClass('fadeInUp animated');

        });
        owl.on('initialized.owl.carousel changed.owl.carousel', function (elem) {
            setTimeout(function () {
                var current = elem.item.index;
                $(elem.target).find(".owl-item").eq(current).find(".to-animate").addClass('fadeInUp animated');
            }, 700);
            setTimeout(function () {
                var current = elem.item.index;
                $(elem.target).find(".owl-item").eq(current).find(".to-animate-2").addClass('fadeInUp animated');
            }, 900);
        });
        owl.owlCarousel({
            items: 1,
            loop: true,
            margin: 0,
            responsiveClass: true,
            nav: true,
            dots: true,
            autoHeight: true,
            smartSpeed: 500,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            navText: [
		      "<i class='icon-arrow-left2 owl-direction'></i>",
		      "<i class='icon-arrow-right2 owl-direction'></i>"
	     	]
        });

    };



    // animate-box
    var contentWayPoint = function () {

        $('.animate-box').waypoint(function (direction) {

            if (direction === 'down' && !$(this).hasClass('animated')) {

                $(this.element).addClass('fadeInUp animated');

            }

        }, {
            offset: '75%'
        });

    };


    // Burger Menu
    var burgerMenu = function () {

        $('body').on('click', '.js-fh5co-nav-toggle', function (event) {

            if ($('#navbar').is(':visible')) {
                $(this).removeClass('active');
            } else {
                $(this).addClass('active');
            }

            event.preventDefault();

        });

    };



    // Page Nav
    var clickMenu = function () {

        $('a:not([class="external"])').click(function (event) {
            var section = $(this).data('nav-section'),
                navbar = $('#navbar');
            $('html, body').animate({
                scrollTop: $('[data-section="' + section + '"]').offset().top
            }, 500);

            if (navbar.is(':visible')) {
                navbar.removeClass('in');
                navbar.attr('aria-expanded', 'false');
                $('.js-fh5co-nav-toggle').removeClass('active');
            }

            event.preventDefault();
            return false;
        });

    };

    // Reflect scrolling in navigation
    var navActive = function (section) {

        var $el = $('#navbar > ul');
        $el.find('li').removeClass('active');
        $el.each(function () {
            $(this).find('a[data-nav-section="' + section + '"]').closest('li').addClass('active');
        });

    };
    var navigationSection = function () {

        var $section = $('div[data-section]');

        $section.waypoint(function (direction) {
            if (direction === 'down') {
                navActive($(this.element).data('section'));

            }
        }, {
            offset: '150px'
        });

        $section.waypoint(function (direction) {
            if (direction === 'up') {
                navActive($(this.element).data('section'));
            }
        }, {
            offset: function () {
                return -$(this.element).height() + 155;
            }
        });

    };


    // Window Scroll
    var windowScroll = function () {
        var lastScrollTop = 0;

        $(window).scroll(function (event) {

            var header = $('#fh5co-header'),
                scrlTop = $(this).scrollTop();

            if (scrlTop > 500 && scrlTop <= 2000) {
                header.addClass('navbar-fixed-top fh5co-animated slideInDown');
            } else if (scrlTop <= 500) {
                if (header.hasClass('navbar-fixed-top')) {
                    header.addClass('navbar-fixed-top fh5co-animated slideOutUp');
                    setTimeout(function () {
                        header.removeClass('navbar-fixed-top fh5co-animated slideInDown slideOutUp');
                    }, 100);
                }
            }

        });
    };

    // Animations

    // About Us
    var aboutAnimate = function () {

        if ($('#about-us').length > 0) {
            $('#about-us .to-animate').each(function (k) {

                var el = $(this);

                setTimeout(function () {
                    el.addClass('fadeInUp animated');
                }, k * 200, 'easeInOutExpo');

            });
        }

    };
    var aboutWayPoint = function () {

        if ($('#about-us').length > 0) {
            $('#about-us').waypoint(function (direction) {

                if (direction === 'down' && !$(this).hasClass('animated')) {


                    setTimeout(aboutAnimate, 200);


                    $(this.element).addClass('animated');

                }
            }, {
                offset: '95%'
            });
        }

    };

    // Team
    var teamAnimate = function () {

        if ($('#team').length > 0) {
            $('#team .to-animate').each(function (k) {

                var el = $(this);

                setTimeout(function () {
                    el.addClass('fadeInUp animated');
                }, k * 200, 'easeInOutExpo');

            });
        }

    };
    var teamWayPoint = function () {

        if ($('#team').length > 0) {
            $('#team').waypoint(function (direction) {

                if (direction === 'down' && !$(this).hasClass('animated')) {


                    setTimeout(teamAnimate, 200);


                    $(this.element).addClass('animated');

                }
            }, {
                offset: '95%'
            });
        }

    };

    // Events
    var eventAnimate = function () {

        if ($('#fh5co-our-events').length > 0) {
            $('#fh5co-our-events .to-animate').each(function (k) {

                var el = $(this);

                setTimeout(function () {
                    el.addClass('fadeInUp animated');
                }, k * 200, 'easeInOutExpo');

            });
        }

    };
    var eventWayPoint = function () {

        if ($('#fh5co-our-events').length > 0) {
            $('#fh5co-our-events').waypoint(function (direction) {

                if (direction === 'down' && !$(this).hasClass('animated')) {


                    setTimeout(eventAnimate, 200);


                    $(this.element).addClass('animated');

                }
            }, {
                offset: '95%'
            });
        }

    };

    // Pricing
    var pastAnimate = function () {

        if ($('#fh5co-past').length > 0) {
            $('#fh5co-past .to-animate').each(function (k) {

                var el = $(this);

                setTimeout(function () {
                    el.addClass('fadeInUp animated');
                }, k * 200, 'easeInOutExpo');

            });
        }

    };
    var pastWayPoint = function () {

        if ($('#fh5co-past').length > 0) {
            $('#fh5co-past').waypoint(function (direction) {

                setTimeout(function () {
                    $('.animate-past-1').addClass('animated fadeIn');
                }, 200);
                setTimeout(function () {
                    $('.animate-past-2').addClass('animated fadeIn');
                }, 300);
                setTimeout(pastAnimate, 700);


                $(this.element).addClass('animated');


            }, {
                offset: '95%'
            });
        }

    };

    // Contact
    var contactAnimate = function () {

        if ($('#fh5co-contact').length > 0) {
            $('#fh5co-contact .to-animate').each(function (k) {

                var el = $(this);

                setTimeout(function () {
                    el.addClass('fadeInUp animated');
                }, k * 200, 'easeInOutExpo');

            });
        }

    };
    var contactWayPoint = function () {

        if ($('#fh5co-contact').length > 0) {
            $('#fh5co-contact').waypoint(function (direction) {

                setTimeout(function () {
                    $('.animate-press-1').addClass('animated fadeIn');
                }, 200);
                setTimeout(function () {
                    $('.animate-press-2').addClass('animated fadeIn');
                }, 300);
                setTimeout(contactAnimate, 700);


                $(this.element).addClass('animated');


            }, {
                offset: '95%'
            });
        }

    };

    var thumbBox = function () {
        $(".fancybox-thumb").fancybox({
            prevEffect: 'fade',
            nextEffect: 'fade',
            helpers: {
                title: {
                    type: 'outside'
                },
                thumbs: {
                    width: 50,
                    height: 50
                }
            }
        });
    };

    var mediaBox = function () {
        $(".fancybox-media").fancybox({
            prevEffect: 'fade',
            nextEffect: 'fade',
            helpers: {
                title: {
                    type: 'outside'
                },
                media: {}
            }
        });
    };

    var els, i, len, title;
    var konamiCode = '38,38,40,40,37,39,37,39,66,65';
    var keyPresses = [];
    var checkKonami = function (e) {
        keyPresses.push(e.keyCode);
        if (keyPresses.slice(keyPresses.length - 10).join() === konamiCode) {
            runKonami();
        }
    };
    var runKonami = function () {
        els = document.querySelectorAll('h1, h2, a');
        for (i = 0, len = els.length; i < len; i++) {
            title = els[i].textContent || els[i].innerText;
            title = title.trim();
            els[i].innerHTML = title.split('').reverse().join('');
        }
    };

    // Document on load.
    $(function () {
        document.addEventListener('keyup', checkKonami);

        burgerMenu();
        owlCrouselFeatureSlide();
        clickMenu();
        windowScroll();
        navigationSection();
        thumbBox();
        mediaBox();

        aboutWayPoint();
        eventWayPoint();
        teamWayPoint();
        pastWayPoint();
        contactWayPoint();

    });

}());
