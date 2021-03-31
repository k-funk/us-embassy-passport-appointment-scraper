import rp from 'request-promise-native' // TODO: this package is deprecated. use another
import cheerio from 'cheerio'

import { SAMPLE_RESULT_WITHOUT_DATE, SAMPLE_RESULT_WITH_DATE } from './sample_htmls.js'


const CSRF_REGEX = /CSRFToken=(\w*)\'/
const MONTHS = [4, 5, 6, 7, 8] // ints that represent months to be checked
const YEAR = 2021

async function getCookieAndCSRFToken() {
  try {
    const resp = await rp({
      uri: 'https://evisaforms.state.gov/acs/default.asp?postcode=SNJ&appcode=1',
      resolveWithFullResponse: true,
    })

    const cookie = resp.headers['set-cookie'][0].split(';')[0] // get the first cookie
    // could use cheerio, but evaluating all html as a string seems easier. the same CSRF token
    // appears twice on the page, in this same format
    const csrfToken = resp.body.match(CSRF_REGEX)[1] // index 1 is the first group match

    if (!cookie || ! csrfToken) { throw new Error() }

    return { cookie, csrfToken }
  } catch(err) {
    throw new Error('Failed to get cookie or csrf token')
  }
}

function makeMonthRequestPromise(cookie, csrfToken, month) {
  return rp({
    uri: `https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=${csrfToken}&nMonth=${month}&nYear=${YEAR}&type=1&servicetype=06&pc=SNJ`,
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
    json: true
  })
}

async function main() {
  try {
    const { cookie, csrfToken } = await getCookieAndCSRFToken()

    const requests = MONTHS.map(month => makeMonthRequestPromise(cookie, csrfToken, month))
    const results = await Promise.all(requests)

    const monthsWithAvailableAppts = results.map((resultHtml, idx) => {
      const $ = cheerio.load(resultHtml)
      return { month: MONTHS[idx], available: !!$('td[bgcolor="#ffffc0"]').text().trim() }
    })

    if (monthsWithAvailableAppts.some(monthObj => monthObj.available)) {
      console.log('Appointment(s) available!')
      console.log(monthsWithAvailableAppts)
      return
    }

    console.log(`No available appointments between months ${MONTHS[0]} and ${MONTHS[MONTHS.length -1]}`)
  } catch (err) {
    if (err.statusCode) {
      console.error('HTTP Error:', err.statusCode)
      return
    }

    console.error('Error\n=====\n', err)
  }
}

main()
