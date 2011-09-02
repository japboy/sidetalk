'use strict';

/**
 * Sidetalk - A Google Chrome extension that shows what people are talking
 * about the webpage you are looking at.
 *
 * @author Yu I. <Twitter @japboy>
 * @version 0.1.0
 */

(function() {
    /**
     * A cache object to store JSON object from the API response
     */
    var cache = {},
        re_cache = new RegExp(),
        re_string = '',

    /**
     * FIXME: Hightlight implementation
     * Search and filter contents incrementally
     * @param {String} className Class name for target DOM elements.
     * @param {String} keyword A keyword for incremental search.
     */
    filterItems = function(className, keyword) {
        var listItems = document.getElementsByClassName(className),
            re_currentKeyword = new RegExp(
                '(' + getQuotedMetachars(keyword) + ')',
                'gi'
            ),
            currentKeyword = getQuotedMetachars(keyword),
            re_previousKeyword = re_cache,
            previousKeyword = re_string;

        filterItem = function(currentListItem) {
            if (currentListItem.innerHTML.match(re_currentKeyword)) {
                currentListItem.style.display = 'block';
                /*
                currentListItem.getElementsByTagName('dd')[0].innerHTML =
                    currentListItem.getElementsByTagName('dd')[0].innerHTML.replace(re_currentKeyword, '<strong>' + '$1' + '</strong>');
                */
            }
            else {
                currentListItem.style.display = 'none';
            }
        };

        for (var i = 0; i < listItems.length; i++) {
            /*
            if (re_previousKeyword.source === '' && previousKeyword === '') {
                filterItem(listItems[i]);
            }
            else {
                if (listItems[i].innerText.match(re_previousKeyword)) {
                    listItems[i].style.display = 'block';
                    listItems[i].getElementsByTagName('dd')[0].innerHTML =
                        listItems[i].getElementsByTagName('dd')[0].innerHTML.replace(re_previousKeyword, previousKeyword);
                    filterItem(listItems[i]);
                }
                else {
                    listItems[i].style.display = 'none';
                    listItems[i].getElementsByTagName('dd')[0].iinnerHTML =
                        cache.list[i].content;
                }
            }
            */

            filterItem(listItems[i]);
        }

        re_cache = new RegExp('<strong>(' + currentKeyword + ')<\/strong>', 'gi');
        re_string = currentKeyword;
    },

    /**
     * Remove a HTML element by its ID attribute
     * @param {String} id The ID attribute of an element to be removed.
     */
    removeElementById =  function(id) {
        var node = document.getElementById(id);

        if (node === null) {
            return;
        }

        node = document.getElementById(id);
        node.parentNode.removeChild(node);
    },

    /**
     * Remove HTML elements by the Class attribute
     * @param {String} className The Class attribute of elements to be removed.
     */
    removeElementsByClass = function(className) {
        var nodes = document.getElementsByClassName(className);

        if (nodes === null || nodes.length <= 0) {
            return;
        }

        while (nodes.length > 0) {
            nodes[nodes.length - 1].parentNode.removeChild(nodes[nodes.length - 1]);
        }
    },

    /**
     * Hide or unhide a HTML element by its ID attribute
     * @param {String} id The ID attribute of an element to be removed.
     * @param {Boolean} flag `true` to hide and `false` to unhide.
     */
    hideElementById = function(id, flag) {
        var node = document.getElementById(id);

        if (node === null) {
            return;
        }

        if (flag === undefined) {
            flag = true;
        }

        if (flag === true) {
            node.style.display = 'none';
        }
        else {
            node.style.display = 'block';
        }
    },

    /**
     * Hide or unhide HTML elements by the Class attribute
     * @param {String} className The Class attribute of elements to be removed.
     * @param {Boolean} flag `true` to hide and `false` to unhide.
     */
    hideElementsByClassName = function(className, flag) {
        var nodes = document.getElementsByClassName(className);

        if (nodes === null || nodes.length <= 0) {
            return;
        }

        if (flag === undefined) {
            flag = true;
        }

        for (var node in nodes) {
            if (flag === true) {
                node.style.display = 'none';
            }
            else {
                node.style.display = 'block';
            }
        }
    },

    /**
     * Create and draw a set of HTML elements for message
     * @param {String} message A message to show
     * @param {String} className The name of Class attribute to set
     */
    createMessage = function(message, className) {
        hideElementById('loader');
        document.getElementById('talks').innerHTML = '<p>' + message + '</p>'
    },

    /**
     * Create and draw a set of HTML elements for each talk
     * @param {Object} listItem A set object of each talk content
     * @param {String} className The name of Class attribute to set
     */
    createItem = function(listItem, className) {
        var defList = document.createElement('dl'),
            defTerm = document.createElement('dt'),
            itemPortrait = document.createElement('img'),
            defDesc = document.createElement('dd'),
            itemContent = listItem.content.replace(Sidetalk.RE_ANCHOR[0], Sidetalk.RE_ANCHOR[1]
                ).replace(Sidetalk.RE_TWITTER_HASH[0], Sidetalk.RE_TWITTER_HASH[1]
                ).replace(Sidetalk.RE_TWITTER_ID[0], Sidetalk.RE_TWITTER_ID[1]);

        defList.setAttribute('class', className);

        itemPortrait.setAttribute('src', listItem.author.photo_url);
        itemPortrait.setAttribute('alt', listItem.author.name);
        itemPortrait.setAttribute('width', '32');
        itemPortrait.setAttribute('height', '32');

        if (listItem.permalink_url) {
            var itemAnchor = document.createElement('a');

            itemAnchor.setAttribute('href', listItem.permalink_url);
            itemAnchor.setAttribute('target', '_blank');
            itemAnchor.appendChild(itemPortrait);
            defTerm.appendChild(itemAnchor);
        }
        else {
            defTerm.appendChild(itemPortrait);
        }

        if (listItem.date) {
            var itemDate = document.createElement('span'),
                date = Sidetalk.getDateString(listItem.date),
                itemDateContent = document.createTextNode(date);

            itemDate.setAttribute('class', 'date');
            itemDate.appendChild(itemDateContent);
            defTerm.appendChild(itemDate);
        }

        console.debug(itemContent);
        defDesc.innerHTML = itemContent;
        defList.appendChild(defTerm);
        defList.appendChild(defDesc);
        document.getElementById('talks').appendChild(defList);
    },

    /**
     * Fetch Topsy Otter API trackbacks and generate page contents by the response.
     * @see http://otter.topsy.com/
     * @param {String} param_url A URL string for the API parameter.
     * @param {Number} param_page An optinal number of page parameter.
     */
    getTrackbacks = function(params) {
        if (Sidetalk.isValidURI(params.url) === false) {
            createMessage('Invalid address.', 'message');
            return;
        }

        params.perpage = Sidetalk.OTTER_PARAM_PERPAGE;
        //params.nohidden = 0;

        var encodedURI = Sidetalk.getEncodedURI(Sidetalk.OTTER_TRACKBACKS_URL, params);

        Sidetalk.HTTP.get(encodedURI, function(xhr) {
            var response = JSON.parse(xhr.responseText).response,
                totalpage = Math.ceil(response.total /
                                      Sidetalk.OTTER_PARAM_PERPAGE);

            if (response.errors) {
                createMessage('Server responds errors. Try again later',
                              'message');

                for (error in response.errors) {
                    console.debug(error);
                }

                return;
            }

            if (response.total === 0) {
                createMessage('No one tweets here.', 'message');
                return;
            }

            cache = response;

            for (var i = 0; i < response.list.length; i++) {
                createItem(response.list[i], 'talk');
            }

            if (cache.total <= Sidetalk.OTTER_PARAM_PERPAGE) {
                hideElementById('loader');
            }
        }, function(xhr) {
            createMessage('Server responds an error. Try again later.',
                          'message');
            console.debug('Error status code: ' + xhr.status, 'message');
        });
        console.debug('GET: ' + encodedURI);
    };

    /**
     * Wrap events for HTML Form
     */
    var defaultValue = document.isearch.pattern.value;

    document.isearch.pattern.addEventListener('blur', function() {
        if (this.value === '') {
            this.value = defaultValue;
            this.style.color = '#aaa';
        }
    }, true);
    document.isearch.pattern.addEventListener('focus', function() {
        if (this.value === defaultValue) {
            this.value = '';
            this.style.color = '#000';
        }
    }, true);
    document.isearch.pattern.addEventListener('keyup', function() {
        filterItems('talk', this.value);
    }, true);
    document.isearch.addEventListener('submit', function(e) {
        /*
        if (this.pattern.value != '') {
            window.location.href = '#page2';
            getTrackbacks({
                'url': cache.tab.url,
                'contains': this.pattern.value
            });
        }
        */
        e.preventDefault();
    }, false);
    console.debug('Form event listeners added.');

    var eventListener = {},

    detectScrollEnd = function(tab) {
        var article = document.getElementsByTagName('article')[0],
            contentHeight = article.scrollHeight - article.offsetHeight,
            defLists = document.getElementsByClassName('talk');

        document.getElementById('summary').innerHTML =
            contentHeight + ' : ' + article.scrollTop + ' || ' +
            defLists.length + ' : ' + cache.total;

        if (contentHeight <= article.scrollTop) {

            if (cache.total <= defLists.length) {
                Sidetalk.eventListeners.removeListener(eventListener);
                hideElementById('loader');
                return;
            }

            hideElementById('loader', false);

            getTrackbacks({
                'url': tab.url,
                'page': cache.page + 1,
                'offset': cache.last_offset,
            });
        }
    };

    /**
     * Get the current tab and pass it to callback function
     * @see http://code.google.com/chrome/extensions/tabs.html#method-getSelected
     * @param {Number} windowId
     * @param {Function} callback
     */
    chrome.tabs.getSelected(undefined, function(tab) {
        /**
         * Call the function to fetch tweets from Otter API
         * @param {Tab} tab The current tab object.
         */
        getTrackbacks({'url': tab.url});

        var article = document.getElementsByTagName('article')[0];

        eventListener = Sidetalk.eventListeners.addListener(article,
                                                   'scroll',
                                                   function() {
                                                       detectScrollEnd(tab);
                                                    },
                                                   false);
        //console.debug('Listener ID: ' + scrollEvent);
    });
    console.debug('Sequential processes all done.');
})();
