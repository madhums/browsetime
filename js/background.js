const STORAGE = chrome.storage.local;
const EXCLUDE_HOST_LIST = ['newtab'];
let active = {};

async function update (host, seconds) {
  // the keys are stored in the form of YYYY-MM-DD-HH
  const d = new Date();
  const date = d.toISOString().substr(0, 10);
  const hour = d.getHours();
  const key = date + '-' + hour;

  // get the data saved for the current date
  const data = await getData(key);
  
  if (data[host]) {
    data[host] += seconds;
  } else {
    data[host] = seconds;
  }

  // save the updated value
  save(key, data);
}

function save (key, value) {
  return new Promise((resolve) => STORAGE.set({ [key]: value }, resolve));
}

function getData (key) {
  return new Promise((resolve) => {
    STORAGE.get(key, result => (result[key] 
      ? resolve(result[key]) 
      : resolve({})
    ));
  });
}

function end () {
  if (active.name) {
    const timeDiff = parseInt((Date.now() - active.time) / 1000);
    console.log(`You spent ${timeDiff} seconds on ${active.name}`);
    // add it to the number of seconds already saved in chrome.storage.local
    update(active.name, timeDiff);
    active = {};
  }
}

async function setActive () {
  const activeTab = await getActiveTab();
  if (!activeTab) return;
  const { url } = activeTab; // can also get id as tabId
  if (!url) return;

  let host = new URL(url).hostname;

  // don't track hostnames
  if (EXCLUDE_HOST_LIST.includes(host)) return;
  
  // set the site and current time
  if (active.name !== host) {
    // if a different site is active then end the existing site's session
    end();
    active = {
      name: host,
      time: Date.now()
    };
    console.log(`${active.name} visited at ${active.time}`);
  }
}

function getActiveTab () {
  return new Promise(resolve => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, activeTab => {
      resolve(activeTab[0]);
    });
  });
}

chrome.tabs.onUpdated.addListener(() => {
  setActive();
});

chrome.tabs.onRemoved.addListener(() => {
  end();
});

chrome.tabs.onActivated.addListener(() => {
  if (active.name) {
    end();
  }
  // check to see if the active tab is among the sites being tracked
  setActive();
});

chrome.windows.onFocusChanged.addListener(window => {
  if (window === -1) {
    // browser lost focus
    end();
  } else {
    setActive();
  }
});

// Increase detection interval from default 60s to 3 times that
chrome.idle.setDetectionInterval(3 * 60);

// Listen to state change so that it doesn't track all the time
chrome.idle.onStateChanged.addListener((state) => {
  // also end when 'idle' but figure a way first to find out 
  // if no media is being played
  if (state === 'locked') end();
  else if (state === 'active') setActive();
});
