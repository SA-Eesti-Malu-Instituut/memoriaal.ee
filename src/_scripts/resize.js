$(function () {
    var doit;
    var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
    
    var windowResized = function () {
        // Special handling for IE11 and fixed-bottom
        if (isIE11 && $(window).width() >= 768) {
            // Force IE11 to recalculate fixed-bottom position
            $('#navigation').removeClass('fixed-bottom');
            // Force a reflow
            $('#navigation')[0].offsetHeight;
            // Then add it back
            $('#navigation').addClass('fixed-bottom');
            
            // Call the ensureNavigationVisibility function if it exists
            if (typeof ensureNavigationVisibility === 'function') {
                setTimeout(function() {
                    ensureNavigationVisibility(document.getElementById('navigation'));
                }, 50);
            }
        }

        $('#navigation img').addClass('d-none')
        $('#navigation p').addClass('d-none')

        if ($(window).width() > 1200) {
            if ($(window).height() > 800) {
                $('#navigation p').removeClass('d-none')
                $('#navigation img').removeClass('d-none')
            } else if ($(window).height() > 600) {
                $('#navigation img').removeClass('d-none')
            }
        } else {
            if ($(window).height() > 1200) {
                $('#navigation p').removeClass('d-none')
                $('#navigation img').removeClass('d-none')
            } else if ($(window).height() > 800) {
                $('#navigation img').removeClass('d-none')
            }
        }

        if ($(window).width() < 768) {
            $('#navigation').removeClass('fixed-bottom')
            $('#text').removeClass('desktop')
            $('#text').css('height', '')
        } else {
            $('#navigation').addClass('fixed-bottom')
            $('#text').addClass('desktop')
            $('#text').css('height', ($(window).height() - $('#navigation').outerHeight(true)) + 'px')
            
            // Extra step for IE11 - force repaint for fixed-bottom
            if (isIE11) {
                $('#navigation').css({position: 'fixed', bottom: '0'});
                
                // Extra check for IE11 navigation visibility
                if (typeof ensureNavigationVisibility === 'function') {
                    ensureNavigationVisibility(document.getElementById('navigation'));
                }
            }
        }

        if ($(window).width() < 576) {
            $('.nav-title').css('height', '')
        } else {
            var tallest = 0

            $('.nav-title').css('height', '')
            $('.nav-title').each(function () {
                var eleHeight = $(this).outerHeight(true)
                tallest = eleHeight > tallest ? eleHeight : tallest
            })

            $('.nav-title').css('height', tallest + 'px')
        }

        $('#text-text').css('height', '')
        if ($('#text-text').outerHeight(true) < $('#text-search').outerHeight(true)) {
            $('#text-text').css('height', $('#text-search').outerHeight(true) + 'px')
        }
    }

    // Run resize immediately on script load
    windowResized();

    $(window).on('load', function () {
        windowResized();
        
        // For IE11 and other problematic browsers, add extra resize calls
        if (isIE11) {
            setTimeout(windowResized, 100);
            setTimeout(windowResized, 500);
            
            // Fix background issues after load and resize
            if (typeof fixBackgroundIssues === 'function') {
                setTimeout(fixBackgroundIssues, 200);
                setTimeout(fixBackgroundIssues, 800);
            }
        }
    })

    $(window).on('resize', function () {
        clearTimeout(doit)
        doit = setTimeout(windowResized, 100)
    })
})
