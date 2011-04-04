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

var cachedTab = new Object();

/**
 * A cache object to store JSON object from the API response
 */
var cache =
{
    topsy_trackback_url: '',
    total: 0,
    list: new Array(),
};

/**
 * A record of how many times XHR request is sent
 */
var request = 0;

var re_cache = new RegExp();
var re_string = '';

/**
 * Get local date & time from Unix timestamp
 * @param {Number} timestamp 10 digits of Unix timestamp
 * @return {String} Formatted date & time like `23:01, Sun, 01-Jan-2011`.
 */
function getDateString(timestamp)    
{
    var date = new Date(timestamp * 1000);
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var month = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    var dateString = 
        date.getHours() + ':' + date.getMinutes() + ', ' +
        day[date.getDay()] + ', ' +
        date.getDate() +
        '-' + month[date.getMonth()] + 
        '-' + date.getFullYear();
    return dateString;
}

/**
 * Escape regular expression syntax characters
 * @see http://0xcc.net/blog/archives/000019.html
 * @param {String} pattern A pattern for regular expression.
 * @return {String} An escaped pattern.
 */
function quoteMetachars(pattern)
{
    return pattern.replace(/(\W)/, '\\$1');
}

/**
 * Search and filter contents incrementally
 * @see http://0xcc.net/blog/archives/000019.html
 * @param {String} className Class name for target DOM elements.
 * @param {String} keyword A keyword for incremental search.
 */
