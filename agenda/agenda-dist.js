(function() {
'use strict';

/**
 * agenda.js
 *
 * Parses program data from agenda.json and automatically populated agenda page in readable format.
 *
 * @author    Kelli Rockwell <kellirockwell@mail.com>
 * @since     File available since August 10th, 2017
 * @version   1.0.0
 */

// Variable for storing all of the program data retrieved from json
var progData = { schedule: Array(0) };

// Array for storing all the different event types for creating bubble legend
var eventTypes = [];

// Read in agenda data from json
$.getJSON('agenda.min.json', function (data) {
  progData = data;
  addAgenda();
});

// Function for populating the whole agenda via data read in from json
var addAgenda = function addAgenda() {
  var agendaContent = "";
  // Wait until agenda data has been loaded
  if (!progData.schedule.length) {
    setTimeout(function () {
      console.log('trying to fetch agenda again');
      addAgenda();
    }, 200);
  } else {
    // For each day of the schedule
    $(progData.schedule).each(function (i, day) {
      // Check if day is last day
      var isLast = i === progData.schedule.length - 1;
      // Add day to the agenda
      agendaContent += addDay({
        'day': day,
        'isLast': isLast
      });
    });
    // Fill agenda
    $('.agenda.spread').html(agendaContent);
    // Add events legend
    addLegend();
  }
};

// Adds a day to the agenda
var addDay = function addDay(_ref) {
  var day = _ref['day'],
      isLast = _ref['isLast'];

  // Define day of week and institution of the day
  var daySection = '<h1>' + day.day + '</h1>\n        <span class=\'campus reference\'>' + day.college + '$</span>\n            <div class=\'day table\'>\n';
  // For each event in the day
  $(day.events).each(function (i, eventObj) {
    // Add event to the agenda
    daySection += addEvent(eventObj);
  });
  daySection += "<!--end day table--></div>\n";
  // Add separator except on last day
  daySection += !isLast ? "<div class='separator'></div>" : "";
  return daySection;
};

// Adds an event card to a day
var addEvent = function addEvent(e) {
  // Add event card
  var eventCard = '<div class=\'event ' + e.sname + '\'>';
  // Add item name, time, place, and type designations
  eventCard += addBasicInfo(e);
  // Add expandable section with additional details for event
  eventCard += addExpandedInfo({
    'event': e,
    'isTalk': e.types.includes("talk"),
    'isBreakout': e.types.includes("breakout"),
    'shouldBeHidden': !e.shortDesc.length || e.shortDesc === "" || e.debugHide
  });
  eventCard += '<!--end event card--></div>\n';
  return eventCard;
};

// Adds name, time, place, and type designations for an event
var addBasicInfo = function addBasicInfo(e) {
  // Add container for event types
  var basicInfo = '<div class=\'type bubbles\'>\n';
  $(e.types).each(function (i, eType) {
    // If event type is not yet part of legend array
    if (!eventTypes.includes(eType)) {
      // Add it
      eventTypes.push(eType);
    }
    // Mark what type of event this is with span bubble element
    basicInfo += '<span class=\'' + eType + '\'></span>\n';
  });
  basicInfo += '<!--end type bubbles--></div>\n<div class=\'info\'>';
  // Add event name
  basicInfo += '<span class=\'name ' + e.sname + '\'>' + e.name;
  // Mark if event is Optional
  basicInfo += !e.required ? ' <span class=\'optional\'>(Optional)</span>' : '';
  basicInfo += '<!--end name span--></span>\n';
  // Add event time
  basicInfo += '<span class=\'time ' + e.sname + '\'>' + e.timeStart + ' - ' + e.timeEnd + '</span>';
  // Add event location
  basicInfo += '<span class=\'place ' + e.sname + '\'>' + e.place + '</span>';
  basicInfo += '<!--end info--></div>\n';
  return basicInfo;
};

// Adds expandable section with additional details for an event
var addExpandedInfo = function addExpandedInfo(_ref2) {
  var event = _ref2['event'],
      isTalk = _ref2['isTalk'],
      isBreakout = _ref2['isBreakout'],
      shouldBeHidden = _ref2['shouldBeHidden'];

  // Add desc/options element, if event is talk or breakout session
  var expandedInfo = "";
  if (isTalk && !shouldBeHidden) {
    expandedInfo += addTalkDesc(event);
  } else if (isBreakout && !shouldBeHidden) {
    expandedInfo += addBreakoutOptions(event);
  } else if (!shouldBeHidden) {
    expandedInfo += '<div class=\'about\'>\n<div class=\'inside flex ' + event.types[0] + '\'>\n<div class=\'desc\'>\n';
    expandedInfo += '<p>' + event.shortDesc + '</p>\n';
    expandedInfo += '<!--end desc--></div>\n<!--end inside flex--></div>\n<!-- end about--></div>';
  }
  return expandedInfo;
};

var addTalkDesc = function addTalkDesc(e) {
  var component = "";
  if (!e.speaker || e.speaker === "TBD" || e.debugHide) {
    return component;
  } else {
    component += "<div class='about'>\n<div class='inside flex " + e.types[0] + "'>\n<div class='desc'>\n";
    component += "<h2>" + e.speaker + " <em>" + e.speakerHome + "</em></h2>\n";
    component += "<div class='lil-img'><img src='../img/" + e.speakerImg + "'></div>\n";
    component += "<p>" + e.shortDesc + " Visit her <a target='_blank' href='" + e.speakerPage.URL + "'>" + e.speakerPage.type + "</a> to learn more.</p>\n";
    component += "</div>\n<div class='big-img'><img src='../img/" + e.speakerImg + "'></div>\n</div>\n</div>\n";
    return component;
  }
};

var addBreakoutOptions = function addBreakoutOptions(e) {
  var component = "";
  if (!e.options || e.options.length === 0 || e.debugHide) {
    return component;
  } else if (e.name.match(/breakout session \d of \d/i)) {
    // Remember current breakout session number by extracting from session name (i.e. "Breakout Session 1 of 3" => 1)
    var snum = parseInt(e.name.match(/\d of \d/)[0].substr(0, 1));
    // Label container with event types
    component += "<div class='about ";
    for (var t = 0; t < e.types.length; t++) {
      component += e.types[t];
      component += t + 1 === e.types.length ? "" : " ";
    }
    component += "'>\n<div class='inside flex'>\n<ul>\n";
    for (var id in progData.breakouts) {
      // Store current breakout session data
      var s = progData.breakouts[id];
      // If breakout session is included in current session number
      if (s.sessions.includes(snum)) {
        // Add breakout session occurrences
        component += "<li>\n<div class='occurrences'>";
        for (var i = 1; i < 4; i++) {
          component += s.sessions.includes(i) ? '<span class=\'indicator true\'>' + i + '</span>' : '<span class=\'indicator false\'>' + i + '</span>';
        }
        // Add breakout session info
        component += "</div>\n<div class='details'><span class='session'>" + s.name + "</span>";
        // If breakout session has special property
        if (s.hasOwnProperty("special")) {
          component += "<span class='label";
          // If breakout session is labeled as only occurring once
          component += s.special.toLowerCase().includes("once") ? " once'>" : "'>";
          component += s.special + "</span>";
        }
      }
      component += "</li>\n";
    }
    component += "</ul>\n</div>\n</div>\n";
    return component;
  } else if (e.name.match(/career/i)) {
    // Label container with event types
    component += "<div class='about ";
    for (var _t = 0; _t < e.types.length; _t++) {
      component += e.types[_t];
      component += _t + 1 === e.types.length ? "" : " ";
    }
    component += "'>\n<div class='inside flex'>\n<ul>\n";
    for (var _id in progData.careerBreakouts) {
      // Store current breakout session data
      var _s = progData.careerBreakouts[_id];
      // Add breakout session info
      component += "<li>\n<div class='details'><span class='session'>&#8226;&emsp;" + _s.name + "</span>";
      component += "</li>\n";
    }
    component += "</ul>\n</div>\n</div>\n";
    return component;
  }
};

// Build and insert legend of event types using populated eventTypes array
var addLegend = function addLegend() {
  var legend = "";
  // Sort event types alphabetically
  eventTypes.sort();
  // For each type of event
  $(eventTypes).each(function (i, eType) {
    // Produce proper (readable) name for event type
    var pn = eType;
    // For certain events, proper name is specially formatted
    if (eType == "breakout") {
      pn = "Breakout Session";
    } else if (eType == "free") {
      pn = "Free Time";
    } else if (eType == "misc") {
      pn = "Misc/Special";
    } else if (eType == "shuttle") {
      pn = "Shuttle Run";
    } else {
      // For all other events, just capitalize the first letter of non-proper name
      pn = pn.charAt(0).toUpperCase() + pn.slice(1);
    }
    legend += '<div><span class=\'' + eType + '\'></span>' + pn + '</div>\n';
  });
  // Fill legend
  $('.event.types.legend').html(legend);
};

// Clicking on agenda event type bubble
$('.agenda.spread').on('click', '.type.bubbles span', function (e) {
  if ($(window).width() <= 700) {
    if ($(e.target).hasClass('focused')) {
      $(e.target).removeClass('focused');
    } else {
      $(e.target).addClass('focused');
    }
  }
});

// On click anywhere outside event type bubble on mobile, close bubble
$('html').click(function (e) {
  if (!$(e.target).parents('.type.bubbles').length && $(window).width() <= 700) {
    $('.type.bubbles span').removeClass('focused');
  }
});

// Clicking agenda event will open event's details
$('.agenda.spread').on('click', '.event', function (e) {
  var $eventItem = $(e.target).closest('.event');
  if ($eventItem.hasClass('expanded')) {
    $eventItem.removeClass('expanded');
    $eventItem.find('.about').slideUp();
  } else {
    $eventItem.addClass('expanded');
    $eventItem.find('.about').slideDown();
  }
});

/* End of agenda.js */
})();
//# sourceMappingURL=agenda-dist.js.map
