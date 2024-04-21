const { spawn } = require('child_process');

const RESTART_INTERVAL = 3 * 24 * 3600 * 1000;

const startCrawler = () => {
  return spawn('npm', ['run website'], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true
  });
}

const killCrawler = () => {
  if (child !== null && !child.killed) {
    isWin ? spawn("taskkill", ["/pid", child.pid, '/f', '/t']): child.kill('SIGINT');
    child = null;
  }
}

let child = startCrawler();
if(child !== null) {
  console.log(`Website crawler started: pid=${child.pid}`);
}

const isWin = process.platform === "win32";

process.on('SIGINT', () => {
  killCrawler();
  console.log('SIGINT received. Exit, bye!');
  process.exit();
})

setInterval(() => {
  try {
    killCrawler();
    child = startCrawler();
    if(child !== null) {
      console.log(`Website crawler restarted: pid=${child.pid}`);
    }
  }
  catch (e) {
    console.error("Exception: ", e);
  }
},
  RESTART_INTERVAL
);