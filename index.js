import fetch from 'node-fetch'
import chalk from 'chalk'
import cheerio from 'cheerio'
import notifier from 'node-notifier'

import { SAMPLE_RESULT_WITHOUT_DATE, SAMPLE_RESULT_WITH_DATE } from './sample_htmls.js'


// TODO: these values should be cli params
const MONTHS = [4, 5, 6, 7] // ints that represent months to be checked
const YEAR = 2021
const CALL_INTERVAL_MINUTES = 2

const CALL_INTERVAL_MS = 1000 * 60 * CALL_INTERVAL_MINUTES
const CSRF_REGEX = /CSRFToken=(\w*)\'/


async function getCookieAndCSRFToken() {
  let response
  try {
    response = await fetch('https://evisaforms.state.gov/acs/default.asp?postcode=SNJ&appcode=1')
    if (!response.ok) throw Error(response.status)
  } catch(err) {
    throw new Error(`Failed to get cookie or csrf token${err.code ? `: ${err.code}` : `\n${JSON.stringify(err)}`}`)
  }

  const text = await response.text()

  const cookie = response.headers.get('set-cookie').split(';')[0] // get the first cookie
  // could use cheerio, but evaluating all html as a string seems easier. the same CSRF token
  // appears twice on the page, in this same format
  const csrfToken = text.match(CSRF_REGEX)[1] // index 1 is the first group match

  if (!cookie || ! csrfToken) { throw new Error('Unable to extract cookie/csrf token from response') }

  return { cookie, csrfToken }
}

function makeMonthRequestPromise(cookie, csrfToken, month) {
  return fetch(`https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=${csrfToken}&nMonth=${month}&nYear=${YEAR}&type=1&servicetype=06&pc=SNJ`, {
    headers: {
      'Connection': 'keep-alive',
      'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Referer': 'https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=AD406CCFF7524F7383E13726D05205CD&nMonth=10&nYear=2021&type=1&servicetype=06&pc=SNJ',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
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
    const { cookie, csrfToken } = await getCookieAndCSRFToken()
    results = await fetchMonths(cookie, csrfToken)
  } catch (err) {
    console.error(chalk.red('\nError\n====='))
    console.error(typeof err.message === 'string' ? chalk.red(err.message) : err)
    return
  }

  const monthsWithAvailableAppts = results.map((resultHtml, idx) => {
    const $ = cheerio.load(resultHtml)
    return { month: MONTHS[idx], available: !!$('td[bgcolor="#ffffc0"]').text().trim() }
  })

  if (monthsWithAvailableAppts.some(monthObj => monthObj.available)) {
    const msg = 'Appointment(s) available!'
    notifier.notify(msg)
    console.log(chalk.green(`\n${msg}`))
    console.log(monthsWithAvailableAppts)
    return
  }

  if (options.quiet) { // for running with setInterval
    process.stdout.write('.')
  } else { // for individual runs, or first of a setInterval run
    console.log(`No available appointments for months ${MONTHS.join(', ')}`)
  }
}

async function main() {
  task({ quiet: false })
  setInterval(task, CALL_INTERVAL_MS)
}

main()
