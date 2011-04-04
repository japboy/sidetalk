/**
 * Sidetalk
 *
 * A Google Chrome extension that shows what people are talking about the
 * webpage you are looking at.
 *
 * @overview A JavaScript file contains Chrome extension Background script.
 * @author Yu Inao <lagfer(at)youck(dot)org>
 * @version 0.0.9
 */

/**
 * Set the badge text & color, then show it.
 * @param {String} tabId Unique ID for the current opening tab.
 * @param {String} text The content text for the badge.
 * @param {Array} color RGBA color definition. ex) `[255, 0, 0, 255]`.
 */
function setBadge(tabId, text, color)
{
    if (text > 999)
    {
        text = text.toString().replace(/...$/, 'k');
    }
    else if (text == 0)
    {
        text = '';
    }
    else
    {
        text = text.toString();
    }
    chrome.browserAction.setBadgeText(
        {'text': text, 'tabId': tabId}
    );
    chrome.browserAction.setBadgeBackgroundColor(
        {'color': color, 'tabId': tabId}
    );
}

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab)
    {
        var resp;
        var xhr = new XMLHttpRequest();

        if (tab.url.match(/^https?:\/\/.*/) == null)
        {
            return;
        }
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState == 4)
            {
                resp = JSON.parse(xhr.responseText);
                setBadge(
                    tabId,
                    resp.response.trackback_total,
                    [255, 0, 0, 255]
                );
            }
        }
        xhr.open(
            'GET',
            'http://otter.topsy.com/urlinfo.json?url=' +
                encodeURIComponent(tab.url),
            true
        );
        xhr.send();
    }
);
