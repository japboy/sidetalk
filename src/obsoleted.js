/**
 * Obsoleted codes
 */

function formatTemplate(arg1, arg2)
{
    // Declaration and initialisation
    var variable;
    var number = 0;
    var string = '';
    var object = new Object();

    // Declaration and assignment
    var anotherNumber = number + arg1;
    var anotherString = variable.toString();
    var anotherObject = new RegExp(/somestring/, 'ig');

    // Assignment and check processes
    number += anotherNumber;
    string = 'some string' + anotherString;
    object.property = 'some property value';
    if (typeof(arg2) == 'number')
    {
        number += arg2;
        // do someething
    }
    else
    {
        // do something else
    }

    // Main processes

    // continue coding
}

/**
 * Generate HTML contents dynamically from JSON data
 * @param {Object} data Response data formatted as JSON object.
 */
function createContents(data)
{
    var listItem, listItemTitle, listItemContent,
        listItemAnchor, listItemPortrait, listItemTweet;

    for (var i = 0; i < data.list.length; i++)
    {
        listItem = document.createElement('dl');
        listItemTitle = document.createElement('dt');
        listItemContent = document.createElement('dd');
        listItemAnchor = document.createElement('a');
        listItemPortrait = document.createElement('img');
        listItemContent.innerHTML = data.list[i].content;
        //listItemTweet = document.createTextNode(data.list[i].content);

        listItem.setAttribute('class', 'list');
        listItemAnchor.setAttribute('href', data.list[i].permalink_url);
        listItemAnchor.setAttribute('target', '_blank');
        listItemPortrait.setAttribute('src', data.list[i].author.photo_url);
        listItemPortrait.setAttribute('alt', data.list[i].author.name);
        listItemPortrait.setAttribute('width', '48');
        listItemPortrait.setAttribute('height', '48');

        listItemAnchor.appendChild(listItemPortrait);
        listItemTitle.appendChild(listItemAnchor);
        //listItemContent.appendChild(listItemTweet);
        listItem.appendChild(listItemTitle);
        listItem.appendChild(listItemContent);

        document.getElementById('tweets').appendChild(listItem);
    }
}

function composeTrackbacksParams(contains, page)
{
    var params = '';

    if (typeof(contains) == 'string')
    {
        params += '&contains=' + encodeURIComponent(contains);
    }
    if (typeof(page) == 'number')
    {
        params += '&page=' + page.toString();
    }
    return params;
}

/**
 * Get tracbacks by Topsy RESTful API
 * @param {String} url A URL string that is sent to the API.
 * @param {String} contains Optional keywords that query to the API.
 * @param {Number} page Desired number of pages.
 */
function getTrackbacksTemp(url, contains, page, callback)
{
    var perpage = 50;
    var xhr = new XMLHttpRequest();

    if (url.match(/^https?:\/\/.*/) == null)
    {
        removeElementById('loader');
        return;
    }
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 2)
        {
            document.getElementById('loader').style.display = 'block';
        }
        if (xhr.readyState == 4 && xhr.status == 200)
        {
            var resp = JSON.parse(xhr.responseText);
            var totalpage = Math.ceil(resp.response.total / perpage);

            callback(resp.response);
            createContents(resp.response);
            if (page == undefined)
            {
                page = 2;
            }
            else
            {
                page += 1;
            }
            window.addEventListener(
                'scroll',
                function()
                {
                    var currentScroll = document.documentElement.scrollTop ||
                        document.body.scrollTop;
                    var totalHeight = document.body.offsetHeight;
                    var visibleHeight = document.documentElement.clientHeight;

                    document.getElementById('test').innerHTML = 
                        'C: ' + currentScroll + ', ' + 
                        'V: ' + visibleHeight + ', ' + 
                        'H: ' + totalHeight + ', ' +
                        document.body.getElementsByTagName('dl').length +
                        ' / ' + resp.response.total + ' items, ' +
                        'p. ' + resp.response.page + ', ' +
                        'length: ' + resp.response.list.length;

                    if (totalHeight <= currentScroll + visibleHeight)
                    {
                        if (page >= 2 &&
                            page <=  totalpage &&
                            perpage < resp.response.total)
                        {
                            getTrackbacks(url, contains, page);
                            // FIXME: This is called too many times...
                        }
                    }
                },
                false
            );
            removeElementById('loader');
            //document.getElementById('loader').style.display = 'none';
        }
    }
    xhr.open(
        'GET',
        'http://otter.topsy.com/trackbacks.json?' +
            'url=' + encodeURIComponent(url) +
            composeTrackbacksParams(contains, page) +
            '&perpage=' + perpage.toString(),
        true
    );
    xhr.send();
}
