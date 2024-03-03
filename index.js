import fetch from 'node-fetch'
import chalk from 'chalk'
import cheerio from 'cheerio'
import notifier from 'node-notifier'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

import { SAMPLE_RESULT_WITHOUT_DATE, SAMPLE_RESULT_WITH_DATE } from './sample_htmls.js'

const stealthPlugin = StealthPlugin()
stealthPlugin.enabledEvasions.delete('user-agent-override') // https://github.com/berstend/puppeteer-extra/issues/421#issuecomment-773656458
puppeteer.use(stealthPlugin)

// TODO: these values should be cli params
const MONTHS = [10, 11] // ints that represent months to be checked
const YEAR = 2022
const CALL_INTERVAL_MINUTES = 2
const EMBASSIES = {
  SANJOSE: { postCode: 'SNJ', displayName: 'San Jose, Costa Rica' },
  PARIS: { postCode: 'PRS', displayName: 'Paris, France' },
}
const EMBASSY = EMBASSIES.SANJOSE


const CALL_INTERVAL_MS = 1000 * 60 * CALL_INTERVAL_MINUTES
const CSRF_REGEX = /CSRFToken=(\w*)\'/
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36'
const DEFAULT_HEADERS = {
  'Connection': 'keep-alive',
  'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-User': '?1',
  'Sec-Fetch-Dest': 'document',
  'Referer': `https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=AD406CCFF7524F7383E13726D05205CD&nMonth=10&nYear=2021&type=1&servicetype=06&pc=${EMBASSY.postCode}`,
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
}

/**
 * Working as of Summer 2021. Previous commits have the old strategy.
 */
async function getCookieAndCSRFToken() {
  // for debugging. one metric of knowing if we're being detected as a bot
  // const url = 'https://arh.antoinevastel.com/bots/areyouheadless'
  const url = `https://evisaforms.state.gov/acs/default.asp?appcode=1&postcode=${EMBASSY.postCode}`
  let browser
  let cookiesString
  let csrfToken
  try {
    browser = await puppeteer.launch({
      // headless: false,
      // devtools: true,
      // slowMo: true,
      // defaultViewport: { // not sure this works
      //   width: 800,
      //   height: 800,
      // },
      // waitForInitialPage: true,
    })
    const page = await browser.newPage()
    page.setExtraHTTPHeaders({ ...DEFAULT_HEADERS })
    await page.setUserAgent(USER_AGENT)
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    const cookies = await page.cookies()
    const content = await page.content()

    cookiesString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    // could use cheerio, but evaluating all html as a string seems easier. the same CSRF token
    // appears twice on the page, in this same format
    csrfToken = content.match(CSRF_REGEX)[1] // index 1 is the first group match
  } finally {
    if (browser) { await browser.close() }
  }

  if (!cookiesString || ! csrfToken) { throw new Error('Unable to extract cookie/csrf token from response') }
  return { cookiesString, csrfToken }
}

function makeMonthRequestPromise(cookie, csrfToken, month) {
  return fetch(`https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=${csrfToken}&nMonth=${month}&nYear=${YEAR}&type=1&servicetype=06&pc=${EMBASSY}`, {
    headers: {
      ...DEFAULT_HEADERS,
      'Cookie': cookie,
    },
  })
}

async function fetchMonths(cookie, csrfToken) {
  const requests = MONTHS.map(month => makeMonthRequestPromise(cookie, csrfToken, month))
  try {
    const responses = await Promise.all(requests)
    responses.forEach(response => { if (!response.ok) throw new Error(response.status) } )
    return Promise.all(responses.map(response => response.text()))
  } catch(err) {
    throw new Error(`Failed to get months${err.code ? `: ${err.code}` : `\n${JSON.stringify(err)}`}`)
  }
}

async function task(options = { quiet: true }) {
  let results
  try {
    const { cookiesString, csrfToken } = await getCookieAndCSRFToken()
    results = await fetchMonths(cookiesString, csrfToken)
  } catch (err) {
    console.error(chalk.red('\nError\n====='))
    console.error(err)
    return
  }

  const monthsWithAvailableAppts = results.map((resultHtml, idx) => {
    const $ = cheerio.load(resultHtml)
    return { month: MONTHS[idx], available: !!$('td[bgcolor="#ffffc0"]').text().trim() }
  })

  if (monthsWithAvailableAppts.some(monthObj => monthObj.available)) {
    const msg = 'Appointment(s) available!'
    notifier.notify(msg)
    console.info(chalk.green(`\n${msg}`))
    console.info(monthsWithAvailableAppts)
    return
  }

  if (options.quiet) { // for running with setInterval
    process.stdout.write('.')
  } else { // for individual runs, or first of a setInterval run
    console.info(`No available appointments for months ${MONTHS.join(', ')} in ${EMBASSY.displayName} (${EMBASSY.postCode})`)
  }
}

async function main() {
  task({ quiet: false })
  setInterval(task, CALL_INTERVAL_MS)
}

main()
