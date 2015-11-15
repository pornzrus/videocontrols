/*!
 * VideoControls v1.6
 *
 * Copyright 2014 pornR us
 * Released under the GPLv2 license
 * http://blog.pornzrus.com/2014-01-25-HTML5-Video-Player-like-YouTube-in-jQuery-plugin
*/

(function($)
{
    $.fn.videocontrols = function(options)
    {
        var defaults = {
            markers: [], // [0, 23, 45],
            preview: {
/*
                sprites: ['sprites1.jpg', 'sprites2.jpg'],
                step: 10,
                height: 112,
                width: 200,
                wide: 60000
*/
            },
            theme: {
                progressbar: 'blue',
                range: 'pink',
                volume: 'pink'
            },
            fillscreen: true,
            fullscreen: true,
            mediumscreen: true,
            seek: true,
            time: true,
            volume: true,
            durationchange: null,
            end: null,
            fillscreenchange: null,
            fullscreenchange: null,
            load: null,
            mediumscreenchange: null,
            pause: null,
            play: null,
            seekchange: null,
            volumechange: null
        };
        options = $.extend(defaults, options);

        var isTouch        = 'ontouchstart' in window || 'onmsgesturechange' in window;
        var loaded         = false;
        var $video         = $(this);
        var $video_parent  = null;
        var volume         = 0.75;
        var buffered       = 0;
        var lastX          = 0;
        var lastMove       = 0;
        var timerHover     = null;
        var fillscreen     = false;
        var mediumscreen   = false;
        var exitFullscreen = false;

        if (localStorageGetItem('videocontrols-muted') === null) {
            localStorageSetItem('videocontrols-muted', '0');
        }
        $video[0].muted = localStorageGetItem('videocontrols-muted') == '1' ? true : false;

        if (localStorageGetItem('videocontrols-volume') === null) {
            localStorageSetItem('videocontrols-volume', volume);
        }
        volume           = localStorageGetItem('videocontrols-volume', volume);
        $video[0].volume = volume;

        this.fillscreenToggle = function()
        {
            $video_parent.find('.videocontrols-fillscreen').trigger('click');
        };

        this.fullscreenToggle = function()
        {
            $video_parent.find('.videocontrols-fullscreen').trigger('click');
        };

        this.mediumscreenToggle = function()
        {
            $video_parent.find('.videocontrols-mediumscreen').trigger('click');
        };

        this.playToggle = function()
        {
            $video_parent.find('.videocontrols-play').trigger('click');
        };

        this.preview_marker = function(seconds)
        {
            $video_parent.find('.videocontrols-preview').remove();

            $video_parent.parent().find('.vc-player').addClass('hover');
            $video_parent.find('.videocontrols-tag[tag="' + seconds + '"]').addClass('light');

            if (!$.isEmptyObject(options.preview)) {
                displayPreview($video_parent.find('.videocontrols-tag[tag="' + seconds + '"]').offset().left);
            }

            $video_parent.find('.videocontrols-preview-img').addClass('light');
        };

        this.previews_marker_hide = function()
        {
            $video_parent.find('.videocontrols-tag').removeClass('light');
            $video_parent.parent().find('.vc-player').removeClass('hover');
            $video_parent.find('.videocontrols-preview').remove();
        };

        return this.each(function ()
        {
            if (isTouch) {
                return false;
            }

            function load()
            {
                if (options.preview.sprites.length > 0) {
                    var img = new Image()
                    img.onload = function ()
                    {
                        if (!options.preview.height) {
                            options.preview.height = parseInt(this.height);
                        }
                        if (!options.preview.wide) {
                            options.preview.wide = parseInt(this.width);
                        }
                    }
                    img.src = options.preview.sprites[0];
                }

                $video_parent.find('.videocontrols-tag').remove();
                for (var i = 0; i < options.markers.length; i++) {
                    var pourcent = options.markers[i] * 100 / $video[0].duration;
                    $video_parent.find('.videocontrols-seeker').append('<div class="videocontrols-tag" style="left : ' + pourcent + '%;" tag="' + options.markers[i] + '"></div>');
                }

                if (options.load) {
                    options.load($(this));
                }

                if ($video.attr('autoplay')) {
                    $video_parent.find('.videocontrols-play').trigger('click');
                }
            }

            $video.wrap('<div class="vc-player"></div>');
            $video_parent = $(this).parent();

            var html = '<div class="videocontrols">';
            if (defaults.seek) {
                html += '    <div class="videocontrols-seeker">' +
                        '        <div class="videocontrols-loadingbar"></div>' +
                        '        <div class="videocontrols-progressbar progressbar-color-' + defaults.theme.progressbar + '"></div>' +
                        '        <div class="videocontrols-seekbar videocontrols-range">' +
                        '            <div class="videocontrols-range-little range-little-' + defaults.theme.range + '"></div>' +
                        '        </div>' +
                        '    </div>';
            }
            html += '    <div class="videocontrols-btn">' +
                    '        <div class="videocontrols-play videocontrols-button vc-icon-play"></div>';
            if (defaults.time) {
                html += '        <div class="videocontrols-time">' +
                        '            <span class="videocontrols-timer">00:00</span><span class="videocontrols-totaltime"> / 00:00</span>' +
                        '        </div>';
            }
            html += '        <div class="videocontrols-right">';
            if (defaults.volume) {
                html += '            <div class="videocontrols-button videocontrols-mute vc-icon-volume vc-icon-volume-high"></div>' +
                        '            <div class="videocontrols-weight-volume">' +
                        '                <div class="videocontrols-volume">' +
                        '                    <div class="videocontrols-volume-progressbar volumebar-color-' + defaults.theme.volume + '"></div>' +
                        '                    <div class="videocontrols-volumebar videocontrols-volume-range"></div>' +
                        '                </div>' +
                        '            </div>';
            }
            if (defaults.fillscreen) {
                html += '            <div class="videocontrols-fillscreen videocontrols-button vc-icon-expand3" title="Fill video"></div>';
            }
            if (defaults.mediumscreen) {
                html += '            <div class="videocontrols-mediumscreen videocontrols-button vc-icon-expand2" title="Mediumscreen"></div>';
            }
            if (defaults.fullscreen) {
                html += '            <div class="videocontrols-fullscreen videocontrols-button vc-icon-expand" title="Fullscreen"></div>';
            }
            html += '        </div>' +
                    '    </div>' +
                    '</div>' +
                    '<div class="videocontrols-giant-icon">' +
                    '    <div class="videocontrols-big-play vc-giant-icon vc-icon-big-play"></div>' +
                    '    <div class="videocontrols-big-pause vc-giant-icon vc-icon-big-pause" style="display: none;"></div>' +
                    '</div>';
            $video.after(html);

            $video_parent.parent().find('.vc-player').on('mouseenter touchstart', function ()
            {
                clearTimeout(timerHover);

                $(this).addClass('hover');
            });
            $video_parent.parent().find('.vc-player').on('mouseleave touchend', function ()
            {
                clearTimeout(timerHover);

                timerHover = setTimeout(function ()
                {
                    $video_parent.parent().find('.vc-player').removeClass('hover');
                }, 2000);
            });

            $video.on('durationchange', function ()
            {
                if (!loaded) {
                    loaded = true;
                    load();
                }
                $video_parent.find('.videocontrols-totaltime').html(' / ' + secondsToTime($video[0].duration));

                if (options.durationchange) {
                    options.durationchange($(this));
                }
            });

            $video.on('progress canplaythrough loadedmetadata loadeddata', function (e)
            {
                if (!$video.attr('height') && this.videoHeight > 0) {
                    $video.attr('height', this.videoHeight);
                }
                if (!$video.attr('width') && this.videoWidth > 0) {
                    $video.attr('width', this.videoWidth);
                }

                if ($video[0].buffered && $video[0].buffered.length > 0) {
                    for (var i = 0; i < $video[0].buffered.length; i++) {
                        var buffer = $video[0].buffered.end(i);
                        if (buffer > buffered) {
                            buffered = buffer;
                            var pourcent = buffer / $video[0].duration * 100;
                            $video_parent.find('.videocontrols-loadingbar').css('width', pourcent + '%');
                        }
                    }
                }
            });

            $video.on('click', function ()
            {
                $video_parent.find('.videocontrols-play').trigger('click');
            });

            $video.on('playing', function ()
            {
                $video_parent.find('.videocontrols-play').removeClass('vc-icon-play').addClass('vc-icon-pause');
            });

            $video.on('timeupdate', timeupdate);

            function timeupdate()
            {
                var pourcent = $video[0].currentTime * 100 / $video[0].duration;
                $video_parent.find('.videocontrols-progressbar').css('width', pourcent + '%');
                $video_parent.find('.videocontrols-seekbar').css('left', pourcent + '%');
                $video_parent.find('.videocontrols-timer').html(secondsToTime($video[0].currentTime));
            }

            $video.on('ended', function ()
            {
                $video[0].currentTime = 0;
                $video[0].pause();

                if (options.end) {
                    options.end($(this));
                }
            });

            $video_parent.find('.videocontrols-big-play, .videocontrols-big-pause').on('click', function (e)
            {
                $video_parent.find('.videocontrols-play').trigger('click');
            });

            $video_parent.find('.videocontrols-play').on('click', function (e)
            {
                e.preventDefault();

                if (!$video[0].paused) {
                    $video_parent.find('.videocontrols-giant-icon').show();
                    $video_parent.find('.videocontrols-big-pause').show();
                    $video_parent.find('.videocontrols-play').removeClass('vc-icon-pause').addClass('vc-icon-play');
                    $video[0].pause();

                    if (options.pause) {
                        options.pause($(this));
                    }
                }
                else
                {
                    $video_parent.find('.videocontrols-big-play, .videocontrols-big-pause').hide();
                    $video_parent.find('.videocontrols-giant-icon').hide();
                    $video[0].play();

                    if (options.play) {
                        options.play($(this));
                    }
                }
            });

            $video_parent.find('.videocontrols-seeker').on('mousemove touchmove', function (e)
            {
                if (!$.isEmptyObject(options.preview)) {
                    e.preventDefault();
                    e.stopPropagation();

                    var clientX = getClientX(e);
                    if (Math.abs(lastX - clientX) > 3) {
                        lastX = clientX;

                        if ($video_parent.find('.videocontrols-preview').length === 0)
                        {
                            $(document).on('mousemove touchmove', seeker_move);
                        }
                        displayPreview(clientX);
                    }
                }
            });

            function seeker_move(e)
            {
                if ($video_parent.find('.videocontrols-seeker').length > 0 && $video_parent.find('.videocontrols-preview').length > 0) {
                    var minX = Math.min($video_parent.find('.videocontrols-seeker').offset().left, $video_parent.find('.videocontrols-preview').offset().left);
                    var minY = Math.min($video_parent.find('.videocontrols-preview').offset().top, $video_parent.find('.videocontrols-seeker').offset().top);
                    var maxX = Math.max($video_parent.find('.videocontrols-seeker').offset().left + $video_parent.find('.videocontrols-seeker').width(), $video_parent.find('.videocontrols-preview').offset().left + $video_parent.find('.videocontrols-preview').width());
                    var maxY = $video_parent.find('.videocontrols-seeker').offset().top + $video_parent.find('.videocontrols-seeker').height();
                    if (e.pageX < minX || e.pageX > maxX || e.pageY < minY || e.pageY > maxY) {
                        $(document).off('mousemove touchmove', seeker_move);

                        $video_parent.find('.videocontrols-preview').remove();
                    }

                    if (options.seekchange) {
                        options.seekchange($(this));
                    }
                }
            }

            $video_parent.find('.videocontrols-seeker').on('click', function (e)
            {
                e.preventDefault();
                e.stopPropagation();

                var clientX = getClientX(e);

                var left = clientX - $video_parent.find('.videocontrols-seeker').offset().left;
                left     = Math.max(0, left);
                left     = Math.min($video_parent.find('.videocontrols-seeker').width(), left);
                $video.off('timeupdate', timeupdate);
                $video_parent.find('.videocontrols-seekbar').animate({ left: left }, 150, 'linear', function ()
                {
                    seekbar_up(clientX);
                });
            });

            $video_parent.find('.videocontrols-seekbar').on('mousedown touchstart', function (e)
            {
                e.preventDefault();

                $(document).one('mouseup touchend', seekbar_up);

                $video.off('timeupdate', timeupdate);
                $(document).on('mousemove touchmove', seekbar_move);
            });

            function seekbar_move(e)
            {
                e.preventDefault();
                e.stopPropagation();

                var clientX = getClientX(e);

                var left = clientX - $video_parent.find('.videocontrols-seeker').offset().left;
                left     = Math.max(0, left);
                left     = Math.min($video_parent.find('.videocontrols-seeker').width(), left);
                $video_parent.find('.videocontrols-seekbar').css('left', left);
            }

            function seekbar_up(e)
            {
                if (!$.isNumeric(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                var clientX = getClientX(e);

                $(document).off('mousemove touchmove', seekbar_move);
                $video[0].currentTime = (clientX - $video_parent.find('.videocontrols-seeker').offset().left) / $video_parent.find('.videocontrols-seeker').width() * $video[0].duration;
                $video.on('timeupdate', timeupdate);
                $video_parent.find('.videocontrols-preview').remove();
            }

            $video.on('volumechange', volumechange);

            function volumechange()
            {
                var pourcent = $video[0].volume * 100;
                $video_parent.find('.videocontrols-volume-progressbar').css('width', pourcent + '%');
                $video_parent.find('.videocontrols-volumebar').css('left', pourcent + '%');

                $video_parent.find('.videocontrols-mute').removeClass('vc-icon-volume-high vc-icon-volume-medium vc-icon-volume-low vc-icon-volume-mute2 vc-icon-volume-mute');
                if ($video[0].muted) {
                    $video_parent.find('.videocontrols-mute').addClass('vc-icon-volume-mute2');
                }
                else if (pourcent > 75) {
                    $video_parent.find('.videocontrols-mute').addClass('vc-icon-volume-high');
                }
                else if (pourcent > 50) {
                    $video_parent.find('.videocontrols-mute').addClass('vc-icon-volume-medium');
                }
                else if (pourcent > 15) {
                    $video_parent.find('.videocontrols-mute').addClass('vc-icon-volume-low');
                }
                else {
                    $video_parent.find('.videocontrols-mute').addClass('vc-icon-volume-mute');
                }
            }

            $video_parent.find('.videocontrols-mute').on('click', function (e)
            {
                e.preventDefault();

                if (!$video[0].muted) {
                    $video[0].muted = true;
                    localStorageSetItem('videocontrols-muted', '1');
                }
                else {
                    $video[0].muted = false;
                    localStorageSetItem('videocontrols-muted', '0');
                }
            });

            $video_parent.find('.videocontrols-weight-volume').on('click', function (e)
            {
                volume_move(e);
            });

            $video_parent.find('.videocontrols-volumebar').on('mousedown touchstart', function (e)
            {
                e.preventDefault();

                $(document).one('mouseup touchend', volume_up);
                $(document).on('mousemove touchmove', volume_move);
            });

            function volume_move(e)
            {
                e.preventDefault();
                e.stopPropagation();

                var clientX = getClientX(e);

                volume = (clientX - $video_parent.find('.videocontrols-volume').offset().left) / $video_parent.find('.videocontrols-volume').width();
                volume = Math.max(0, volume);
                volume = Math.min(1, volume);
                $video[0].muted = false;
                $video[0].volume = volume;

                localStorageSetItem('videocontrols-muted', '0');
                localStorageSetItem('videocontrols-volume', volume);
            }

            function volume_up(e)
            {
                $(document).off('mousemove touchmove', volume_move);

                if (options.volumechange) {
                    options.volumechange($(this));
                }
            }

            $video_parent.find('.videocontrols-fillscreen').on('click', function (e)
            {
                e.preventDefault();

                if (!fillscreen) {
                    fillscreen = true;

                    $video_parent.addClass('player-fillscreen');
                    $video_parent.find('.videocontrols-fillscreen').removeClass('vc-icon-expand3').addClass('vc-icon-contract3');
                }
                else {
                    fillscreen = false;

                    $video_parent.removeClass('player-fillscreen');
                    $video_parent.find('.videocontrols-fillscreen').removeClass('vc-icon-contract3').addClass('vc-icon-expand3');
                }

                if (options.fillscreenchange) {
                    options.fillscreenchange($(this));
                }
            });

            $video_parent.find('.videocontrols-mediumscreen').on('click', function (e)
            {
                e.preventDefault();

                if (!mediumscreen) {
                    mediumscreen = true;

                    $video_parent.addClass('player-mediumscreen');
                    $video_parent.find('.videocontrols-mediumscreen').removeClass('vc-icon-expand2').addClass('vc-icon-contract2');
                    $video_parent.find('.videocontrols-fillscreen').hide();
                }
                else {
                    mediumscreen = false;

                    $video_parent.removeClass('player-mediumscreen');
                    $video_parent.find('.videocontrols-mediumscreen').removeClass('vc-icon-contract2').addClass('vc-icon-expand2');
                    $video_parent.find('.videocontrols-fillscreen').show();
                }

                if (options.mediumscreenchange) {
                    options.mediumscreenchange($(this));
                }
            });

            $video_parent.find('.videocontrols-fullscreen').on('click', function (e)
            {
                e.preventDefault();

                var DOMVideo = $video_parent.get(0);

                var requestFullScreen = DOMVideo.requestFullscreen || DOMVideo.webkitRequestFullscreen || DOMVideo.mozRequestFullScreen || DOMVideo.msRequestFullscreen;
                var cancelFullScreen  = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;

                if(!exitFullscreen && !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                    if (mediumscreen) {
                        $video_parent.find('.videocontrols-mediumscreen').trigger('click');
                    }

                    requestFullScreen.call(DOMVideo);

                    $video_parent.addClass('player-fullscreen');
                    $video_parent.find('.videocontrols-fullscreen').removeClass('vc-icon-expand').addClass('vc-icon-contract');
                    $video_parent.find('.videocontrols-fillscreen').hide();
                    $video_parent.find('.videocontrols-mediumscreen').hide();

                    window.setTimeout(function ()
                    {
                        $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange', fullscreenChange);
                    }, 500);

                    $(document).on('mousemove touchmove', fullscreenMove);
                }
                else {
                    exitFullscreen = false;

                    $(document).off('mousemove touchmove', fullscreenMove);

                    $(document).off('fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange', fullscreenChange);

                    cancelFullScreen.call(document);

                    $video_parent.removeClass('player-fullscreen');
                    $video_parent.find('.videocontrols-fullscreen').removeClass('vc-icon-contract').addClass('vc-icon-expand');
                    $video_parent.find('.videocontrols-fillscreen').show();
                    $video_parent.find('.videocontrols-mediumscreen').show();

                    $video_parent.find('video').css('height', '');
                }

                if (options.fullscreenchange) {
                    options.fullscreenchange($(this));
                }
            });

            function fullscreenMove()
            {
                if (!$video_parent.parent().find('.vc-player').hasClass('hover')) {
                    $video_parent.parent().find('.vc-player').addClass('hover');
                }
                clearTimeout(timerHover);

                timerHover = setTimeout(function ()
                {
                    $video_parent.parent().find('.vc-player').removeClass('hover');
                }, 2000);
            }

            function fullscreenChange()
            {
                exitFullscreen = true;

                $video_parent.find('.videocontrols-fullscreen').trigger('click');
            }

            $video.removeAttr('controls');
            $video.trigger('volumechange');
        });

        function displayPreview(position)
        {
            $video_parent.find('.videocontrols-preview').remove();

            var left    = position - $video_parent.find('.videocontrols-seeker').offset().left;
            left        = Math.max(0, left);
            left        = Math.min($video_parent.find('.videocontrols-seeker').width(), left);
            var seconds = left / $video_parent.find('.videocontrols-seeker').width() * $video[0].duration;
            var factor  = Math.floor((seconds + 5) / options.preview.step);
            var sprite  = options.preview.sprites[Math.floor(factor / (options.preview.wide / options.preview.width))];
            factor      = Math.floor(factor % (options.preview.wide / options.preview.width));
            left        = Math.max(options.preview.width / 2, left);
            left        = Math.min($video_parent.find('.videocontrols-seeker').width() - (options.preview.width / 2), left);
            $video_parent.find('.videocontrols-seeker').append('<div class="videocontrols-preview" style="left: ' + (left - (options.preview.width / 2) - 3) + 'px;">' +
                '            <div class="videocontrols-preview-img">' +
                '                <span class="videocontrols-img" style="width: ' + options.preview.width + 'px; height: ' + options.preview.height + 'px; background: url(\'' + sprite + '\') no-repeat -' + (options.preview.width * factor) + 'px 0px;"></span>' +
                '                <span class="videocontrols-previewtime">' + secondsToTime(seconds) + '</span>' +
                '            </div>' +
                '            <div class="videocontrols-preview-connection" style="margin-left: ' + (position - left - $video_parent.find('.videocontrols-seeker').offset().left + (options.preview.width / 2)) + 'px"></div>' +
                '        </div>');
        }

        function getClientX(e)
        {
            var clientX = 0;
            if ($.isNumeric(e)) {
                clientX = e;
            }
            else if ($.isNumeric(e.clientX)) {
                clientX = $(document).scrollLeft() + e.clientX;
            }
            else if (isTouch) {
                clientX = e.originalEvent.pageX + e.originalEvent.targetTouches[0].clientX;
            }
            return clientX;
        }

        function localStorageGetItem(key, defaultValue)
        {
            var result = null;
            if (!!window.localStorage) {
                result = localStorage.getItem(key);
            }
            if (result === null) {
                result = defaultValue;
            }
            return result;
        }

        function localStorageSetItem(key, value)
        {
            if (!!window.localStorage) {
                try {
                    localStorage.setItem(key, value);
                }
                catch (e) { }
            }
        }

        function secondsToTime(value)
        {
            var hours = Math.floor(((value / 86400) % 1) * 24);
            var minutes = Math.floor(((value / 3600) % 1) * 60);
            var seconds = Math.round(((value / 60) % 1) * 60);
            var time = '';
            if (hours > 0) {
                time += ((hours < 10) ? '0' + hours : hours) + ':';
            }

            time += ((minutes < 10) ? '0' + minutes : minutes) + ':';
            time += (seconds < 10) ? '0' + seconds : seconds;

            return time;
        }
    };

    $.fn.videocontrols.defaults = { };
})(jQuery);
