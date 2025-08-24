import axios from 'axios'

const BACKEND = 'http://localhost:3001'

async function drivePattern() {
  // Simple square pattern
  for (let i = 0; i < 4; i++) {
    await turnRight();
    for (let j = 0; j < 10; j++) {
      await forward();
      await sleep(200);
    }
  }
}

async function forward() {
  await axios.post(`${BACKEND}/tx`, { cmd: 'FORWARD' })
}
async function back() {
  await axios.post(`${BACKEND}/tx`, { cmd: 'BACK' })
}
async function left() {
  await axios.post(`${BACKEND}/tx`, { cmd: 'LEFT' })
}
async function right() {
  await axios.post(`${BACKEND}/tx`, { cmd: 'RIGHT' })
}
async function turnRight() { await right(); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  console.log('simulator: driving a square pattern...')
  await drivePattern()
  console.log('done')
}

main().catch((e) => console.error(e))
