/* Script to refresh a form content when an element gets changed
To work across all admin pages, this script needs to be loaded in admin.php
    – add the line $config->scripts->add($config->urls->templates . "scripts/form-update.js"); before the final require in templates/admin.php.
Typical use is to modify other elements based on a select drop-down change
The trigger element can have the following data attributes assigned to it (typically set these with $myInputfield->attr() in a module or hook):
* data-action="form-update" : Required to run the script.
* data-update-target="#myid" : Required - the element to change. Note that this should not be the whole form, otherwise .find(target) will not find it.
* data-value : Optional value to use instead of value - will over-ride if present
* data-confirm="Some confirmation text": Optional - if you want to show a confirmation before the update, this holds the text to display. If absent, there will be no confirmation dialogue.
                If the user chooses ‘cancel’, the script will revert the change and terminate.
* data-alert="Some alert text": Optional – if you want to warn the user that the update cannot happen for some reason (the script will then revert the change and terminate).
* data-cache="#myid1" : Optional - if you want to cache the (changed) value, this element stores it.
* data-cache-2="#myid2" : Optional - for an additional cached item, if paired with the value to be cached as data-value-2
* data-cache-prefix="Some prefix string" : Optional (requires data-cache) - a prefix to prepend the value stored in the cache
* data-update-reply="reply string" : If supplied, the script will return a trigger 'form-update:changed' with reply as a parameter, so that other js can process this as appropriate
This currently works with the following Inputfield trigger elements:
* select options
* select page (single and multiple)
* page list select (single and multiple)
* asm select (but note that data attributes must be set in the wrapper element - e.g.  $myInputfield->wrapAttr() )
* page autocomplete (but note that data attributes must be set in the wrapper element - e.g.  $myInputfield->wrapAttr() )
     Note also that autocomplete only works fully with the latest master 3.0.148
* checkboxes (set attributes in wrapper as above)
* checkbox (set attributes in wrapper as above; also, if you need to set or get the value (0 or 1) you may need to use getParent() )
* toggle (but only with 0,1 formatting and 'select' input type; plus see the comments for checkbox above)
* button (but note that you may need to use data-value for the data and data-cache for the field to update)
but not with:
* toggle other than as described above
* radio buttons

NOTE: If you are using this with other js scripts (e.g. in a module) that listen for events in the target, you must use event delegation
(e.g. $(document).on("change","#myid", function(){}); NOT $("#myid").onchange(function(){}); ) because #myid is dynamic if it is inside the target)
 */

$(document).on('change focusin', '[data-action="form-update"]', formUpdate); // need 'change' to catch normal select fields and 'mouseenter' for others

