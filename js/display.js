(function () {
  var STORAGE = chrome.storage.local;
  var FILTER_TODAY_KEY = 'filter-today';
  var MAX_ITEMS_KEY = 'max-items-count';
  var MAX_ITEMS_OPTIONS = ['', '5', '10', '15', '20', '30'];
  var EXCLUDE_HOST_LIST = ['newtab'];
  var filter = null;

  // convert iso to locale date
  var tzoffset = (new Date()).getTimezoneOffset() * 60000; // in ms
  var todaysDate = new Date(Date.now() - tzoffset).toISOString().substr(0, 10);

  // Get filters
  STORAGE.get(FILTER_TODAY_KEY, function(obj) {
    var filter_today_value = obj[FILTER_TODAY_KEY];
    // set the value of checkbox 
    document.getElementById(FILTER_TODAY_KEY).checked = filter_today_value;
    if (filter_today_value) {
      filter = { date: todaysDate };
    } else {
      filter = null;
    }
    get_all(filter, display);
  });

  // Get filters and set UI element
  STORAGE.get(MAX_ITEMS_KEY, function(obj) {
    var idx = MAX_ITEMS_OPTIONS.indexOf(obj[MAX_ITEMS_KEY]);
    document.getElementById('max-items').selectedIndex = idx;
  });

  // Set today filter
  var today = document.querySelector('input[name=today]');
  today.addEventListener('change', function () {
    if(this.checked) {
      STORAGE.set({ [FILTER_TODAY_KEY]: true });
      filter = { date: todaysDate };
    } else {
      STORAGE.set({ [FILTER_TODAY_KEY]: false });
      filter = null;
    }
    get_all(filter, display);
  });

  // Set display max items filter
  var maxItems = document.querySelector('select[name=max_items]');
  maxItems.addEventListener('change', function () {
    var count = this.value;
    STORAGE.set({ [MAX_ITEMS_KEY]: count });
    get_all(filter, display);
  });

  // Get all items and display
  function get_all(filters, cb) {
    STORAGE.get(function (items) {
      // Flatten the object to { host: 'time' } format 
      // Original format is { 'yyyy-mm-dd-hh': { 'host': time, ... }, ... }

      var data = Object.keys(items).reduce(function (initial, key) {
        // get only date objects and remvoe filters and others
        if (typeof items[key] !== 'object') return initial;
        
        // date filter
        if (filters && filters.date && 
          key.substr(0, 10) !== filters.date) {
          return initial;
        }
        
        function sum (init, k) {
          // exclude selected hosts
          if (EXCLUDE_HOST_LIST.includes(k)) return initial;

          if (initial[k]) initial[k] += items[key][k];
          else initial[k] = items[key][k];
          return initial;
        }

        return Object.keys(items[key]).reduce(sum, {});
      }, {});

      // Convert this to array
      var arr = Object.keys(data).map(function (host) {
        return { host: host, value: data[host] };
      }).sort(function (a, b) { return b.value - a.value });

      cb(arr);
    });
  }

  function display(arr) {
    var total = arr.map(x => x.value).reduce((a, b) => a + b, 0)
    STORAGE.get(MAX_ITEMS_KEY, function(obj) {  
      var count = obj[MAX_ITEMS_KEY] || undefined;
      document.getElementById('results').innerHTML = `
        <div class="my-2"><strong>${time_display(total)}</strong><br /></div>
        ${arr.map(function (item) { 
          return `<div class="row">${time_display(item.value)} &nbsp; ${item.host}</div>`; 
        }).slice(0, count).join('\n')}
      `;
    });
  }

  function time_display(value) {
    if (value < 60) return value + 's';
    if (value > (60 * 60)) return (value / (60*60)).toFixed(1) + 'h';
    return Math.ceil(value / 60) + 'm';
  }
})();
