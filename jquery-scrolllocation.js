/**
 * @license GNU General Public License v2 http://www.gnu.org/licenses/gpl-2.0
 * @author BlueMöhre <bluemoehre@gmx.de>
 * @copyright 2015 BlueMöhre
 * @link http://www.github.com/bluemoehre
 */
(function ($, win, doc) {

    'use strict';

    /**
     * The plugin name and data-attribute name/selector
     * WARNING: THIS WILL OVERWRITE NATIVE AND PREVIOUSLY REGISTERED JQUERY FUNCTIONS - CHOOSE WITH CARE!
     * @type {!string}
     */
    var PLUGIN_NAME = 'scrolllocation';

    /**
     * The plugin options
     * @type {!Object}
     */
    var opts = {
        /**
         * Available modes:
         * - "trigger" will change the URL when rolling over a page container's top
         * - "cover" will change and keep the URL while the page container is at the viewport offset
         */
        mode: 'trigger',
        /**
         * Attribute which contains the content's original location
         * @type {!string}
         */
        locationAttribute: 'data-location',
        /**
         * Distance from viewport top to page switch threshold.
         * Value in percent.
         * @type {!number}
         */
        viewportOffset: 25
    };

    /**
     * @type {!jQuery}
     */
    var $win = $(win);

    /**
     * @type {!jQuery}
     */
    var $doc = $(doc);

    /**
     * All elements which contain a location attribute
     * @type {!Array}
     */
    var elements = [];

    /**
     * @type {string}
     */
    var initialLocation = win.location.href;

    /**
     * Timeout for preventing too many tests while scrolling
     * @type {?number}
     */
    var delayedTestForLocationChange = null;



    /**
     * Refreshes the list of elements which contain a location attribute
     */
    function refreshElements() {
        elements = $doc.find('[' + opts.locationAttribute + ']').toArray();
    }

    /**
     * Returns the location element which is the currently viewed one or NULL
     * @return {(HTMLElement|null)}
     */
    function getBestElement() {
        var viewportThreshold = opts.viewportOffset / 100 * $win.height();
        var bodyTop = document.body.getBoundingClientRect().top;
        var bestElementTop = null;
        var bestElement = null;
        var tmpBCR;

        if (opts.mode == 'cover') {
            for (var i = 0; i < elements.length; i++) {
                tmpBCR = elements[i].getBoundingClientRect();
                if (tmpBCR.top <= viewportThreshold && tmpBCR.top + tmpBCR.height > viewportThreshold) {
                    bestElement = elements[i];
                    break;
                }
            }
        }
        else if (opts.mode == 'trigger') {
            for (var i = 0; i < elements.length; i++) {
                tmpBCR = elements[i].getBoundingClientRect();
                if (tmpBCR.top <= viewportThreshold && tmpBCR.top - bodyTop  > bestElementTop) {
                    bestElement = elements[i];
                    bestElementTop = tmpBCR.top - bodyTop;
                }
            }
        }

        return bestElement
    }

    /**
     * Returns the full URL based on current page modified by URL parts
     *
     * @param urlPart
     * @return {string}
     */
    function generateUrl(urlPart){
        var el = doc.createElement('a')
        el.setAttribute('href', urlPart);

        return el.href;
    }

    /**
     * Tests and updates the location if needed
     */
    function testForLocationChange() {
        var currentLocation = window.location.href;
        var bestElement = getBestElement();
        var bestLocation = generateUrl(bestElement ? $(bestElement).attr(opts.locationAttribute) : initialLocation);
        if (currentLocation != bestLocation) {
            updateLocation(bestLocation);
        }
    }

    /**
     * Updates the location and history entry
     * @param {string} url
     */
    function updateLocation(url) {
        var stateObj = win.history.state || {};
        win.history.replaceState(stateObj, null, url);
    }



    // Register directly to jQuery to give the possibility of overwriting the default options
    $[PLUGIN_NAME] = function (opts) {
        if (typeof opts === 'object') {
            $.extend(opts, opts);
        } else {
            $.error('Expected configuration object');
        }
    };

    // Try using a global config object
    try {
        $.extend(opts, win.config[PLUGIN_NAME]);
    } catch (e) {}

    // Register all nodes which have a location attribute
    $doc.on('ready DOMContentAdded', function () {
        refreshElements();
    });

    $doc.on('scroll', function () {
        delayedTestForLocationChange = delayedTestForLocationChange || setTimeout(function () {
            testForLocationChange();
            delayedTestForLocationChange = null;
        }, 100);
    });

})(jQuery, window, document);