function formUpdate(event) {
    value = inputVal(this);
    value2 = $(this).data('value-2');
    if (event.type != 'change' && event.type != 'click') {   // if the input has not changed, just get the value now so that we can revert if necessary when it is changed
        $(this).data('oldPrevVal', $(this).data('prevVal'));
        $(this).data('prevVal', value);
        return;
    }
    $(this).data('currVal', value);
    var oldPrev = $(this).data('oldPrevVal');
    var prev = $(this).data('prevVal');
    var current = $(this).data('currVal');

    // if trigger element has data-confirm attribute, confirm or revert and exit
    var confirmText = $(this).data('confirm');
    if (confirmText) {
        if (!confirm(confirmText)) {
            $(this).val(inputVal(this, prev));
            return;
        }
    }
    // if trigger element has data-alert attribute, show alert and exit
    var alertText = $(this).data('alert');
    if (alertText) {
        alert(alertText);
        $(this).val(inputVal(this, prev));
        return;
    }
    // cache the value before proceeding (if data-cache set)
    var cache = $(this).data('cache');
    var cache2 = $(this).data('cache-2');
    var cachePrefix = ($(this).data('cache-prefix')) ? $(this).data('cache-prefix') : '';
    inputVal(cache, cachePrefix + current);
    inputVal(cache2, cachePrefix + value2);
    var $form = $(this).closest('form');
    var target = $(this).data('update-target');
    var reply = $(this).data('update-reply');
    var method = $form.attr('method');
    var action = $form.attr('action');
    var data = $form.serialize();
    var encodedName;
    // .serialize() will omit select elements that do not have a 'null' option (e.g. asm select, page list select)
    // or checkboxes with nothing selected
    // so find them and add empty parameters to the data string, otherwise the page field will not be updated
    $($form.find('select, input').each(function (index) {
        // console.log('Select element no. ' + index + ' with name ' + $(this).attr("name") + ' has serialize = ' + $(this).serialize());
        encodedName = encodeURI($(this).attr("name"));
        if (data.search(encodedName) === -1) {
            data += ('&' + encodeURI($(this).attr("name")) + '=');
        }
    }));
    if (!method)
        method = 'get';
    if (!action)
        action = window.location.href;
    if (!target)
        target = $form;
    // If you want to fade the affected inputfields then assign the loading class to their wrappers with method wrapClass(loading)
    $(target).find('.loading').css({
        display: 'block',
        opacity: 0.2
    }).animate({
        opacity: 1
    }, 5000);
    // then send your request
    // alert('requesting');
    $.ajax(action, {
        type: method,  // type used, not method, for older versions of jquery
        data: data,
        // you can also add an error handler here if required, in case the server returns an error on the request
        success: function (data) {
            // alert('requesting2');
            // Initial ajax just returns an array with message. Need to GET the form data.
            $.ajax(window.location.href, {
                dataType: "html",
                type: 'GET', cache: false, success: function (data, jq) {
                    // then just take the target, and replace it with the target div from the returned data
                    $(target).html($(data).find(target).html());
                    $(target).load(document.URL +  ' ' + target + '> *'); // force reload of target to make sure it displays
                    if (reply) {
                        $(document).trigger('form-update:changed', [reply]);  // flag for other scripts to use after completion of ajax call
                    }
                    // alert('returned');
                } , error: function(jq, status, errorThrown) {
                }
            });
        }
    });
}

function inputVal(el, val=null) {
    var value = $(el).val();
    var inputfield = $(el);
    if ($(el).hasClass('InputfieldCheckbox')) {
        inputfield = $(el).find("input[type='checkbox'], input[type='radio']").first();
        if (val === 1) {
            $(inputfield).attr('checked', 'checked');
        } else if (val === 0) {
            $(inputfield).removeAttr('checked');
        }
        value = ($(inputfield).attr('checked') === 'checked') ? 1 : 0;
    } else if ($(el).hasClass('InputfieldToggle')) {
        inputfield = $(el).find("option[selected='selected']").first();
        if (val === '1') {
            $(inputfield).attr('selected', 'selected');
        } else if (val === '0') {
            $(inputfield).removeAttr('selected');
        }
        value = ($(inputfield).attr('selected') === 'selected') ? '1' : '0';
    } else if (($(el).hasClass('InputfieldPage') || $(el).hasClass('InputfieldPageAutocomplete')) && $(el).find(".InputfieldPageAutocompleteData").first().val()) {
        inputfield = $(el).find(".InputfieldPageAutocompleteData").first();
        value = ($(inputfield).val().startsWith(",")) ? $(inputfield).val().substr(1) : $(inputfield).val();  //autocomplete fields may have leading commas
    } else if ($(el).hasClass('InputfieldPage')) {
        inputfield = $(el).find("select option[selected='selected']").first();
        value = $(inputfield).val();
    } else if ($(el).data('value')) {
        console.log("using data-value");
        value = $(el).data('value');
    } else {
        console.log("other selector type");
        if (val !== null || val === "") {
            $(el).val(val);
        }
        value = $(el).val();
    }
    console.log("returning value = " + value);
    return value;
}
