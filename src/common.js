'use strict';

/**
 * Sidetalk - A Google Chrome extension that shows what people are talking
 * about the webpage you are looking at.
 *
 * @author Yu I. <Twitter @japboy>
 * @version 0.1.0
 */

var Sidetalk = {
    /**
     * Constant declaration
     */
    OTTER_TRACKBACKS_URL: 'http://otter.topsy.com/trackbacks.json',
    OTTER_URLINFO_URL: 'http://otter.topsy.com/urlinfo.json',
    OTTER_PARAM_PERPAGE: 50,
    RE_ANCHOR: [
        /(s?https?:\/\/[-_.!~*'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/g,
        '<a href="$1" target="_blank">$1</a>'
    ],
    RE_TWITTER_HASH: [
        /#([a-zA-Z0-9ぁ-ヶ亜-黑]+)/gi,
        '<a href="http://twitter.com/search/%23$1" target="_blank">' +
        '&#035;$1</a>'
    ],
    RE_TWITTER_ID: [
        /@([A-Za-z0-9_]{1,14}(?![a-z0-9_]))/g,
        '<a href="http://twitter.com/$1" target="_blank">@$1</a>'
    ],

    /**
     * Add 0 if the number is not 2 digits
     * @see http://temping-amagramer.blogspot.com/2009/08/javascript0002.html
     * @param {Number} number A number that has to be 2 digits.
     * @return {String} A string contains number of 2 digits.
     */
    getDigits: function(number) {
        return (function(string) {
            return string.substr(string.length - 2, 2);
        }('00' + number.toString()));
    },

    /**
     * Get local date & time from Unix timestamp
     * @param {Number} timestamp 10 digits of Unix timestamp
     * @return {String} Formatted date & time like `23:01, Sun, 01-Jan-2011`.
     */
    getDateString: function(timestamp) {
        var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            MONTH = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ],
            now = new Date(),
            date = new Date(timestamp * 1000),
            dateString = Sidetalk.getDigits(date.getHours()) + ':' +
                         Sidetalk.getDigits(date.getMinutes()) + ', ' +
                         DAY[date.getDay()] + ', ' +
                         date.getDate() +
                         '-' + MONTH[date.getMonth()] +
                         '-' + date.getFullYear();

        return dateString;
    },

    /**
     * Escape regular expression syntax characters
     * @see http://0xcc.net/blog/archives/000019.html
     * @param {String} pattern A pattern for regular expression.
     * @return {String} An escaped pattern.
     */
    getQuotedMetachars: function(pattern) {
        return pattern.replace(/(\W)/, '\\$1');
    },

    /**
     * Check if the URI is a valid URI
     * @param {String} uri A URI string that is validated.
     * @return {Boolean} Return true or false
     */
    isValidURI: function(uri) {
        if (uri.match(/^https?:\/\/.*/) === null) {
            console.debug('Invalid URI: ' + uri);
            return false;
        }

        return true;
    },

    /**
     * Return an encoded URI from a URI and the parameters
     * @param {String} uri A URI string.
     * @param {Object} params A hash of the URI parameters.
     * @return {String} An encoded URI string.
     */
    getEncodedURI: function(uri, params) {
        var encodedURI = '';

        if (uri.match(/.*\?$/) === null) {
            encodedURI = uri + '?';
        }
        else {
            encodedURI = uri;
        }

        for (key in params) {
            if (params[key]) {
                encodedURI += '&' + key + '=' + encodeURIComponent(params[key]);
            }
        }

        return encodedURI.replace(/\?&/, '?');
    },

    /**
     * Event handler listeners
     */
    eventListeners: (function() {
        var i = 1,
            listeners = {};

        return {
            addListener: function(element, eventName, handler, capture) {
                element.addEventListener(eventName, handler, capture);

                listeners[i] = {
                    element: element,
                    eventName: eventName,
                    handler: handler,
                    capture: capture
                };

                return i++;
            },
            removeListener: function(key) {
                if (key in listeners) {
                    var listener = listeners[key];

                    listener.element.removeEventListener(listener.eventName,
                                                         listener.handler,
                                                         listener.capture);
                }
            }
        };
    })(),

    /**
     * Declare a HTTP object
     */
    HTTP: {
        condition: false,

        /**
         * Process HTTP GET request and pass the result to callback function
         * @param {String} url A URL string for HTTP GET request.
         * @param {Function} callback A called function when HTTP request is finished.
         */
        get: function(uri, callback, errorback) {
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    Sidetalk.HTTP.condition = false;

                    console.debug('HTTP status: false');
                    callback(xhr);
                }
                else if (xhr.readyState === 4 && xhr.status === 500) {
                    Sidetalk.HTTP.condition === false;

                    console.debug('HTTP status: false');
                    errorback(xhr);
                }
            }

            xhr.open('GET', uri, true);
            xhr.send();

            Sidetalk.HTTP.condition = true;

            console.debug('HTTP status: true');
        }
    }
};