function filterItems(className, keyword)
{
    var listItems = document.getElementsByClassName(className);
    var re_currentKeyword = new RegExp(
        '(' + quoteMetachars(keyword) + ')',
        'gi'
    );
    var currentKeyword = quoteMetachars(keyword);
    var re_previousKeyword = re_cache;
    var previousKeyword = re_string;

    var filterItem = function(currentListItem)
    {
        if (currentListItem.innerHTML.match(re_currentKeyword))
        {
            currentListItem.style.display = 'block';
            /*
            currentListItem.getElementsByTagName('dd')[0].innerHTML =
                currentListItem.getElementsByTagName('dd')[0].innerHTML.replace(
                    re_currentKeyword,
                    '<strong>' + '$1' + '</strong>'
                );
            */
        }
        else
        {
            currentListItem.style.display = 'none';
        }
    }

    for (var i = 0; i < listItems.length; i++)
    {
        /*
        if (re_previousKeyword.source == '' && previousKeyword == '')
        {
            filterItem(listItems[i]);
        }
        else
        {
            if (listItems[i].innerText.match(re_previousKeyword))
            {
                listItems[i].style.display = 'block';
                listItems[i].getElementsByTagName('dd')[0].innerHTML =
                    listItems[i].getElementsByTagName('dd')[0].innerHTML.replace(
                        re_previousKeyword,
                        previousKeyword
                    );
                filterItem(listItems[i]);
            }
            else
            {
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
}

/**
 * Remove a generated HTML element by its ID attribute
 * @see https://github.com/shapeshed/twitter_reactions
 * @param {String} id The ID attribute of an element to be removed.
 */
function removeElementById(id)
{
    var node;

    if (document.getElementById(id) == null)
    {
        return;
    }
    node = document.getElementById(id);
    node.parentNode.removeChild(node);
}

function removeElementsByClassName(className)
{
    var nodes;

    if (document.getElementsByClassName(className).length == 0)
    {
        console.warn(
            'The specified element is not existed. ' +
            '1st argument has to be fixed.'
        );
        return;
    }
    nodes = document.getElementsByClassName(className);
    while (nodes.length > 0)
    {
        nodes[nodes.length - 1].parentNode.removeChild(
            nodes[nodes.length - 1]
        );
    }
}

function hideElementById(id)
{
    var node;

    node = document.getElementById(id);
    node.style.display = 'none';
}

function unhideElementById(id)
{
    var node;

    node = document.getElementById(id);
    node.style.display = 'block';
}

function hideElementsByClassName(className, bool)
{
    var nodes;

    if (document.getElementsByClassName(className) == null)
    {
        console.warn(
            'The specified element is not existed.' +
            '1st argument has to be fixed.'
        );
        return;
    }
    if (bool == undefined)
    {
        bool = true;
    }
    nodes = document.getElementsByClassName(className);
    for (var node in nodes)
    {
        if (bool == true)
        {
            node.style.display = 'none';
        }
        else
        {
            node.style.display = 'block';
        }
    }
}

/**
 * Create and draw a set of HTML elements for each talk
 * @param {Object} listItem A set object of each talk content
 */
function createItem(listItem, className)
{
    var defList = document.createElement('dl');
    var defTerm = document.createElement('dt');
    var defDesc = document.createElement('dd');
    var itemAnchor = document.createElement('a');
    var itemPortrait = document.createElement('img');
    var itemDate = document.createElement('span');
    var itemDateContent = document.createTextNode(getDateString(listItem.date));
    var re_link =
        new RegExp(/(s?https?:\/\/[-_.!~*'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/g);
    var re_twitter_hash = new RegExp(/#((?![a-z0-9]+;)[A-Za-z0-9_]+)/gi);
    var re_twitter_id = new RegExp(/@([A-Za-z0-9_]{1,14}(?![a-z0-9_]))/g);
    var itemContent = listItem.content.replace(
        re_link,
        '<a href="$1" target="_blank">$1</a>'
    ).replace(
        re_twitter_hash,
        '<a href="http://twitter.com/search/%23$1" target="_blank">&#035;$1</a>'
    ).replace(
        re_twitter_id,
        '<a href="http://twitter.com/$1" target="_blank">@$1</a>'
    );

    defList.setAttribute('class', className);
    itemAnchor.setAttribute('href', listItem.permalink_url);
    itemAnchor.setAttribute('target', '_blank');
    itemPortrait.setAttribute('src', listItem.author.photo_url);
    itemPortrait.setAttribute('alt', listItem.author.name);
    itemPortrait.setAttribute('width', '32');
    itemPortrait.setAttribute('height', '32');
    itemDate.setAttribute('class', 'date');
    defList.appendChild(defTerm);
    defList.appendChild(defDesc);
    defTerm.appendChild(itemAnchor);
    defTerm.appendChild(itemDate);
    defDesc.innerHTML = itemContent;
    itemAnchor.appendChild(itemPortrait);
    itemDate.appendChild(itemDateContent);
    document.getElementById('talks').appendChild(defList);

    // Temporary
    var defLists = document.getElementsByClassName(className);
    var summary =document.createTextNode(
        defLists.length + ' of ' + cache.total + ' items'
    ); 
    document.getElementById('summary').replaceChild(summary, summary);
}

/**
 * Process HTTP GET request and pass the result to callback function
 * @param {String} url A URL string for HTTP GET request.
 * @param {Function} callback A called function when HTTP request is finished.
 */
function getHttpData(url, callback)
{
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 2)
        {
            request += 1;
            console.log(request + ' times in total requested.');
        }
        if (xhr.readyState == 4 && xhr.status == 200)
        {
            callback(xhr);
        }
    }
    xhr.open('GET', url, true);
    xhr.send();
}

/**
 * Fetch Topsy Otter API trackbacks and generate page contents by the response.
 * @see http://otter.topsy.com/
 * @param {String} param_url A URL string for the API parameter.
 * @param {Number} param_page An optinal number of page parameter.
 */
function getTrackbacks(param_url, param_page)
{
    const PERPAGE = 50;
    var url = 'http://otter.topsy.com/trackbacks.json?';
 
    if (param_url.match(/^https?:\/\/.*/) == null)
    {
        hideElementById('loader');
        document.getElementById('talks').innerHTML = 'Nothing to load.'
        return;
    }   
    url += 'url=' + encodeURIComponent(param_url);
    if (param_page) url += '&page=' + param_page.toString();
    url += '&perpage=' + PERPAGE.toString() ;

    getHttpData(
        url,
        function(xhr)
        {
            var response = JSON.parse(xhr.responseText).response;
            var totalpage = Math.ceil(response.total / PERPAGE);

            if (response.total == 0)
            {
                hideElementById('loader');
                document.getElementById('talks').innerHTML = 'Nothing to load.'
                return;
            }
            if (cache.topsy_trackback_url == '')
            {
                cache.topsy_trackback_url = response.topsy_trackback_url;
                document.getElementById('topsy').setAttribute(
                    'href',
                    cache.topsy_trackback_url
                );
            }
            if (cache.total == 0)
            {
                cache.total = response.total;
            }
            for (var i = 0; i < response.list.length; i++)
            {
                cache.list.push(response.list[i]);
                if (response.page == 1)
                {
                    createItem(response.list[i], 'talk');
                }
            }
            console.log(
                cache.list.length + ' of ' +
                cache.total + ' items are stored.'
            );
            console.log(totalpage - response.page + ' pages left.');
            if (response.page + 1 <= totalpage)
            {
                getTrackbacks(param_url, response.page + 1);
            }
        }
    );
    console.log('GET: ' + url);
}


function getQueryTrackbacks(param_url, param_contains, param_page)
{
    const PERPAGE = 50;
    var url = 'http://otter.topsy.com/trackbacks.json?';
 
    if (param_url.match(/^https?:\/\/.*/) == null)
    {
        hideElementById('loader');
        document.getElementById('talks').innerHTML = 'Nothing to load.'
        return;
    }   
    url += 'url=' + encodeURIComponent(param_url);
    if (param_contains) url +=
        '&contains=' + encodeURIComponent(param_contains);
    if (param_page) url += '&page=' + param_page.toString();
    url += '&perpage=' + PERPAGE.toString() ;

    getHttpData(
        url,
        function(xhr)
        {
            var response = JSON.parse(xhr.responseText).response;
            var totalpage = Math.ceil(response.total / PERPAGE);

            if (response.total == 0)
            {
                hideElementById('loader');
                document.getElementById('talks').innerHTML = 'Nothing to load.'
                return;
            }
            removeElementsByClassName('talk');
            removeElementsByClassName('query');
            for (var i = 0; i < response.list.length; i++)
            {
                createItem(response.list[i], 'query');
            }
            if (response.page + 1 <= totalpage)
            {
                getQueryTrackbacks(
                    param_url,
                    param_contains,
                    response.page + 1
                );
            }
        }
    );
    console.log('GET: ' + url);
}

/**
 * Start watching cache process asynchronously
 * @function
 */
var timer = setInterval(
    function()
    {
        var defLists = document.getElementsByClassName('talk');

        if (cache.total != 0 &&
            cache.total == cache.list.length /*&&
            cache.total <= defLists.length*/)
        {
            hideElementById('loader');
            clearInterval(timer);
        }
    },
    1000 // 1 sec
);


document.getElementsByTagName('article')[0].addEventListener(
    'scroll',
    function()
    {
        var timer;

        var element = document.getElementsByTagName('article')[0];
        var scrollTop = element.scrollTop;
        var scrollHeight = element.scrollHeight;
        var offsetHeight = element.offsetHeight;
        //var clientHeight = element.clientHeight;
        var contentHeight = scrollHeight - offsetHeight;
        var defLists = document.getElementsByClassName('talk');
        var num = defLists.length;

        if (contentHeight <= scrollTop)
        {
            timer = setTimeout(
                function()
                {
                    for (var i = 0; i < 15; i++)
                    {
                        if (cache.list[num + i] != null)
                        {
                            createItem(cache.list[num + i], 'talk')
                        }
                    }
                    clearTimeout(sleep);
                },
                500 // 0.5 sec
            );
        }
    },
    false
);

/**
 * Wrap events for HTML Form
 * @function
 */
(
    function()
    {
        var defaultValue = document.isearch.pattern.value;

        document.isearch.pattern.addEventListener(
            'blur',
            function()
            {
                if (this.value == '')
                {
                    this.value = defaultValue;
                    this.style.color = '#aaa';
                }
            },
            true
        );
        document.isearch.pattern.addEventListener(
            'focus',
            function()
            {
                if (this.value == defaultValue)
                {
                    this.value = '';
                    this.style.color = '#000';
                }
            },
            true
        );
        document.isearch.pattern.addEventListener(
            'keyup',
            function()
            {
                filterItems('talk', this.value);
            },
            true
        );
        document.isearch.addEventListener(
            'submit',
            function(event)
            {
                /*
                if (this.pattern.value != '')
                {
                    window.location.href = '#page2';
                    getQueryTrackbacks(cachedTab.url, this.pattern.value);
                }*/
                event.preventDefault();
            },
            false
        );
        console.log('Form event listeners added.');
    }
)();

chrome.tabs.getSelected(
    undefined,
    function(tab)
    {
        console.log('Extension method started.');
        cachedTab = tab;
        getTrackbacks(tab.url);
        console.log('Extension method finished.');
    }
);

console.log('Sequential processes all done.');
