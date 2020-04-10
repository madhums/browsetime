chrome.storage.local.get(function (items) {

  // Flatten the object to { host: 'time' } format 
  // Original format is { 'yyyy-mm-dd-hh': { 'host': time, ... }, ... }

  var data = Object.keys(items).reduce(function (initial, key) {
    return Object.keys(items[key]).reduce(function (init, k) {
      if (initial[k]) initial[k] += items[key][k];
      else initial[k] = items[key][k];
      return initial;
    }, {});
  }, {});

  // Convert this to array
  var arr = Object.keys(data).map(function (host) {
    return { host: host, value: data[host] };
  }).sort(function (a, b) { return b.value - a.value });

  document.getElementById('app').innerHTML = `
    ${arr.map(function (item) { 
      return `${time_display(item.value)} &nbsp; ${item.host}`; 
    }).join('<br />')}
  `;
});

function time_display(value) {
  if (value < 60) return value + 's';
  if (value > (60 * 60)) return (value / (60*60)).toFixed(1) + 'h';
  return Math.ceil(value / 60) + 'm';
}
