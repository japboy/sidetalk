'use strict';

/**
 * Sidetalk - A Google Chrome extension that shows what people are talking
 * about the webpage you are looking at.
 *
 * @author Yu I. <Twitter @japboy>
 * @version 0.1.0
 */


/**
 * Set the badge text & color, then show it.
 * @param {String} tabId Unique ID for the current opening tab.
 * @param {Number} count The content text for the badge.
 * @param {Array} color RGBA color definition. ex) `[255, 0, 0, 255]`.
 */
Sidetalk.setBadge = function(tabId, count, color) {
    if (count > 9999) {
        count = count.toString().replace(/....$/, 'm');
    }
    else if (count > 999) {
        count = count.toString().replace(/...$/, 'k');
    }
    else if (count === 0) {
        count = '0';
    }
    else {
        count = count.toString();
    }

    chrome.browserAction.setBadgeText({
        'text': count, 'tabId': tabId
    });
    chrome.browserAction.setBadgeBackgroundColor({
        'color': color, 'tabId': tabId
    });
};

/**
 * Add an event handler when a tab is updated
 * @see http://code.google.com/chrome/extensions/tabs.html#event-onUpdated
 * @param {Function}
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    /**
     * Fetch tweet count from Otter API and pass the number
     * @param {Number} tabId
     * @param {Object} changeInfo
     * @param {Tab} tab
     */
    if (Sidetalk.isValidURI(tab.url) === false) {
        return;
    }

    var url = Sidetalk.getEncodedURI(Sidetalk.OTTER_URLINFO_URL,
                                     {'url': tab.url});

    Sidetalk.HTTP.get(url, function(xhr) {
        var response = JSON.parse(xhr.responseText).response;

        Sidetalk.setBadge(tabId, response.trackback_total, [255, 0, 0, 255]);
    });
});
